// routes/court.routes.js
import express from 'express';
import Court from '../models/Court.model.js';
import CourtBooking from '../models/courtbooking.model.js';

const router = express.Router();

// Get all courts
router.get('/', async (req, res) => {
  try {
    const courts = await Court.find();
    res.json(courts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new court
router.post('/', async (req, res) => {
  const court = new Court({
    name: req.body.name,
    sport: req.body.sport,
    location: req.body.location,
    pricePerHour: req.body.pricePerHour,
    openingHours: req.body.openingHours,
    timeSlotDuration: req.body.timeSlotDuration,
    maxPlayers: req.body.maxPlayers,
    courtCount: req.body.courtCount
  });

  try {
    const newCourt = await court.save();
    res.status(201).json(newCourt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get a specific court by ID
router.get('/:id', async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ message: 'Court not found' });
    res.json(court);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a court
router.delete('/:id', async (req, res) => {
  try {
    const deletedCourt = await Court.findByIdAndDelete(req.params.id);
    if (!deletedCourt) {
      return res.status(404).json({ message: 'Court not found' });
    }
    res.json({ message: 'Court deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get bookings for a specific court
router.get('/bookings/:courtId', async (req, res) => {
  try {
    const bookings = await CourtBooking.find({ court: req.params.courtId })
      .populate('user', 'name email')
      .sort({ date: 1, startTime: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Book a court
router.post('/bookings', async (req, res) => {
  try {
    const existingBooking = await CourtBooking.findOne({
      court: req.body.court,
      date: req.body.date,
      startTime: req.body.startTime
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const courtBooking = new CourtBooking({
      court: req.body.court,
      user: req.body.user,
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      players: req.body.players,
      status: 'confirmed'
    });

    const newBooking = await courtBooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get available courts
router.get('/available', async (req, res) => {
  try {
    const { sport, date, startTime, endTime, city, zip, radius, players } = req.query;

    if (!sport || !date || !startTime || !endTime || !city || !zip || !radius || !players) {
      return res.status(400).json({ message: 'Missing required query parameters' });
    }

    const courts = await Court.find({ sport });

    const availableCourts = [];

    for (const court of courts) {
      const overlappingBookings = await CourtBooking.find({
        court: court._id,
        date,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ]
      });

      const isAvailable = overlappingBookings.length < court.courtCount;

      if (isAvailable) {
        availableCourts.push(court);
      }
    }

    res.json(availableCourts);
  } catch (err) {
    console.error('Error in /available:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

export default router;
