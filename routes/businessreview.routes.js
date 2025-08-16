import express from 'express';
import {
  createReview,
  respondToReview,
  getUserReviews
} from '../controllers/review.controller.js';
import {
  createBusinessReview
} from '../controllers/businessReview.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
// Regular user reviews
router.post('/:userId', verifyToken, createReview);
router.post('/:reviewId/respond', verifyToken, respondToReview);
router.get('/:userId', getUserReviews);

// Business reviews
router.post('/business/:userId', verifyToken, createBusinessReview);

export default router;