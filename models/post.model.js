import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  media: [{
    url: String,
    mediaType: {
      type: String,
      enum: ["image", "video"]
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }],
  shares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for author and creation date for faster queries
postSchema.index({ author: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);