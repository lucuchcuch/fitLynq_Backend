import mongoose from 'mongoose';

const lobbySchema = new mongoose.Schema({
  sport: { type: String, required: true, enum: ['padel', 'tennis', 'soccer', 'basketball'] },
  date: { type: String, required: true }, // Changed from Date to String
  timeRange: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  location: {
    city: { type: String, required: true },
    zip: { type: String },
    radius: { type: Number }
  },
  playerCount: { type: Number, required: true },
  courtId: { type: String, required: true }, // Added this field
  courtDetails: { type: Object, required: true }, // Added this field
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Made not required for now
  status: { 
    type: String, 
    enum: ['pending', 'payment-pending', 'confirmed'], // Updated values
    default: 'pending' 
  },
  paymentDeadline: { type: Date },
  joinedPlayers: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;