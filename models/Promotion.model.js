import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  promoCode: {
    type: String,
    required: true,
    unique: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  maxClaims: {
    type: Number,
    default: null // null means unlimited
  },
  claimsCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

export default mongoose.model('Promotion', promotionSchema);