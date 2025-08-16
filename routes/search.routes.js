import express from 'express';
import { User } from '../models/user.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', limit = 5 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json({ results: [], hasMore: false });
    }

    // Base match conditions
    const matchConditions = {
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { businessName: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ]
    };

    // Add type filter if specified
    if (type !== 'all') {
      matchConditions.userType = type;
    }

    const results = await User.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'follows',
          localField: '_id',
          foreignField: 'followed',
          as: 'followers'
        }
      },
      {
        $addFields: {
          mutualFriends: {
            $size: {
              $setIntersection: [
                req.user?.following || [],
                '$followers.follower'
              ]
            }
          },
          startsWithQuery: {
            $cond: [
              { $regexMatch: { input: '$username', regex: `^${q}`, options: 'i' } },
              1,
              0
            ]
          },
          locationMatch: {
            $cond: [
              { $eq: ['$location', req.user?.location] },
              1,
              0
            ]
          }
        }
      },
      {
        $sort: {
          startsWithQuery: -1,
          mutualFriends: -1,
          locationMatch: -1,
          username: 1
        }
      },
      { $limit: parseInt(limit) + 1 },
      {
        $project: {
          username: 1,
          profilePhoto: 1,
          userType: 1,
          businessName: 1,
          firstName: 1,
          lastName: 1,
          location: 1
        }
      }
    ]);

    const hasMore = results.length > limit;
    const finalResults = hasMore ? results.slice(0, limit) : results;

    res.json({ results: finalResults, hasMore });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

export default router;