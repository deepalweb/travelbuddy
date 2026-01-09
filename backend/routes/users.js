import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

const getUser = () => mongoose.model('User');
const getTripPlan = () => mongoose.model('TripPlan');

// Helper to extract uid from token
async function extractUid(token) {
  // Handle demo tokens
  if (token.startsWith('demo-token-')) {
    console.log('✅ Demo token detected');
    return 'demo-user-123';
  }
  
  // Try JWT decode first
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const uid = payload.user_id || payload.sub || payload.uid;
      console.log('✅ JWT decode success, uid:', uid);
      return uid;
    }
  } catch (e) {
    console.log('⚠️ JWT decode failed:', e.message);
  }
  
  // Fallback to Firebase verification
  try {
    const admin = (await import('firebase-admin')).default;
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ Firebase verify success, uid:', decodedToken.uid);
    return decodedToken.uid;
  } catch (e) {
    console.log('⚠️ Firebase verify failed:', e.message);
  }
  
  console.log('❌ Both methods failed');
  return null;
}

// Sync user
router.post('/sync', async (req, res) => {
  try {
    const User = getUser();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const uid = await extractUid(token);
    
    if (!uid) return res.status(401).json({ error: 'Invalid token' });

    const user = await User.findOneAndUpdate(
      { $or: [{ firebaseUid: uid }, { email: req.body.email }] },
      { $set: { firebaseUid: uid, email: req.body.email, username: req.body.username || req.body.email?.split('@')[0] || uid.slice(-8) }, $setOnInsert: { tier: 'free', createdAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by Firebase UID (for mobile app sync)
router.get('/firebase/:uid', async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.params.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const allowed = ['username', 'fullName', 'phone', 'bio', 'profilePicture', 'homeCity', 'socialLinks', 'travelPreferences'];
    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: updates },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete profile
router.delete('/profile', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const TripPlan = getTripPlan();
    
    const user = await User.findOneAndDelete({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (TripPlan) await TripPlan.deleteMany({ userId: user._id });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/:id/stats', async (req, res) => {
  try {
    const User = getUser();
    const TripPlan = getTripPlan();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const uid = await extractUid(token);
    
    if (!uid) return res.status(401).json({ error: 'Invalid token' });
    
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tripCount = TripPlan ? await TripPlan.countDocuments({ userId: user._id }) : 0;

    const Post = mongoose.model('Post');
    const postCount = await Post.countDocuments({ userId: user._id });

    res.json({
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      fullName: user.fullName,
      phone: user.phone,
      bio: user.bio,
      homeCity: user.homeCity,
      totalTrips: tripCount,
      totalFavorites: user.favoritePlaces?.length || 0,
      totalPosts: postCount,
      totalVisited: user.visitedPlaces?.length || 0,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      memberSince: user.createdAt,
      tier: user.tier || 'free',
      socialLinks: user.socialLinks,
      travelPreferences: user.travelPreferences
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Favorites
router.get('/favorites', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.favoritePlaces || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/favorites', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const { placeId } = req.body;
    if (!placeId) return res.status(400).json({ error: 'placeId required' });

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.favoritePlaces.includes(placeId)) {
      user.favoritePlaces.push(placeId);
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/favorites/:placeId', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.favoritePlaces = user.favoritePlaces.filter(id => id !== req.params.placeId);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trip plans
router.get('/trip-plans', async (req, res) => {
  try {
    const User = getUser();
    const TripPlan = getTripPlan();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const uid = await extractUid(token);
    
    if (!uid) return res.status(401).json({ error: 'Invalid token' });
    
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    console.log('📝 Fetching trip plans for user._id:', user._id);
    const trips = TripPlan ? await TripPlan.find({ userId: user._id }).sort({ createdAt: -1 }) : [];
    console.log('✅ Found', trips.length, 'trip plans');
    
    res.json(trips);
  } catch (error) {
    console.error('❌ Error fetching trip plans:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/trip-plans', async (req, res) => {
  try {
    const User = getUser();
    const TripPlan = getTripPlan();
    if (!TripPlan) return res.status(500).json({ error: 'TripPlan model not available' });
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const uid = await extractUid(token);
    
    if (!uid) return res.status(401).json({ error: 'Invalid token' });
    
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    console.log('💾 Saving trip plan for user._id:', user._id);
    console.log('📝 Trip plan data:', JSON.stringify(req.body).substring(0, 200));
    
    const trip = new TripPlan({ ...req.body, userId: user._id });
    await trip.save();
    
    console.log('✅ Trip plan saved:');
    console.log('   - Trip _id:', trip._id);
    console.log('   - Trip userId:', trip.userId);
    console.log('   - User _id:', user._id);
    console.log('   - Match:', String(trip.userId) === String(user._id));

    res.status(201).json(trip);
  } catch (error) {
    console.error('❌ Error saving trip plan:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/trip-plans/:id', async (req, res) => {
  try {
    const User = getUser();
    const TripPlan = getTripPlan();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const uid = await extractUid(token);
    
    if (!uid) return res.status(401).json({ error: 'Invalid token' });
    
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const trip = await TripPlan.findOne({ _id: req.params.id, userId: user._id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/trip-plans/:id', async (req, res) => {
  try {
    const User = getUser();
    const TripPlan = getTripPlan();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const uid = await extractUid(token);
    
    if (!uid) return res.status(401).json({ error: 'Invalid token' });
    
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const trip = await TripPlan.findOne({ _id: req.params.id, userId: user._id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    await trip.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security settings
router.get('/security', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      emailVerified: user.emailVerified || true,
      phoneVerified: user.phoneVerified || false,
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastLogin: user.lastLogin || new Date(),
      loginHistory: user.loginHistory || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/security', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: req.body },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Privacy settings
router.put('/privacy', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: { privacySettings: req.body } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notification preferences
router.put('/notifications', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: { notificationPreferences: req.body } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update subscription
router.put('/subscription', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const { tier, status, trialEndDate, subscriptionEndDate } = req.body;
    
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { 
        $set: { 
          tier,
          subscriptionTier: tier,
          subscriptionStatus: status,
          trialEndDate,
          subscriptionEndDate
        }
      },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Travel stats
router.get('/travel-stats', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const now = new Date();
    const thisMonth = user.visitedPlaces?.filter(p => {
      const visitDate = new Date(p.visitedAt);
      return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
    }).length || 0;
    
    res.json({
      totalPlacesVisited: user.visitedPlaces?.length || 0,
      placesVisitedThisMonth: thisMonth,
      totalDistanceKm: user.totalDistanceKm || 0,
      currentStreak: user.travelStreak || 0,
      favoriteCategory: user.favoriteCategory || 'Exploring'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/travel-stats', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: { 
        totalDistanceKm: req.body.totalDistanceKm,
        travelStreak: req.body.currentStreak,
        favoriteCategory: req.body.favoriteCategory
      }}
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add visited place
router.post('/visited-places', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const { placeId, visitedAt } = req.body;
    if (!placeId) return res.status(400).json({ error: 'placeId required' });
    
    await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $push: { visitedPlaces: { placeId, visitedAt: visitedAt || new Date() } } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Social features
router.get('/followers', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid }).populate('followers', 'username profilePicture');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.followers || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/following', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid }).populate('following', 'username profilePicture');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.following || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/followers/count', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ count: user.followers?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/following/count', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ count: user.following?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/follow/:userId', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });
    
    if (!user.following.includes(req.params.userId)) {
      await User.findByIdAndUpdate(user._id, { $addToSet: { following: targetUser._id } });
      await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: user._id } });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/follow/:userId', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });
    
    await User.findByIdAndUpdate(user._id, { $pull: { following: targetUser._id } });
    await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: user._id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Posts count
router.get('/posts/count', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const Post = mongoose.model('Post');
    const count = await Post.countDocuments({ userId: user._id });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bookmarked posts
router.get('/bookmarked-posts', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const Post = mongoose.model('Post');
    const posts = await Post.find({ _id: { $in: user.bookmarkedPosts || [] } }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bookmark/:postId', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $addToSet: { bookmarkedPosts: req.params.postId } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bookmark/:postId', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $pull: { bookmarkedPosts: req.params.postId } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Social links
router.get('/social-links', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.socialLinks || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/social-links', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: { socialLinks: req.body } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preferences
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.travelPreferences || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: { travelPreferences: req.body } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Data management
router.get('/export', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const TripPlan = getTripPlan();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const trips = TripPlan ? await TripPlan.find({ userId: user._id }) : [];
    const Post = mongoose.model('Post');
    const posts = await Post.find({ userId: user._id });
    
    res.json({
      profile: user,
      trips,
      posts,
      exportedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/account', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const TripPlan = getTripPlan();
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (TripPlan) await TripPlan.deleteMany({ userId: user._id });
    const Post = mongoose.model('Post');
    await Post.deleteMany({ userId: user._id });
    await User.deleteOne({ firebaseUid: req.user.uid });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/password-reset', requireAuth, async (req, res) => {
  try {
    res.json({ success: true, message: 'Password reset email sent. Check your inbox.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
