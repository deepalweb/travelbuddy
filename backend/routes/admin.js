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

export default router;