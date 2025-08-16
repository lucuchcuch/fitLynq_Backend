import mongoose from 'mongoose';
import { User } from "../models/user.model.js";

export const followUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - user ID not found' 
      });
    }

    const { userId } = req.params;
    const currentUserId = req.userId;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentUserId)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format' 
      });
    }

    // Find both users in the same transaction
    const [currentUser, userToFollow] = await Promise.all([
      User.findById(currentUserId).session(session),
      User.findById(userId).session(session)
    ]);

    if (!currentUser || !userToFollow) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if already following
    if (currentUser.following.some(id => id.equals(userToFollow._id))) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Already following this user' 
      });
    }

    // Update both users
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    // Update counters
    currentUser.followingCount = currentUser.following.length;
    userToFollow.followersCount = userToFollow.followers.length;

    await Promise.all([
      currentUser.save({ session }),
      userToFollow.save({ session })
    ]);

    await session.commitTransaction();

    // Get fresh user data
    const updatedCurrentUser = await User.findById(currentUserId)
      .select('following followersCount followingCount')
      .populate('following', 'username profilePhoto');

    const updatedFollowedUser = await User.findById(userId)
      .select('followers followersCount followingCount')
      .populate('followers', 'username profilePhoto');

    res.json({ 
      success: true,
      currentUser: updatedCurrentUser,
      followedUser: updatedFollowedUser
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Follow error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to follow user',
      error: err.message 
    });
  } finally {
    session.endSession();
  }
};

export const unfollowUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!req.userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - user ID not found' 
      });
    }

    const { userId } = req.params;
    const currentUserId = req.userId;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentUserId)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format' 
      });
    }

    // Find both users in the same transaction
    const [currentUser, userToUnfollow] = await Promise.all([
      User.findById(currentUserId).session(session),
      User.findById(userId).session(session)
    ]);

    if (!currentUser || !userToUnfollow) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (!currentUser.following.some(id => id.equals(userToUnfollow._id))) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Not following this user' 
      });
    }

    // Update both users
    currentUser.following = currentUser.following.filter(
      id => !id.equals(userToUnfollow._id)
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => !id.equals(currentUser._id)
    );

    // Update counters
    currentUser.followingCount = currentUser.following.length;
    userToUnfollow.followersCount = userToUnfollow.followers.length;

    await Promise.all([
      currentUser.save({ session }),
      userToUnfollow.save({ session })
    ]);

    await session.commitTransaction();

    // Get fresh user data
    const updatedCurrentUser = await User.findById(currentUserId)
      .select('following followersCount followingCount')
      .populate('following', 'username profilePhoto');

    const updatedUnfollowedUser = await User.findById(userId)
      .select('followers followersCount followingCount')
      .populate('followers', 'username profilePhoto');

    res.json({ 
      success: true,
      currentUser: updatedCurrentUser,
      unfollowedUser: updatedUnfollowedUser
    });
  } catch (err) {
    await session.abortTransaction();
    console.error('Unfollow error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to unfollow user',
      error: err.message 
    });
  } finally {
    session.endSession();
  }
};

export const getFollowStatus = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const isFollowing = currentUser.following.includes(req.params.userId);
    res.json({ isFollowing });
  } catch (err) {
    console.error('Follow status error:', err);
    res.status(500).json({ 
      message: 'Failed to get follow status',
      error: err.message 
    });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.userId;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userToBlock = await User.findById(userId).session(session);
      const currentUser = await User.findById(currentUserId).session(session);

      if (!userToBlock || !currentUser) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }

      if (currentUser.blockedUsers.includes(userToBlock._id)) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'User already blocked' });
      }

      // Block the user
      currentUser.blockedUsers.push(userToBlock._id);
      
      // Also unfollow if currently following
      if (currentUser.following.includes(userToBlock._id)) {
        currentUser.following = currentUser.following.filter(
          id => id.toString() !== userToBlock._id.toString()
        );
        userToBlock.followers = userToBlock.followers.filter(
          id => id.toString() !== currentUser._id.toString()
        );
        await userToBlock.save({ session });
      }

      await currentUser.save({ session });
      await session.commitTransaction();

      const populatedUser = await User.findById(currentUserId)
        .populate('blockedUsers', 'username profilePhoto.url businessName');

      res.json({ 
        success: true,
        blockedUsers: populatedUser.blockedUsers
      });
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Block error:', err);
    res.status(500).json({ 
      message: 'Failed to block user',
      error: err.message 
    });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.userId;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userToUnblock = await User.findById(userId).session(session);
      const currentUser = await User.findById(currentUserId).session(session);

      if (!userToUnblock || !currentUser) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }

      if (!currentUser.blockedUsers.includes(userToUnblock._id)) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'User not blocked' });
      }

      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        id => id.toString() !== userToUnblock._id.toString()
      );

      await currentUser.save({ session });
      await session.commitTransaction();

      const populatedUser = await User.findById(currentUserId)
        .populate('blockedUsers', 'username profilePhoto.url businessName');

      res.json({ 
        success: true,
        blockedUsers: populatedUser.blockedUsers
      });
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Unblock error:', err);
    res.status(500).json({ 
      message: 'Failed to unblock user',
      error: err.message 
    });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('blockedUsers')
      .populate('blockedUsers', 'username profilePhoto.url businessName');
      
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      success: true,
      blockedUsers: user.blockedUsers || [] 
    });
  } catch (err) {
    console.error('Error fetching blocked users:', err);
    res.status(500).json({ 
      message: 'Failed to fetch blocked users',
      error: err.message 
    });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username profilePhoto.url bio');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      success: true,
      followers: user.followers 
    });
  } catch (err) {
    console.error('Followers error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch followers',
      error: err.message 
    });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('following', 'username profilePhoto.url bio');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      success: true,
      following: user.following 
    });
  } catch (err) {
    console.error('Following error:', err);
    res.status(500).json({ 
      message: 'Failed to fetch following',
      error: err.message 
    });
  }
};

export const removeFollower = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userToRemove = await User.findById(userId).session(session);
      const currentUser = await User.findById(currentUserId).session(session);

      if (!userToRemove || !currentUser) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove from current user's followers
      currentUser.followers = currentUser.followers.filter(
        id => id.toString() !== userToRemove._id.toString()
      );

      // Remove from other user's following
      userToRemove.following = userToRemove.following.filter(
        id => id.toString() !== currentUser._id.toString()
      );

      await currentUser.save({ session });
      await userToRemove.save({ session });
      await session.commitTransaction();

      res.json({ success: true });
    } catch (transactionError) {
      await session.abortTransaction();
      throw transactionError;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Remove follower error:', err);
    res.status(500).json({ 
      message: 'Failed to remove follower',
      error: err.message 
    });
  }
};