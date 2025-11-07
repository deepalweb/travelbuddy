import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { requireCapability } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Multi-sided platform analytics
router.get('/analytics/ecosystem', verifyFirebaseToken, requireCapability('view_analytics'), async (req, res) => {
  try {
    const User = req.app.get('User') || global.User;
    
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const verificationStats = await User.aggregate([
      { $group: { _id: { role: '$role', verified: '$isVerified' }, count: { $sum: 1 } } }
    ]);

    res.json({
      ecosystem: {
        totalUsers: roleStats.reduce((sum, r) => sum + r.count, 0),
        roleDistribution: Object.fromEntries(roleStats.map(r => [r._id, r.count])),
        verificationStatus: verificationStats
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ecosystem analytics' });
  }
});

// Role upgrade requests
router.post('/upgrade-role', verifyFirebaseToken, async (req, res) => {
  try {
    const { targetRole, businessData } = req.body;
    const User = req.app.get('User') || global.User;
    
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Strategic role upgrade logic
    const upgradeData = { role: targetRole };
    
    if (targetRole === 'merchant') {
      upgradeData.businessProfile = { ...businessData, verificationStatus: 'pending' };
    } else if (targetRole === 'transport_provider') {
      upgradeData.transportProfile = { ...businessData, verificationStatus: 'pending' };
    } else if (targetRole === 'travel_agent') {
      upgradeData.agentProfile = { ...businessData, verificationStatus: 'pending' };
    }

    await User.findByIdAndUpdate(user._id, upgradeData);
    
    res.json({ 
      success: true, 
      message: `Role upgrade to ${targetRole} submitted for verification`,
      requiresVerification: targetRole !== 'traveler'
    });
  } catch (error) {
    res.status(500).json({ error: 'Role upgrade failed' });
  }
});

// Revenue tracking for multi-sided platform
router.get('/revenue/summary', verifyFirebaseToken, requireCapability('view_analytics'), async (req, res) => {
  try {
    const Deal = global.Deal;
    
    const revenueData = {
      merchants: {
        totalDeals: await Deal?.countDocuments({ isActive: true }) || 0,
        totalClaims: await Deal?.aggregate([{ $group: { _id: null, total: { $sum: '$claims' } } }]).then(r => r[0]?.total || 0)
      },
      platform: {
        commissionRate: 0.15, // 15% platform fee
        projectedRevenue: 0 // Calculate based on bookings
      }
    };

    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

export default router;