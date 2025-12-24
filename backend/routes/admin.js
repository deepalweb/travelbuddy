import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const requireAdmin = async (req, res, next) => {
  const secret = process.env.ADMIN_SECRET || process.env.ADMIN_API_KEY || 'admin123';
  if (req.headers['x-admin-secret'] === secret) return next();
  return res.status(403).json({ error: 'Admin access required' });
};

// Comprehensive Dashboard
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const Post = mongoose.model('Post');
    const Deal = mongoose.model('Deal');
    const TripPlan = mongoose.model('TripPlan');
    const Event = mongoose.model('Event');
    
    const [users, posts, deals, trips, events, recentUsers, recentPosts] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Deal.countDocuments(),
      TripPlan.countDocuments(),
      Event.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt'),
      Post.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'username')
    ]);
    
    const [merchants, agents, providers, freeUsers, premiumUsers, pendingBusinesses] = await Promise.all([
      User.countDocuments({ roles: 'merchant' }),
      User.countDocuments({ roles: 'travel_agent' }),
      User.countDocuments({ roles: 'transport_provider' }),
      User.countDocuments({ tier: 'free' }),
      User.countDocuments({ tier: { $in: ['basic', 'premium', 'pro'] } }),
      User.countDocuments({
        $or: [
          { 'businessProfile.verificationStatus': 'pending' },
          { 'agentProfile.verificationStatus': 'pending' },
          { 'transportProfile.verificationStatus': 'pending' }
        ]
      })
    ]);
    
    res.json({
      users: { total: users, merchants, agents, providers, free: freeUsers, premium: premiumUsers },
      content: { posts, deals, trips, events },
      pending: { businesses: pendingBusinesses },
      recent: { users: recentUsers, posts: recentPosts },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const Post = mongoose.model('Post');
    const Deal = mongoose.model('Deal');
    
    const userGrowth = await User.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);
    
    const postsByCategory = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const dealsByStatus = await Deal.aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } }
    ]);
    
    res.json({ userGrowth, postsByCategory, dealsByStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Users Management
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    
    const query = search ? {
      $or: [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ]
    } : {};
    
    const [users, total] = await Promise.all([
      User.find(query).select('-__v').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query)
    ]);
    
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/tier', requireAdmin, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const user = await User.findByIdAndUpdate(req.params.id, { tier: req.body.tier }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const User = mongoose.model('User');
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Content Moderation
router.get('/posts/all', requireAdmin, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const posts = await Post.find().populate('userId', 'username email').sort({ createdAt: -1 }).limit(50);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/posts/pending', requireAdmin, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const posts = await Post.find({ moderationStatus: 'pending' }).populate('userId', 'username email').sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/posts/:id/moderate', requireAdmin, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const post = await Post.findByIdAndUpdate(req.params.id, { moderationStatus: req.body.status }, { new: true });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/posts/:id', requireAdmin, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Business Management
router.get('/businesses/pending', requireAdmin, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const pending = await User.find({
      $or: [
        { 'businessProfile.verificationStatus': 'pending' },
        { 'agentProfile.verificationStatus': 'pending' },
        { 'transportProfile.verificationStatus': 'pending' }
      ]
    }).select('username email businessProfile agentProfile transportProfile');
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/businesses/:id/approve', requireAdmin, async (req, res) => {
  try {
    const User = mongoose.model('User');
    const { type } = req.body;
    const update = {};
    if (type === 'business') update['businessProfile.verificationStatus'] = 'approved';
    if (type === 'agent') update['agentProfile.verificationStatus'] = 'approved';
    if (type === 'transport') update['transportProfile.verificationStatus'] = 'approved';
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Deals Management
router.get('/deals', requireAdmin, async (req, res) => {
  try {
    const Deal = mongoose.model('Deal');
    const deals = await Deal.find().populate('merchantId', 'username email').sort({ createdAt: -1 }).limit(100);
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/deals/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const Deal = mongoose.model('Deal');
    const deal = await Deal.findById(req.params.id);
    deal.isActive = !deal.isActive;
    await deal.save();
    res.json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/deals/:id', requireAdmin, async (req, res) => {
  try {
    const Deal = mongoose.model('Deal');
    await Deal.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Events Management
router.get('/events', requireAdmin, async (req, res) => {
  try {
    const Event = mongoose.model('Event');
    const events = await Event.find().sort({ createdAt: -1 }).limit(50);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trip Plans
router.get('/trips', requireAdmin, async (req, res) => {
  try {
    const TripPlan = mongoose.model('TripPlan');
    const trips = await TripPlan.find().populate('userId', 'username email').sort({ createdAt: -1 }).limit(50);
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System Health
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({
      database: { connected: dbState === 1, collections: collections.length },
      server: { uptime: process.uptime(), memory: process.memoryUsage() }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
