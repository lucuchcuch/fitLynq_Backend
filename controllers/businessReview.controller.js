import { User } from '../models/user.model.js';
import { Review } from '../models/review.model.js';

export const createBusinessReview = async (req, res) => {
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
        message: 'You have already reviewed this business' 
      });
    }

    const business = await User.findById(reviewee);
    if (!business || business.userType !== 'business') {
      return res.status(400).json({ 
        success: false,
        message: 'Can only review business accounts' 
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

    const updatedBusiness = await User.findById(reviewee).populate('reviews');
    const reviews = updatedBusiness.reviews;
    
    const ratingFields = [
      'cleanliness', 'equipmentQuality', 'staffFriendliness', 
      'safety', 'amenities', 'accessibility', 'valueForMoney'
    ];

    const initialAverages = Object.fromEntries(ratingFields.map(field => [field, 0]));

    if (reviews.length > 0) {
      const sums = reviews.reduce((acc, review) => {
        ratingFields.forEach(field => {
          acc[field] += review.ratings[field] || 0;
        });
        return acc;
      }, { ...initialAverages });

      const count = reviews.length;
      const averageFacilityRatings = Object.fromEntries(
        ratingFields.map(field => [field, parseFloat((sums[field] / count).toFixed(1))])
      );

      await User.findByIdAndUpdate(reviewee, { averageFacilityRatings });

      res.status(201).json({ 
        success: true,
        review,
        averageFacilityRatings
      });
    } else {
      res.status(201).json({ 
        success: true,
        review,
        averageFacilityRatings: initialAverages
      });
    }

  } catch (error) {
    console.error('Error creating business review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create business review',
      error: error.message 
    });
  }
};