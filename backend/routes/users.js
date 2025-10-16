import express from 'express';
import { verifyFirebaseToken, optionalAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Use the main User model from server.js
const User = global.User || mongoose.model('User');

// Mock models for missing dependencies
const TripPlan = {
  find: () => ({ sort: () => [] }),
  countDocuments: () => 0,
  deleteMany: () => Promise.resolve()
};

const Post = {
  countDocuments: () => 0,
  deleteMany: () => Promise.resolve()
};

const Itinerary = {
  countDocuments: () => 0,
  deleteMany: () => Promise.resolve()
};

const Deal = {
  find: () => ({ sort: () => [] })
};

// Sync user profile with backend (create or update)
router.post('/sync', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email } = req.user;
    const userData = req.body;

    // Find existing user by Firebase UID
    let user = await User.findOne({ firebaseUid: uid });
    
    if (user) {
      // Update existing user
      const updatable = [
        'username', 'email', 'profilePicture', 'bio', 'website', 'location', 
        'birthday', 'languages', 'travelInterests', 'budgetPreference', 
        'interests', 'budgetPreferences', 'showBirthdayToOthers', 
        'showLocationToOthers', 'travelStyle', 'subscriptionStatus', 'tier',
        'trialEndDate', 'subscriptionEndDate', 'homeCurrency', 'language',
        'selectedInterests', 'hasCompletedWizard'
      ];
      
      let changed = false;
      for (const key of updatable) {
        if (userData[key] !== undefined && user[key] !== userData[key]) {
          user[key] = userData[key];
          changed = true;
        }
      }
      
      if (changed) {
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        firebaseUid: uid,
        email: email || userData.email,
        username: userData.username || email?.split('@')[0] || uid,
        ...userData
      });
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Error syncing user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findById(uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const updates = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user profile
router.delete('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;

    const user = await User.findOneAndDelete({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also delete related data
    await Promise.all([
      TripPlan.deleteMany({ userId: user._id }),
      Post.deleteMany({ userId: user._id }),
      Itinerary.deleteMany({ userId: user._id })
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/stats', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [tripCount, postCount, favoriteCount, itineraryCount] = await Promise.all([
      TripPlan.countDocuments({ userId: user._id }),
      Post.countDocuments({ userId: user._id }),
      user.favoritePlaces ? user.favoritePlaces.length : 0,
      Itinerary.countDocuments({ userId: user._id })
    ]);

    const stats = {
      totalTrips: tripCount,
      totalPosts: postCount,
      totalFavorites: favoriteCount,
      totalItineraries: itineraryCount,
      memberSince: user.createdAt,
      profileType: user.profileType || 'traveler',
      tier: user.tier || 'free',
      subscriptionStatus: user.subscriptionStatus || 'none',
      placesVisited: favoriteCount,
      badgesEarned: _calculateBadges(tripCount, postCount, favoriteCount),
      travelScore: _calculateTravelScore(tripCount, postCount, favoriteCount, itineraryCount)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Favorites endpoints
router.get('/favorites', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.favoritePlaces || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/favorites', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { placeId } = req.body;

    if (!placeId) {
      return res.status(400).json({ error: 'placeId is required' });
    }

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.favoritePlaces.includes(placeId)) {
      user.favoritePlaces.push(placeId);
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/favorites/:placeId', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { placeId } = req.params;

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.favoritePlaces = user.favoritePlaces.filter(id => id !== placeId);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Travel style endpoints
router.get('/travel-style', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ travelStyle: user.travelStyle || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/travel-style', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { travelStyle } = req.body;

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.travelStyle = travelStyle;
    await user.save();

    res.json({ success: true, travelStyle: user.travelStyle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Travel stats endpoints
router.get('/travel-stats', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate travel stats from user data
    const [tripCount, favoriteCount] = await Promise.all([
      TripPlan.countDocuments({ userId: user._id }),
      user.favoritePlaces ? user.favoritePlaces.length : 0
    ]);

    const stats = {
      totalPlacesVisited: favoriteCount,
      totalTrips: tripCount,
      favoriteCategories: ['restaurants', 'attractions'], // Could be calculated from actual data
      averageRating: 4.2,
      totalReviews: 0,
      memberSince: user.createdAt
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/travel-stats', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const stats = req.body;

    // For now, just acknowledge the update
    // In a full implementation, you might store these stats
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscription endpoints
router.put('/subscription', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const subscriptionData = req.body;

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update subscription fields
    if (subscriptionData.tier) user.tier = subscriptionData.tier;
    if (subscriptionData.status) user.subscriptionStatus = subscriptionData.status;
    if (subscriptionData.trialEndDate) user.trialEndDate = subscriptionData.trialEndDate;
    if (subscriptionData.subscriptionEndDate) user.subscriptionEndDate = subscriptionData.subscriptionEndDate;

    await user.save();

    res.json({
      tier: user.tier,
      subscriptionStatus: user.subscriptionStatus,
      trialEndDate: user.trialEndDate,
      subscriptionEndDate: user.subscriptionEndDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trip plans endpoints
router.get('/trip-plans', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const trips = await TripPlan.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/trip-plans', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tripData = { ...req.body, userId: user._id };
    const trip = new TripPlan(tripData);
    await trip.save();

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/trip-plans/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const trip = await TripPlan.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: req.body },
      { new: true }
    );

    if (!trip) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/trip-plans/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const trip = await TripPlan.findOneAndDelete({ _id: id, userId: user._id });
    if (!trip) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User deals endpoint
router.get('/deals', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get deals for this user (if they're a merchant)
    const deals = await Deal.find({ merchantId: user._id }).sort({ createdAt: -1 });
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function _calculateBadges(trips, posts, favorites) {
  const badges = [];
  if (trips >= 1) badges.push('First Trip');
  if (trips >= 5) badges.push('Explorer');
  if (trips >= 10) badges.push('Travel Expert');
  if (posts >= 1) badges.push('Storyteller');
  if (posts >= 10) badges.push('Community Star');
  if (favorites >= 5) badges.push('Curator');
  if (favorites >= 20) badges.push('Place Collector');
  return badges;
}

function _calculateTravelScore(trips, posts, favorites, itineraries) {
  return Math.min(1000, (trips * 50) + (posts * 20) + (favorites * 10) + (itineraries * 30));
}

export default router;