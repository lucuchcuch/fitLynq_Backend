import { User } from '../models/user.model.js';
import { Review } from '../models/review.model.js';

export const createReview = async (req, res) => {
  try {
    const { content, ratings } = req.body;
    const reviewer = req.userId;
    const reviewee = req.params.userId;

    if (!content || !ratings) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content and all ratings are required' 
      });
    }

    const existingReview = await Review.findOne({ reviewer, reviewee });
    if (existingReview) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already reviewed this user' 
      });
    }

    const revieweeUser = await User.findById(reviewee);
    if (!revieweeUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const review = new Review({
      reviewer,
      reviewee,
      content,
      ratings,
      date: new Date()
    });

    await review.save();

    await User.findByIdAndUpdate(reviewee, {
      $push: { reviews: review._id }
    });

    const user = await User.findById(reviewee).populate('reviews');

    // Define which rating fields to consider based on user type
    const ratingFields = revieweeUser.userType === 'business'
      ? ['cleanliness', 'equipmentQuality', 'staffFriendliness', 'safety', 'amenities', 'accessibility', 'valueForMoney']
      : ['sportiness', 'kindness', 'sociability', 'punctuality', 'teamwork', 'communication', 'reliability', 'fairPlay'];

    const initialAverages = Object.fromEntries(ratingFields.map(field => [field, 0]));
    const reviews = user.reviews;

    if (reviews.length > 0) {
      const sums = reviews.reduce((acc, r) => {
        ratingFields.forEach(field => {
          acc[field] += r.ratings[field] || 0;
        });
        return acc;
      }, { ...initialAverages });

      const count = reviews.length;
      const averageRatings = Object.fromEntries(
        ratingFields.map(field => [field, parseFloat((sums[field] / count).toFixed(1))])
      );

      // Update user with new averages
      await User.findByIdAndUpdate(reviewee, { 
        averageRatings: revieweeUser.userType === 'business' ? averageRatings : undefined,
        averageFacilityRatings: revieweeUser.userType === 'business' ? averageRatings : undefined
      });

      return res.status(201).json({
        success: true,
        review,
        averageRatings
      });
    } else {
      return res.status(201).json({
        success: true,
        review,
        averageRatings: initialAverages
      });
    }

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create review',
      error: error.message 
    });
  }
};

export const respondToReview = async (req, res) => {
  try {
    const { response } = req.body;
    const reviewId = req.params.reviewId;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { response },
      { new: true }
    ).populate('reviewer', 'username profilePhoto');

    res.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Error responding to review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to respond to review' 
    });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'username profilePhoto')
      .sort({ date: -1 });

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get reviews' 
    });
  }
};