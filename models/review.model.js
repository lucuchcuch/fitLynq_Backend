import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  ratings: {
    // For regular users
    sportiness: { type: Number, min: 1, max: 5 },
    kindness: { type: Number, min: 1, max: 5 },
    sociability: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    teamwork: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    reliability: { type: Number, min: 1, max: 5 },
    fairPlay: { type: Number, min: 1, max: 5 },
    
    // For businesses
    cleanliness: { type: Number, min: 1, max: 5 },
    equipmentQuality: { type: Number, min: 1, max: 5 },
    staffFriendliness: { type: Number, min: 1, max: 5 },
    safety: { type: Number, min: 1, max: 5 },
    amenities: { type: Number, min: 1, max: 5 },
    accessibility: { type: Number, min: 1, max: 5 },
    valueForMoney: { type: Number, min: 1, max: 5 }
  },
  response: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user pair
reviewSchema.index({ reviewer: 1, reviewee: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);