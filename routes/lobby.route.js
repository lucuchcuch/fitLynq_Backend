import express from 'express';
import Lobby from '../models/lobby.model.js';

const router = express.Router();

// Search route
router.get('/search', async (req, res) => {
  try {
    const { q, sport, date, location, radius, limit, status } = req.query;

    let query = {};
    
    // Only filter by status if explicitly requested
    if (status) {
      query.status = status;
    } else {
      // Default to showing all lobbies for the creator
      // You'll need to implement proper authentication
      // For now we'll remove the status filter
    }

    if (q) {
      query.$or = [
        { 'selectedBusiness.name': { $regex: q, $options: 'i' } },
        { 'selectedBusiness.address': { $regex: q, $options: 'i' } },
        { 'location.city': { $regex: q, $options: 'i' } }
      ];
    }

    if (sport) query.sport = sport;
    if (date) query.date = new Date(date);
    if (location) query['location.city'] = { $regex: location, $options: 'i' };

    const lobbies = await Lobby.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 5)
      .populate('creator', 'username profilePhoto')
      .populate('joinedPlayers', 'username profilePhoto');

    res.json({ 
      success: true,
      data: lobbies,
      hasMore: lobbies.length === parseInt(limit || 5)
    });
  } catch (error) {
    console.error('Error searching lobbies:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error searching lobbies',
      error: error.message 
    });
  }
});

// General lobbies route
router.get('/', async (req, res) => {
  try {
    const { limit, sort, status } = req.query;

    let query = {};
    let sortOption = { createdAt: -1 };

    // Only filter by status if explicitly requested
    if (status) {
      query.status = status;
    }

    if (sort === 'soonest') {
      sortOption = { date: 1 };
    }

    const lobbies = await Lobby.find(query)
      .sort(sortOption)
      .limit(parseInt(limit) || 10)
      .populate('creator', 'username profilePhoto')
      .populate('joinedPlayers', 'username profilePhoto');

    res.json({ 
      success: true,
      data: lobbies 
    });
  } catch (error) {
    console.error('Error fetching lobbies:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching lobbies',
      error: error.message 
    });
  }
});

export default router;