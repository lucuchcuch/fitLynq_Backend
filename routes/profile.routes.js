import express from 'express';
import { getProfile, updateProfile, getProfileByUsername } from '../controllers/profile.controller.js';
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  blockUser,
  unblockUser,
  getFollowers,
  getFollowing,
  getBlockedUsers,
  removeFollower
} from '../controllers/follow.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import multer from 'multer';

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Profile routes
router.get('/', verifyToken, getProfile);
router.put('/', verifyToken, upload.single('profilePhoto'), updateProfile);
router.get('/:username', getProfileByUsername);

// Follow routes
router.post('/:userId/follow', verifyToken, followUser);
router.post('/:userId/unfollow', verifyToken, unfollowUser);
router.get('/:userId/follow-status', verifyToken, getFollowStatus);

// Block routes
router.post('/block', verifyToken, blockUser);
router.post('/unblock', verifyToken, unblockUser);
router.get('/settings/blocked', verifyToken, getBlockedUsers);

// Followers/Following routes
router.get('/:username/followers', getFollowers);
router.get('/:username/following', getFollowing);
router.post('/:userId/remove-follower', verifyToken, removeFollower);

export default router;