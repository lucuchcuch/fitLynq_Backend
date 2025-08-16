// statistics.routes.js
import express from 'express';
import { 
  getEarningsData,
  generateReferralCode,
   
} from '../controllers/statistics.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { getSportsPlayedData } from '../controllers/statistics.controller.js';
import { getBusinessesPlayedAtData } from '../controllers/statistics.controller.js';

const router = express.Router();

// Earnings routes
router.get('/earnings', verifyToken, getEarningsData);
router.post('/referral-code', verifyToken, generateReferralCode);
router.get('/sports-played', verifyToken, getSportsPlayedData)
router.get('/businesses-played-at', verifyToken, getBusinessesPlayedAtData)


export default router;