import { User } from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import { Comment } from '../models/comment.model.js';

export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const author = req.userId;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Post content is required' 
      });
    }

    const post = new Post({
      author,
      content
    });

    await post.save();

    await User.findByIdAndUpdate(author, {
      $push: { posts: post._id }
    });

    res.status(201).json({ 
      success: true,
      post
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create post',
      error: error.message 
    });
  }
};

export const getPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'username profilePhoto')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username profilePhoto'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get posts' 
    });
  }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.userId;

    // Check if user already liked the post
    const post = await Post.findById(postId);
    const hasLiked = post.likes.includes(userId);

    let updatedPost;
    if (hasLiked) {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId } },
        { new: true }
      );
    } else {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: userId } },
        { new: true }
      );
    }

    res.json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
    console.error('Error (un)liking post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update like status' 
    });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.userId;

    const post = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId } },
      { new: true }
    );

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unlike post' 
    });
  }
};

export const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const author = req.userId;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment content is required' 
      });
    }

    const comment = new Comment({
      author,
      post: postId,
      content
    });

    await comment.save();

    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
      $inc: { commentsCount: 1 }
    });

    res.status(201).json({ 
      success: true,
      comment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create comment',
      error: error.message 
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this post' 
      });
    }

    await Post.findByIdAndDelete(postId);
    await User.findByIdAndUpdate(userId, {
      $pull: { posts: postId }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete post' 
    });
  }
};

export const editPost = async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const userId = req.userId;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content is required' 
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: 'Post not found' 
      });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to edit this post' 
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { content },
      { new: true }
    );

    res.json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
    console.error('Error editing post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to edit post' 
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found' 
      });
    }

    if (comment.author.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this comment' 
      });
    }

    await Comment.findByIdAndDelete(commentId);
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId },
      $inc: { commentsCount: -1 }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete comment' 
    });
  }
};