import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, {
  timestamps: true
});

// Index for post and creation date for faster queries
commentSchema.index({ post: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);