import express from 'express';
import { followUser, unfollowUser, getFollowStatus } from '../controllers/follow.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/:userId', verifyToken, followUser);
router.delete('/:userId', verifyToken, unfollowUser);
router.get('/status/:userId', verifyToken, getFollowStatus);

export default router;