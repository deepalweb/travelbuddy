import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

const getUser = () => mongoose.model('User');
const getTripPlan = () => mongoose.model('TripPlan');

// Helper to extract uid from token
async function extractUid(token) {
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
    const allowed = ['username', 'email', 'fullName', 'phone', 'bio', 'profilePicture'];
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
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const User = getUser();
    const TripPlan = getTripPlan();
    
    const user = await User.findOne({ firebaseUid: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tripCount = TripPlan ? await TripPlan.countDocuments({ userId: user._id }) : 0;

    res.json({
      totalTrips: tripCount,
      totalFavorites: user.favoritePlaces?.length || 0,
      memberSince: user.createdAt,
      tier: user.tier || 'free'
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

    const trips = TripPlan ? await TripPlan.find({ userId: user._id }).sort({ createdAt: -1 }) : [];
    res.json(trips);
  } catch (error) {
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

    const trip = new TripPlan({ ...req.body, userId: user._id });
    await trip.save();

    res.status(201).json(trip);
  } catch (error) {
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

export default router;
