// models/booking.model.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
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
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  referralCode: String, // Track if booking came from referral
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  commissionEarned: {
    type: Number,
    default: 0
  },
  commissionPaid: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Calculate commission before saving
bookingSchema.pre('save', async function(next) {
  if (this.isNew && this.referralCode) {
    const referral = await Referral.findOne({ code: this.referralCode });
    if (referral) {
      // Calculate 10% commission (adjust as needed)
      this.commissionEarned = this.amount * 0.1;
      referral.commission += this.commissionEarned;
      referral.bookings.push(this._id);
      await referral.save();
    }
  }
  next();
});

export const Booking = mongoose.model('Booking', bookingSchema);