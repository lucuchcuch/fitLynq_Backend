import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";
import profileRouter from "./routes/profile.routes.js";
import searchRoutes from './routes/search.routes.js';
import reviewRoutes from './routes/review.routes.js';
import statisticsRoutes from './routes/statistics.routes.js';
import promotionsRoutes from './routes/promotions.route.js';
import lobbiesRoutes from './routes/lobby.route.js';
import Court from './models/Court.model.js';
import CourtBooking from './models/courtbooking.model.js';
import mongoose from "mongoose";
import Lobby from "./models/lobby.model.js";
import businessPosts from "./routes/post.routes.js";
import messageRoutes from "./routes/messages.js"; // New messaging routes

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

// Middleware
app.use(cors({ 
  origin: "http://localhost:5173", 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Make io available to routes
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/profile', profileRouter);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/posts', businessPosts);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/lobbies', lobbiesRoutes);
app.use('/api/messages', messageRoutes); // New messaging routes

// Production setup
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Routes
app.get('/api/courts', async (req, res) => {
  try {
    const courts = await Court.find();
    res.json(courts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/courts', async (req, res) => {
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

// Add the available courts route BEFORE the /:id route
app.get('/api/courts/available', async (req, res) => {
  try {
    const { sport, date, startTime, endTime, city, zip, radius, players } = req.query;

    // Validate required parameters
    if (!sport || !date || !startTime || !endTime || !city) {
      return res.status(400).json({ 
        message: 'Missing required parameters: sport, date, startTime, endTime, city' 
      });
    }

    // Find available courts
    const courts = await Court.find({
      sport: sport.toLowerCase(),
      maxPlayers: { $gte: parseInt(players) || 4 },
      'location.city': new RegExp(city, 'i')
    });

    // Check availability for each court
    const availableCourts = await Promise.all(
      courts.map(async court => {
        const existingBooking = await CourtBooking.findOne({
          court: court._id,
          date,
          $or: [
            { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
          ]
        });

        if (existingBooking) return null;

        return {
          id: court._id,
          name: court.name,
          address: `${court.location.address}, ${court.location.city}`,
          distance: calculateDistance(zip, court.location.zip),
          pricePerHour: court.pricePerHour,
          maxPlayers: court.maxPlayers,
          rating: court.rating || 4.5,
          reviewCount: court.reviewCount || 42
        };
      })
    );

    res.json(availableCourts.filter(court => court !== null));
  } catch (err) {
    console.error('Error in /api/courts/available:', err);
    res.status(500).json({ message: 'Error searching courts', error: err.message });
  }
});

function calculateDistance(zip1, zip2) {
  if (!zip1 || !zip2) return (Math.random() * 5 + 1).toFixed(1);
  // Simplified distance calculation for demo
  return (Math.abs(parseInt(zip1) - parseInt(zip2)) / 1000).toFixed(1);
}

app.get('/api/courts/:id', async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);
    if (!court) return res.status(404).json({ message: 'Court not found' });
    res.json(court);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/courtbookings/:courtId', async (req, res) => {
  try {
    const bookings = await CourtBooking.find({ court: req.params.courtId })
      .populate('user', 'name email')
      .sort({ date: 1, startTime: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/lobbies/:id', async (req, res) => {
  try {
    // Validate ID format first
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid lobby ID format' 
      });
    }

    // Delete associated bookings first
    await CourtBooking.deleteMany({ lobby: req.params.id });

    // Then delete the lobby
    const deletedLobby = await Lobby.findByIdAndDelete(req.params.id);
    
    if (!deletedLobby) {
      return res.status(404).json({ 
        success: false,
        message: 'Lobby not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Lobby deleted successfully',
      data: deletedLobby
    });
  } catch (err) {
    console.error('Error deleting lobby:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete lobby',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.post('/api/courtbookings', async (req, res) => {
  // Check if slot is already booked
  const existingBooking = await CourtBooking.findOne({
    court: req.body.court,
    date: req.body.date,
    startTime: req.body.startTime
  });

  if (existingBooking) {
    return res.status(400).json({ message: 'This time slot is already booked' });
  }

  const courtbooking = new CourtBooking({
    court: req.body.court,
    user: req.body.user,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    players: req.body.players,
    status: 'confirmed'
  });

  try {
    const newBooking = await courtbooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Lobby Routes
app.get('/api/lobbies', async (req, res) => {
  try {
    // In a real app, you would filter by the current user
    const lobbies = await Lobby.find()
      .populate('creator', 'name email')
      .populate('court', 'name location pricePerHour');
    res.json(lobbies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/lobbies', async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['sport', 'date', 'timeRange', 'playerCount', 'courtId', 'courtDetails'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields',
        missingFields 
      });
    }

    // Create a new lobby
    const newLobby = new Lobby({
      sport: req.body.sport,
      date: req.body.date,
      timeRange: req.body.timeRange,
      location: req.body.location,
      playerCount: req.body.playerCount,
      courtId: req.body.courtId,
      courtDetails: req.body.courtDetails,
      creator: null, // You'll need to implement authentication
      status: 'pending',
      joinedPlayers: []
    });

    const savedLobby = await newLobby.save();
    
    // Create a court booking to hold the slot
    const booking = new CourtBooking({
      court: req.body.courtId,
      date: req.body.date,
      startTime: req.body.timeRange.start,
      endTime: req.body.timeRange.end,
      players: req.body.playerCount,
      status: 'held',
      lobby: savedLobby._id
    });

    await booking.save();

    res.status(201).json({
      success: true,
      data: savedLobby
    });
  } catch (err) {
    console.error('Error creating lobby:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create lobby',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.delete('/api/lobbies/:id', async (req, res) => {
  try {
    const deletedLobby = await Lobby.findByIdAndDelete(req.params.id);
    if (!deletedLobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }
    res.json({ message: 'Lobby deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/lobbies/:lobbyId/players/:playerId', async (req, res) => {
  try {
    const lobby = await Lobby.findById(req.params.lobbyId);
    if (!lobby) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    lobby.joinedPlayers = lobby.joinedPlayers.filter(
      player => player.toString() !== req.params.playerId
    );

    await lobby.save();
    res.json({ message: 'Player removed from lobby' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  
  // Join user to their personal room for notifications
  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room user-${userId}`);
  });
  
  // Join conversation room
  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });
  
  // Leave conversation room
  socket.on("leave-conversation", (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} left conversation ${conversationId}`);
  });
  
  // Handle typing indicators
  socket.on("typing", (data) => {
    socket.to(data.conversationId).emit("user-typing", {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });
  
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
httpServer.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});