import mongoose from 'mongoose';

const userClaimSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  promotionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion',
    required: true
  },
  claimedAt: {
    type: Date,
    default: Date.now
  },
  used: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Ensure a user can't claim the same promotion twice
userClaimSchema.index({ userId: 1, promotionId: 1 }, { unique: true });

export default mongoose.model('UserClaim', userClaimSchema);