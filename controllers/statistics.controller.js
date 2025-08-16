import { User } from '../models/user.model.js';
import { Referral } from '../models/referral.model.js';
import { Booking } from '../models/booking.model.js';
import mongoose from 'mongoose';


export const getEarningsData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.userId;

    // Get all referrals for this user
    const referrals = await Referral.find({
      referrer: userId,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).populate('business');

    // Calculate totals
    const totalEarnings = referrals.reduce((sum, ref) => sum + (ref.commission || 0), 0);
    const referralCount = referrals.length;

    // Group by time (monthly)
    const timeSeries = referrals.reduce((acc, ref) => {
      const month = ref.createdAt.toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + (ref.commission || 0);
      return acc;
    }, {});

    // Get top 5 paying matches
    const topMatches = referrals
      .sort((a, b) => (b.commission || 0) - (a.commission || 0))
      .slice(0, 5)
      .map(ref => ({
        business: ref.business?.name || 'Unknown',
        sport: ref.sport || 'Unknown',
        date: ref.createdAt,
        amount: ref.commission || 0
      }));

    res.json({
      totalEarnings,
      referralCount,
      timeSeries: Object.entries(timeSeries).map(([date, amount]) => ({ date, amount })),
      topMatches
    });
  } catch (error) {
    console.error('Error fetching earnings data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const generateReferralCode = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    // If user already has a code, return it
    if (user.referralCode) {
      return res.json({ code: user.referralCode });
    }

    // Generate unique code
    let code;
    let isUnique = false;
    const maxAttempts = 5;
    let attempts = 0;

    while (!isUnique && attempts < maxAttempts) {
      code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const existingUser = await User.findOne({ referralCode: code });
      if (!existingUser) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique code');
    }

    // Save to user
    user.referralCode = code;
    await user.save();

    res.json({ code });
  } catch (error) {
    console.error('Error generating referral code:', error);
    res.status(500).json({ message: 'Failed to generate referral code' });
  }
};

export const getSportsPlayedData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.userId; // Using req.userId from verifyToken
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Add date validation if needed
    const sportsData = await Booking.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { 
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: "$sport",
          amount: { $sum: "$amount" }
        }
      },
      {
        $project: {
          sport: "$_id",
          amount: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json(sportsData);
  } catch (error) {
    console.error("Error in getSportsPlayedData:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch sports data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const ObjectId = mongoose.Types.ObjectId;

export const getBusinessesPlayedAtData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.userId;

    // Properly create ObjectId
    const userObjectId = new ObjectId(userId); // Note the 'new' keyword

    const businessesData = await Booking.aggregate([
      {
        $match: {
          user: userObjectId, // Use the properly created ObjectId
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $lookup: {
          from: 'businesses', // Ensure this matches your collection name
          localField: 'business',
          foreignField: '_id',
          as: 'businessInfo'
        }
      },
      {
        $unwind: '$businessInfo'
      },
      {
        $group: {
          _id: '$businessInfo.name', // or other business field you want to group by
          amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          name: '$_id',
          amount: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json(businessesData);
  } catch (error) {
    console.error("Error in getBusinessesPlayedAtData:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch businesses data",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};