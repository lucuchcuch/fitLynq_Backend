import express from 'express';
import { verifyToken as auth } from '../middleware/verifyToken.js';
import Promotion from '../models/Promotion.model.js';
import UserClaim from '../models/UserClaim.model.js';
import { User } from '../models/user.model.js';

const router = express.Router();

// BUSINESS ROUTES

// Create promotion (business only)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.userType !== 'business') {
      return res.status(403).json({ message: 'Only businesses can create promotions' });
    }

    const promotion = new Promotion({
      businessId: user._id,
      ...req.body
    });

    await promotion.save();
    res.status(201).json(promotion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get promotions created by this business (business only)
router.get('/business', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.userType !== 'business') {
      return res.status(403).json({ message: 'Only businesses can view their promotions' });
    }

    const promotions = await Promotion.find({ businessId: user._id });

    const promotionsWithBusiness = promotions.map(promo => ({
      ...promo.toObject(),
      businessInfo: {
        name: user.businessName || 'Your Business',
        address: user.address || ''
      }
    }));

    res.json(promotionsWithBusiness);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all active promotions (user or business)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const promotions = await Promotion.find({
      isActive: true,
      validUntil: { $gt: new Date() }
    }).populate('businessId', 'businessName');

    // If user is a normal user, attach claim info
    if (user.userType === 'user') {
      const userClaims = await UserClaim.find({ userId: req.userId });
      const claimedPromoIds = userClaims.map(uc => uc.promotionId.toString());

      const promotionsWithClaimStatus = promotions.map(promo => ({
        ...promo.toObject(),
        isClaimed: claimedPromoIds.includes(promo._id.toString())
      }));

      return res.json(promotionsWithClaimStatus);
    }

    // For businesses or admins, return as-is
    res.json(promotions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Claim a promotion (users only)
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.userType !== 'user') {
      return res.status(403).json({ message: 'Only users can claim promotions' });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion || !promotion.isActive || promotion.validUntil < new Date()) {
      return res.status(400).json({ message: 'Promotion is no longer available' });
    }

    if (promotion.maxClaims !== null && promotion.claimsCount >= promotion.maxClaims) {
      return res.status(400).json({ message: 'Promotion has reached maximum claims' });
    }

    const existingClaim = await UserClaim.findOne({
      userId: req.userId,
      promotionId: promotion._id
    });

    if (existingClaim) {
      return res.status(400).json({ message: 'You have already claimed this promotion' });
    }

    const userClaim = new UserClaim({
      userId: req.userId,
      promotionId: promotion._id
    });

    promotion.claimsCount += 1;
    if (promotion.maxClaims !== null && promotion.claimsCount >= promotion.maxClaims) {
      promotion.isActive = false;
    }

    await Promise.all([userClaim.save(), promotion.save()]);
    res.json(userClaim);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get user's claimed promotions (users only)
router.get('/my-claims', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.userType !== 'user') {
      return res.status(403).json({ message: 'Only users can view claimed promotions' });
    }

    const claims = await UserClaim.find({ userId: req.userId })
      .populate({
        path: 'promotionId',
        populate: {
          path: 'businessId',
          select: 'businessName'
        }
      });

    res.json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a promotion (business only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.userType !== 'business') {
      return res.status(403).json({ message: 'Only businesses can delete promotions' });
    }

    const promotion = await Promotion.findOneAndDelete({
      _id: req.params.id,
      businessId: user._id
    });

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found or not owned by you' });
    }

    // Also delete claims associated with this promotion
    await UserClaim.deleteMany({ promotionId: req.params.id });

    res.json({ message: 'Promotion deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
