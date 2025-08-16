import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

export const getSettings = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.userId)
      .select('settings blockedUsers')
      .populate('blockedUsers', 'username profilePhoto.url');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      locationPrefs: user.settings?.locationPrefs || '',
      blockedUsers: user.blockedUsers || []
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch settings',
      error: error.message 
    });
  }
};

export const updateSettings = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { locationPrefs } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: { 'settings.locationPrefs': locationPrefs } },
      { new: true, session }
    ).select('settings');

    await session.commitTransaction();

    res.json({ 
      success: true,
      message: 'Settings updated successfully',
      settings: updatedUser.settings
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update settings',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

export const blockUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.body;
    const currentUserId = req.userId;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentUserId)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format' 
      });
    }

    // Check if trying to block self
    if (userId === currentUserId) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Cannot block yourself' 
      });
    }

    const [currentUser, userToBlock] = await Promise.all([
      User.findById(currentUserId).session(session),
      User.findById(userId).session(session)
    ]);

    if (!currentUser || !userToBlock) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if already blocked
    if (currentUser.blockedUsers.some(id => id.equals(userToBlock._id))) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'User already blocked' 
      });
    }

    // Block the user
    currentUser.blockedUsers.push(userToBlock._id);
    
    // Also unfollow if currently following
    if (currentUser.following.some(id => id.equals(userToBlock._id))) {
      currentUser.following = currentUser.following.filter(
        id => !id.equals(userToBlock._id)
      );
      userToBlock.followers = userToBlock.followers.filter(
        id => !id.equals(currentUser._id)
      );
      
      // Update counters
      currentUser.followingCount = currentUser.following.length;
      userToBlock.followersCount = userToBlock.followers.length;
      
      await userToBlock.save({ session });
    }

    await currentUser.save({ session });
    await session.commitTransaction();

    // Get updated blocked users list
    const updatedUser = await User.findById(currentUserId)
      .select('blockedUsers')
      .populate('blockedUsers', 'username profilePhoto.url');

    res.json({ 
      success: true,
      message: 'User blocked successfully',
      blockedUsers: updatedUser.blockedUsers
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error blocking user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to block user',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

export const unblockUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.body;
    const currentUserId = req.userId;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentUserId)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format' 
      });
    }

    const currentUser = await User.findById(currentUserId).session(session);

    if (!currentUser) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if user is actually blocked
    if (!currentUser.blockedUsers.some(id => id.equals(userId))) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'User not blocked' 
      });
    }

    // Unblock the user
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      id => !id.equals(userId)
    );

    await currentUser.save({ session });
    await session.commitTransaction();

    // Get updated blocked users list
    const updatedUser = await User.findById(currentUserId)
      .select('blockedUsers')
      .populate('blockedUsers', 'username profilePhoto.url');

    res.json({ 
      success: true,
      message: 'User unblocked successfully',
      blockedUsers: updatedUser.blockedUsers
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error unblocking user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to unblock user',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};