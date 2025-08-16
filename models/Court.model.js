import mongoose from 'mongoose';

const openingHoursSchema = new mongoose.Schema({
  monday: { open: String, close: String, closed: Boolean },
  tuesday: { open: String, close: String, closed: Boolean },
  wednesday: { open: String, close: String, closed: Boolean },
  thursday: { open: String, close: String, closed: Boolean },
  friday: { open: String, close: String, closed: Boolean },
  saturday: { open: String, close: String, closed: Boolean },
  sunday: { open: String, close: String, closed: Boolean }
});

const locationSchema = new mongoose.Schema({
  address: String,
  city: String,
  zip: String
});

const courtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  location: locationSchema,
  pricePerHour: { type: Number, required: true },
  openingHours: openingHoursSchema,
  timeSlotDuration: { type: Number, required: true },
  maxPlayers: { type: Number, required: true },
  courtCount: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Court', courtSchema);