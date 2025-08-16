import mongoose from 'mongoose';

const courtBookingSchema = new mongoose.Schema({
  court: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Court', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  date: { 
    type: String, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  players: { 
    type: Number, 
    default: 1 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'held'], 
    default: 'held' 
  },
  lobby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lobby'
  },
  paymentIntentId: String, // For payment processing
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add index for better query performance
courtBookingSchema.index({ court: 1, date: 1, startTime: 1 });

const CourtBooking = mongoose.model('CourtBooking', courtBookingSchema);
export default CourtBooking;