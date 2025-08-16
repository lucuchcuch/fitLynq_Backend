import { User } from '../models/user.model.js';
import { Activity } from '../models/activity.model.js';
import { Review } from '../models/review.model.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password -verificationToken -resetPasswordToken')
      .populate('recentActivities')
      .populate({
        path: 'reviews',
        populate: {
          path: 'reviewer',
          select: 'username profilePhoto'
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfileByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -verificationToken -resetPasswordToken')
      .populate({
        path: 'recentActivities',
        match: { date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Last 30 days
        options: { sort: { date: -1 }, limit: 6 }
      })
      .populate({
        path: 'reviews',
        populate: {
          path: 'reviewer',
          select: 'username profilePhoto'
        },
        options: { sort: { date: -1 } }
      })
      .populate('followers', 'username profilePhoto')
      .populate('following', 'username profilePhoto');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get fresh counts to ensure they're accurate
    const freshCounts = await User.findById(user._id)
      .select('followersCount followingCount');

    user.followersCount = freshCounts.followersCount;
    user.followingCount = freshCounts.followingCount;

    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.userId;
    let profilePhoto = null;

    // Upload new profile photo if provided
    if (req.file) {
      // Delete old photo if exists
      const user = await User.findById(userId);
      if (user.profilePhoto?.public_id) {
        await cloudinary.uploader.destroy(user.profilePhoto.public_id);
      }

      // Upload new photo
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'profile_photos',
        width: 500,
        height: 500,
        crop: 'fill',
        gravity: 'face'
      });

      profilePhoto = {
        public_id: result.public_id,
        url: result.secure_url
      };

      // Delete file from server
      fs.unlinkSync(req.file.path);
    }

    // Update user profile
    const updateData = { bio };
    if (profilePhoto) {
      updateData.profilePhoto = profilePhoto;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password -verificationToken -resetPasswordToken');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};