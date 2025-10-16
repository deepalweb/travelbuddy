import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get models from the app
    const User = mongoose.model('User');
    const Post = mongoose.model('Post');
    const Deal = mongoose.model('Deal');
    const Report = mongoose.model('Report');
    const TripPlan = mongoose.model('TripPlan');

    // Fetch all statistics in parallel
    const [
      totalUsers,
      totalPosts,
      totalDeals,
      totalTrips,
      pendingReports,
      subscriptionStats,
      recentUsers,
      activePosts
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Deal.countDocuments(),
      TripPlan.countDocuments(),
      Report.countDocuments({ status: 'pending' }).catch(() => 0),
      User.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 } } }
      ]).catch(() => []),
      User.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }),
      Post.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      })
    ]);

    // Process subscription statistics
    const subscriptions = {
      free: 0,
      basic: 0,
      premium: 0,
      pro: 0
    };

    subscriptionStats.forEach(stat => {
      if (stat._id && subscriptions.hasOwnProperty(stat._id)) {
        subscriptions[stat._id] = stat.count;
      } else if (!stat._id) {
        subscriptions.free += stat.count; // Users without tier default to free
      }
    });

    // Calculate additional metrics
    const activeUsers = Math.floor(totalUsers * 0.6); // Estimate 60% active
    const revenue = Math.floor(
      (subscriptions.basic * 4.99 + 
       subscriptions.premium * 9.99 + 
       subscriptions.pro * 19.99) * 12
    ); // Annual revenue estimate

    const stats = {
      totalUsers,
      activeUsers,
      totalTrips,
      totalDeals,
      totalPosts,
      pendingReports,
      revenue,
      newUsersToday: recentUsers,
      activeDealsToday: Math.floor(totalDeals * 0.1),
      subscriptions
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      details: error.message 
    });
  }
});

// Get user analytics
router.get('/users/analytics', async (req, res) => {
  try {
    const User = mongoose.model('User');
    
    const [
      totalUsers,
      usersByTier,
      usersByStatus,
      recentSignups
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$subscriptionStatus', count: { $sum: 1 } } }
      ]),
      User.find({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }).countDocuments()
    ]);

    res.json({
      totalUsers,
      usersByTier,
      usersByStatus,
      recentSignups,
      growthRate: totalUsers > 0 ? ((recentSignups / totalUsers) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user analytics',
      details: error.message 
    });
  }
});

// Get content moderation stats
router.get('/moderation/stats', async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const Report = mongoose.model('Report');
    
    const [
      totalPosts,
      flaggedPosts,
      pendingReports,
      rejectedPosts,
      approvedPosts
    ] = await Promise.all([
      Post.countDocuments(),
      Post.countDocuments({ requiresReview: true }),
      Report.countDocuments({ status: 'pending' }).catch(() => 0),
      Post.countDocuments({ moderationStatus: 'rejected' }),
      Post.countDocuments({ moderationStatus: 'approved' })
    ]);

    const moderationRate = totalPosts > 0 ? 
      (((flaggedPosts + rejectedPosts) / totalPosts) * 100).toFixed(2) : 0;

    res.json({
      totalPosts,
      flaggedPosts,
      pendingReports,
      rejectedPosts,
      approvedPosts,
      moderationRate
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch moderation statistics',
      details: error.message 
    });
  }
});

// Get business analytics
router.get('/business/analytics', async (req, res) => {
  try {
    const Deal = mongoose.model('Deal');
    const User = mongoose.model('User');
    
    const [
      totalDeals,
      activeDeals,
      totalViews,
      totalClaims,
      merchantCount,
      dealsByType
    ] = await Promise.all([
      Deal.countDocuments(),
      Deal.countDocuments({ isActive: true }),
      Deal.aggregate([
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]).then(result => result[0]?.total || 0),
      Deal.aggregate([
        { $group: { _id: null, total: { $sum: '$claims' } } }
      ]).then(result => result[0]?.total || 0),
      User.countDocuments({ role: 'merchant' }),
      Deal.aggregate([
        { $group: { _id: '$businessType', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      totalDeals,
      activeDeals,
      totalViews,
      totalClaims,
      merchantCount,
      dealsByType,
      conversionRate: totalViews > 0 ? ((totalClaims / totalViews) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Error fetching business analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch business analytics',
      details: error.message 
    });
  }
});

// User role management endpoints
router.get('/users', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const { page = 1, limit = 20, role, search } = req.query;
    
    const query = {};
    if (role && role !== 'all') query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('username email role tier subscriptionStatus isVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const { userId } = req.params;
    const { role, reason } = req.body;
    
    if (!['regular', 'merchant', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        role,
        $push: {
          roleHistory: {
            role,
            changedBy: 'admin',
            reason: reason || 'Admin assignment',
            changedAt: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Bulk role assignment
router.put('/users/bulk-role', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const { userIds, role, reason } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array required' });
    }
    
    if (!['regular', 'merchant', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { 
        role,
        $push: {
          roleHistory: {
            role,
            changedBy: 'admin',
            reason: reason || 'Bulk admin assignment',
            changedAt: new Date()
          }
        }
      }
    );
    
    res.json({ 
      success: true, 
      updated: result.modifiedCount,
      message: `Updated ${result.modifiedCount} users to ${role} role`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update user roles' });
  }
});

// Get user role history
router.get('/users/:userId/role-history', async (req, res) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findById(req.params.userId)
      .select('username email role roleHistory');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        username: user.username,
        email: user.email,
        currentRole: user.role
      },
      history: user.roleHistory || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch role history' });
  }
});

// Get role statistics
router.get('/roles/stats', async (req, res) => {
  try {
    const User = mongoose.model('User');
    
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const totalUsers = await User.countDocuments();
    
    const stats = {
      total: totalUsers,
      byRole: roleStats.reduce((acc, stat) => {
        acc[stat._id || 'regular'] = stat.count;
        return acc;
      }, {})
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch role statistics' });
  }
});

export default router;