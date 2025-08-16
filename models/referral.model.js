// referral.model.js
import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  sport: {
    type: String,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months
  }
}, { timestamps: true });

export const Referral = mongoose.model('Referral', referralSchema);