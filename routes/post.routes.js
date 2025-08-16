import express from 'express';
import {
  createPost,
  getPostsByUser,
  likePost,
  unlikePost,
  deleteComment,
  deletePost,
  editPost,
  createComment
} from '../controllers/post.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Create a new post
router.post('/', verifyToken, createPost);

// Get all posts by a specific user
router.get('/user/:userId', getPostsByUser);

// Like a post
router.post('/:postId/like', verifyToken, likePost);

// Unlike a post
router.post('/:postId/unlike', verifyToken, unlikePost);

// Create a comment on a post
router.post('/:postId/comment', verifyToken, createComment);

// Delete a comment from a post
router.delete('/:postId/comment/:commentId', verifyToken, deleteComment);

// Delete a post
router.delete('/:postId', verifyToken, deletePost);

// Edit a post
router.put('/:postId', verifyToken, editPost);

export default router;
