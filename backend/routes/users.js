import express from 'express';
import { verifyFirebaseToken, optionalAuth, devFriendlyAuth, bypassAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Use the main User model from server.js
const User = global.User || mongoose.model('User');

// Use real models from global scope (defined in server.js)
const TripPlan = global.TripPlan || (() => {
  try {
    return mongoose.model('TripPlan');
  } catch {
    return null;
  }
})();

const Post = global.Post || (() => {
  try {
    return mongoose.model('Post');
  } catch {
    return {
      countDocuments: () => 0,
      deleteMany: () => Promise.resolve()
    };
  }
})();

const Itinerary = global.Itinerary || (() => {
  try {
    return mongoose.model('Itinerary');
  } catch {
    return {
      countDocuments: () => 0,
      deleteMany: () => Promise.resolve()
    };
  }
})();

const Deal = global.Deal || (() => {
  try {
    return mongoose.model('Deal');
  } catch {
    return {
      find: () => ({ sort: () => [] })
    };
  }
})();

// Sync user profile with backend (create or update)
router.post('/sync', bypassAuth, async (req, res) => {
  try {
    console.log('🔄 Users route sync request:', { user: req.user, body: req.body });
    
    // Extract user info from headers if not in req.user
    if (!req.user || !req.user.uid) {
      const userId = req.headers['x-user-id'];
      const authHeader = req.headers['authorization'];
      
      if (userId) {
        req.user = { uid: userId };
      } else if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (token) {
          try {
            const decoded = Buffer.from(token, 'base64').toString('utf8');
            const [uid] = decoded.split(':');
            req.user = { uid };
          } catch (e) {
            console.log('⚠️ Token decode failed in users route');
          }
        }
      }
    }
    
    if (!req.user || !req.user.uid) {
      console.log('❌ Auth failed - no user or uid');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { uid, email } = req.user;
    const userData = req.body;

    // Find existing user by Firebase UID or email
    let user = await User.findOne({ 
      $or: [
        { firebaseUid: uid },
        { email: email || userData.email }
      ]
    });
    
    if (user) {
      // Update existing user
      const updatable = [
        'email', 'profilePicture', 'bio', 'website', 'location', 
        'birthday', 'languages', 'travelInterests', 'budgetPreference', 
        'interests', 'budgetPreferences', 'showBirthdayToOthers', 
        'showLocationToOthers', 'travelStyle', 'subscriptionStatus', 'tier',
        'trialEndDate', 'subscriptionEndDate', 'homeCurrency', 'language',
        'selectedInterests', 'hasCompletedWizard', 'fullName', 'phone',
        'homeCity', 'emailVerified', 'phoneVerified', 'twoFactorEnabled',
        'aiGenerationsUsed', 'profileViews', 'clientsServed', 'clientSatisfaction',
        'agentRating', 'ridesCompleted', 'fleetUsage', 'driverRating', 'businessRating'
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
      // Update firebaseUid if missing
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
      }
    } else {
      // Create new user with unique username
      let username = userData.username || email?.split('@')[0] || uid;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${userData.username || email?.split('@')[0] || uid}_${counter}`;
        counter++;
      }
      
      user = new User({
        firebaseUid: uid,
        email: email || userData.email,
        username,
        ...userData
      });
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Error syncing user profile:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Get user profile
router.get('/profile', bypassAuth, async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile with extended fields
router.put('/profile', bypassAuth, async (req, res) => {
  try {
    console.log('🔄 Profile update request (PUT):', { user: req.user, body: req.body });
    
    const { uid } = req.user;
    const updates = req.body;

    // Allowed fields for update
    const allowedFields = [
      'username', 'email', 'fullName', 'phone', 'bio', 'homeCity', 
      'languages', 'profilePicture', 'travelStyle', 'interests',
      'emailVerified', 'phoneVerified', 'twoFactorEnabled'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: filteredUpdates },
      { new: true }
    );

    console.log('👤 Found user:', user ? user._id : 'not found');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (PATCH for mobile app)
router.patch('/profile', bypassAuth, async (req, res) => {
  try {
    console.log('🔄 Profile update request (PATCH):', { user: req.user, body: req.body });
    
    const { uid } = req.user;
    const updates = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updates },
      { new: true }
    );

    console.log('👤 Found user:', user ? user._id : 'not found');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user profile
router.delete('/profile', bypassAuth, async (req, res) => {
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

// Get user stats with role-based data
router.get('/:id/stats', async (req, res) => {
  try {
    console.log('📊 Stats request for user:', req.params.id);
    
    // Use the ID from the URL parameter
    const userId = req.params.id;
    
    // Find user by Firebase UID or MongoDB ID
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      user = await User.findById(userId);
    }
    
    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('👤 Found user for stats:', user._id);

    const [tripCount, postCount, favoriteCount, itineraryCount] = await Promise.all([
      TripPlan.countDocuments({ userId: user._id }),
      Post.countDocuments({ userId: user._id }),
      user.favoritePlaces ? user.favoritePlaces.length : 0,
      Itinerary.countDocuments({ userId: user._id })
    ]);

    // Base stats
    const stats = {
      totalTrips: tripCount,
      totalPosts: postCount,
      totalFavorites: favoriteCount,
      totalItineraries: itineraryCount,
      memberSince: user.createdAt,
      profileType: user.profileType || 'traveler',
      tier: user.tier || 'explorer',
      subscriptionStatus: user.subscriptionStatus || 'none',
      placesVisited: favoriteCount,
      badgesEarned: _calculateBadges(tripCount, postCount, favoriteCount),
      travelScore: _calculateTravelScore(tripCount, postCount, favoriteCount, itineraryCount),
      aiGenerations: user.aiGenerationsUsed || 0,
      profileViews: user.profileViews || 0
    };

    // Role-based stats
    const role = user.activeRole || user.role || 'user';
    if (role === 'merchant') {
      const dealCount = await Deal.countDocuments({ merchantId: user._id });
      stats.dealsCreated = dealCount;
      stats.businessRating = user.businessRating || 4.8;
    } else if (role === 'travel_agent') {
      stats.clientsServed = user.clientsServed || 0;
      stats.clientSatisfaction = user.clientSatisfaction || 95;
      stats.agentRating = user.agentRating || 4.9;
    } else if (role === 'transport_provider') {
      stats.ridesCompleted = user.ridesCompleted || 0;
      stats.fleetUsage = user.fleetUsage || 85;
      stats.driverRating = user.driverRating || 4.7;
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Favorites endpoints
router.get('/favorites', bypassAuth, async (req, res) => {
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

router.post('/favorites', bypassAuth, async (req, res) => {
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

router.delete('/favorites/:placeId', bypassAuth, async (req, res) => {
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
router.get('/travel-style', bypassAuth, async (req, res) => {
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

router.put('/travel-style', bypassAuth, async (req, res) => {
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
router.get('/travel-stats', bypassAuth, async (req, res) => {
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

router.put('/travel-stats', bypassAuth, async (req, res) => {
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
router.get('/subscription', bypassAuth, async (req, res) => {
  try {
    const { uid } = req.user;

    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      tier: user.tier || 'free',
      subscriptionStatus: user.subscriptionStatus || 'none',
      trialEndDate: user.trialEndDate,
      subscriptionEndDate: user.subscriptionEndDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/subscription', bypassAuth, async (req, res) => {
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
router.get('/trip-plans', bypassAuth, async (req, res) => {
  try {
    console.log('🔍 Fetching trip plans via users route');
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      console.log('❌ User not found for uid:', uid);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 Found user:', user._id);
    const trips = await TripPlan.find({ userId: user._id }).sort({ createdAt: -1 });
    console.log(`✅ Found ${trips.length} trips for user`);
    res.json(trips);
  } catch (error) {
    console.error('❌ Error fetching trip plans:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/trip-plans', bypassAuth, async (req, res) => {
  try {
    console.log('🚀 Creating trip plan via users route:', req.body);
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      console.log('❌ User not found for uid:', uid);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 Found user:', user._id);
    const tripData = { ...req.body, userId: user._id };
    console.log('📝 Trip data to save:', tripData);
    
    const trip = new TripPlan(tripData);
    const savedTrip = await trip.save();
    console.log('✅ Trip saved successfully:', savedTrip._id);

    res.status(201).json(savedTrip);
  } catch (error) {
    console.error('❌ Error creating trip plan:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/trip-plans/:id', bypassAuth, async (req, res) => {
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

router.delete('/trip-plans/:id', bypassAuth, async (req, res) => {
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
router.get('/deals', bypassAuth, async (req, res) => {
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

// Security endpoints
router.get('/security', async (req, res) => {
  try {
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      emailVerified: user.emailVerified || false,
      phoneVerified: user.phoneVerified || false,
      twoFactorEnabled: user.twoFactorEnabled || false,
      lastLogin: user.lastLogin || new Date(),
      loginHistory: user.loginHistory || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/security', async (req, res) => {
  try {
    const { uid } = req.user;
    const { twoFactorEnabled, emailVerified, phoneVerified } = req.body;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;
    if (emailVerified !== undefined) user.emailVerified = emailVerified;
    if (phoneVerified !== undefined) user.phoneVerified = phoneVerified;

    await user.save();

    res.json({
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled
    });
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