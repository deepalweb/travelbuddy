import express from 'express';
import { verifyFirebaseToken, optionalAuth, devFriendlyAuth, bypassAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper function to get models with retry logic
const getModel = (modelName) => {
  try {
    // Try global first
    if (global[modelName]) return global[modelName];
    // Try mongoose registry
    return mongoose.model(modelName);
  } catch (e) {
    return null;
  }
};

// Use the main User model from server.js
const getUser = () => getModel('User');
let User = getUser();

// Get other models with fallbacks
const getTripPlan = () => getModel('TripPlan');
const getPost = () => getModel('Post');
const getItinerary = () => getModel('Itinerary');
const getDeal = () => getModel('Deal');

let TripPlan = getTripPlan();
let Post = getPost();
let Itinerary = getItinerary();
let Deal = getDeal();

// Sync user profile with backend (create or update)
router.post('/sync', bypassAuth, async (req, res) => {
  try {
    console.log('🔄 Users route sync request received');
    console.log('📋 Request body:', req.body);
    console.log('🔑 Auth headers:', {
      authorization: req.headers.authorization ? 'Bearer [REDACTED]' : 'none',
      'x-user-id': req.headers['x-user-id'] || 'none'
    });
    console.log('👤 Req.user:', req.user);
    
    // Extract user info from headers if not in req.user
    if (!req.user || !req.user.uid) {
      console.log('⚠️ No user in req.user, attempting to extract from headers');
      const userId = req.headers['x-user-id'];
      const authHeader = req.headers['authorization'];
      
      if (userId) {
        console.log('✅ Using x-user-id header:', userId);
        req.user = { uid: userId };
      } else if (authHeader) {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (token) {
          try {
            // Try Firebase JWT decode first
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
              const uid = payload.user_id || payload.sub || payload.uid;
              if (uid) {
                console.log('✅ Extracted uid from Firebase token:', uid);
                req.user = { uid, email: payload.email };
              } else {
                console.log('⚠️ No uid found in Firebase token payload');
              }
            } else {
              // Fallback to simple base64 decode
              const decoded = Buffer.from(token, 'base64').toString('utf8');
              const [uid] = decoded.split(':');
              console.log('✅ Extracted uid from simple token:', uid);
              req.user = { uid };
            }
          } catch (e) {
            console.log('⚠️ Token decode failed in users route:', e.message);
          }
        }
      }
    }
    
    if (!req.user || !req.user.uid) {
      console.log('❌ Auth failed - no user or uid. Final req.user:', req.user);
      return res.status(401).json({ 
        error: 'Authentication required',
        debug: {
          hasUser: !!req.user,
          hasUid: !!(req.user && req.user.uid),
          headers: {
            hasAuth: !!req.headers.authorization,
            hasUserId: !!req.headers['x-user-id']
          }
        }
      });
    }
    
    // Check if User model is available (retry if needed)
    if (!User) {
      console.log('⚠️ User model not available, retrying...');
      User = getUser();
    }
    if (!User) {
      console.error('❌ User model still not available after retry');
      console.error('🔍 Debug info:', {
        globalUser: !!global.User,
        mongooseConnection: mongoose.connection.readyState,
        mongooseModels: Object.keys(mongoose.models)
      });
      return res.status(500).json({ 
        error: 'User model not available',
        debug: {
          message: 'User model not initialized',
          globalUser: !!global.User,
          dbState: mongoose.connection.readyState,
          availableModels: Object.keys(mongoose.models)
        }
      });
    }
    
    console.log('✅ User model available');
    
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

    console.log('✅ User sync successful:', user._id);
    res.json(user);
  } catch (error) {
    console.error('❌ Error syncing user profile:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      debug: {
        userModelAvailable: !!User,
        mongooseConnection: mongoose.connection.readyState,
        mongooseModels: Object.keys(mongoose.models),
        globalUser: !!global.User
      }
    });
  }
});

// Get user profile
router.get('/profile', bypassAuth, async (req, res) => {
  try {
    if (!User) User = getUser();
    if (!User) return res.status(500).json({ error: 'User model not available' });
    
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

    // Also delete related data (retry getting models if needed)
    if (!TripPlan) TripPlan = getTripPlan();
    if (!Post) Post = getPost();
    if (!Itinerary) Itinerary = getItinerary();
    
    await Promise.all([
      TripPlan ? TripPlan.deleteMany({ userId: user._id }) : Promise.resolve(),
      Post ? Post.deleteMany({ userId: user._id }) : Promise.resolve(),
      Itinerary ? Itinerary.deleteMany({ userId: user._id }) : Promise.resolve()
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats with role-based data
router.get('/:id/stats', bypassAuth, async (req, res) => {
  try {
    if (!User) User = getUser();
    if (!User) return res.status(500).json({ error: 'User model not available' });
    
    console.log('📊 Stats request for user:', req.params.id);
    
    // Use the ID from the URL parameter
    const userId = req.params.id;
    
    // Find user by Firebase UID or MongoDB ID
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      try {
        user = await User.findById(userId);
      } catch (mongoError) {
        console.log('⚠️ Invalid MongoDB ID format:', userId);
      }
    }
    
    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found', userId });
    }
    
    console.log('👤 Found user for stats:', user._id);

    // Retry getting models if they weren't available at startup
    if (!TripPlan) TripPlan = getTripPlan();
    if (!Post) Post = getPost();
    if (!Itinerary) Itinerary = getItinerary();
    
    const [tripCount, postCount, favoriteCount, itineraryCount] = await Promise.all([
      TripPlan ? TripPlan.countDocuments({ userId: user._id }).catch(() => 0) : 0,
      Post ? Post.countDocuments({ userId: user._id }).catch(() => 0) : 0,
      user.favoritePlaces ? user.favoritePlaces.length : 0,
      Itinerary ? Itinerary.countDocuments({ userId: user._id }).catch(() => 0) : 0
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
      if (!Deal) Deal = getDeal();
      const dealCount = Deal ? await Deal.countDocuments({ merchantId: user._id }).catch(() => 0) : 0;
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
    console.error('❌ Stats endpoint error:', error);
    res.status(500).json({ 
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.params.id
    });
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
    if (!TripPlan) TripPlan = getTripPlan();
    
    const [tripCount, favoriteCount] = await Promise.all([
      TripPlan ? TripPlan.countDocuments({ userId: user._id }) : 0,
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
router.get('/trip-plans/:id', devFriendlyAuth, async (req, res) => {
  try {
    console.log('🔍 Fetching single trip plan:', req.params.id);
    
    User = getUser();
    TripPlan = getTripPlan();
    if (!TripPlan && global.TripPlan) TripPlan = global.TripPlan;
    
    if (!User || !TripPlan) {
      return res.status(500).json({ error: 'Required models not available' });
    }
    
    const { uid } = req.user;
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const trip = await TripPlan.findOne({ _id: req.params.id, userId: user._id });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('❌ Error fetching trip:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/trip-plans', devFriendlyAuth, async (req, res) => {
  try {
    console.log('🔍 Fetching trip plans via users route');
    console.log('🔍 Authenticated user:', req.user);
    
    // Retry getting models
    if (!User) User = getUser();
    if (!TripPlan) TripPlan = getTripPlan();
    
    if (!User) {
      console.error('❌ User model not available');
      return res.status(500).json({ error: 'User model not available' });
    }
    
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    
    // Auto-create user if they don't exist
    if (!user) {
      console.log('🆕 User not found, checking by email...');
      const { email } = req.user;
      
      // Check if user exists by email
      if (email) {
        user = await User.findOne({ email });
      }
      
      if (!user) {
        console.log('🆕 Creating new user for uid:', uid);
        try {
          user = new User({
            firebaseUid: uid,
            username: email?.split('@')[0] || `user-${uid.slice(-6)}`,
            email: email || `${uid}@temp.local`,
            tier: 'free'
          });
          await user.save();
          console.log('✅ Created new user:', user._id);
        } catch (createError) {
          // If duplicate email, try to find and update with firebaseUid
          if (createError.code === 11000) {
            console.log('⚠️ Duplicate email, updating existing user with firebaseUid');
            user = await User.findOneAndUpdate(
              { email },
              { $set: { firebaseUid: uid } },
              { new: true }
            );
            console.log('✅ Updated existing user:', user._id);
          } else {
            throw createError;
          }
        }
      } else {
        // Update existing user with firebaseUid if missing
        if (!user.firebaseUid) {
          user.firebaseUid = uid;
          await user.save();
          console.log('✅ Updated user with firebaseUid:', user._id);
        }
      }
    }

    console.log('👤 Found user:', user._id);
    
    if (!TripPlan) {
      console.log('⚠️ TripPlan model not available yet, returning empty array');
      return res.json([]);
    }
    
    const trips = await TripPlan.find({ userId: user._id }).sort({ createdAt: -1 });
    console.log(`✅ Found ${trips.length} trips for user`);
    res.json(trips);
  } catch (error) {
    console.error('❌ Error fetching trip plans:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/trip-plans', devFriendlyAuth, async (req, res) => {
  try {
    console.log('🚀 Creating trip plan via users route:', req.body);
    
    // Always retry getting models
    User = getUser();
    TripPlan = getTripPlan();
    
    // Also check global
    if (!TripPlan && global.TripPlan) {
      TripPlan = global.TripPlan;
    }
    
    if (!User) {
      console.error('❌ User model not available');
      console.error('Available models:', Object.keys(mongoose.models));
      return res.status(500).json({ error: 'User model not available' });
    }
    
    if (!TripPlan) {
      console.error('❌ TripPlan model not available');
      console.error('Available models:', Object.keys(mongoose.models));
      console.error('Global TripPlan:', !!global.TripPlan);
      return res.status(500).json({ error: 'TripPlan model not available' });
    }
    
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      console.log('❌ User not found for uid:', uid);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 Found user:', user._id);
    
    // Check for duplicate trip (same title, destination, and duration within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingTrip = await TripPlan.findOne({
      userId: user._id,
      tripTitle: req.body.tripTitle,
      destination: req.body.destination,
      duration: req.body.duration,
      createdAt: { $gte: fiveMinutesAgo }
    });
    
    if (existingTrip) {
      console.log('⚠️ Duplicate trip detected, returning existing trip:', existingTrip._id);
      return res.status(200).json(existingTrip);
    }
    
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

router.put('/trip-plans/:id', devFriendlyAuth, async (req, res) => {
  try {
    // Retry getting models
    if (!User) User = getUser();
    if (!TripPlan) TripPlan = getTripPlan();
    
    if (!User || !TripPlan) {
      return res.status(500).json({ error: 'Required models not available' });
    }
    
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

router.delete('/trip-plans/:id', devFriendlyAuth, async (req, res) => {
  try {
    console.log('🗑️ DELETE trip plan request:', req.params.id);
    
    // Retry getting models
    if (!User) User = getUser();
    if (!TripPlan) TripPlan = getTripPlan();
    
    if (!User || !TripPlan) {
      console.error('❌ Models not available');
      return res.status(500).json({ error: 'Required models not available' });
    }
    
    const { uid } = req.user;
    const { id } = req.params;
    
    console.log('👤 User UID:', uid);
    console.log('🆔 Trip ID:', id);
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ Invalid trip plan ID format:', id);
      return res.status(400).json({ error: 'Invalid trip plan ID format' });
    }
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      console.error('❌ User not found for UID:', uid);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User found:', user._id);

    const trip = await TripPlan.findOneAndDelete({ _id: id, userId: user._id });
    if (!trip) {
      console.error('❌ Trip plan not found or not owned by user');
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    console.log('✅ Trip plan deleted:', trip.tripTitle);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting trip plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// User deals endpoint
router.get('/deals', bypassAuth, async (req, res) => {
  try {
    // Retry getting models
    if (!User) User = getUser();
    if (!Deal) Deal = getDeal();
    
    if (!User) {
      return res.status(500).json({ error: 'User model not available' });
    }
    
    const { uid } = req.user;
    
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get deals for this user (if they're a merchant)
    if (!Deal) {
      return res.json([]);
    }
    const deals = await Deal.find({ merchantId: user._id }).sort({ createdAt: -1 });
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security endpoints
router.get('/security', async (req, res) => {
  try {
    if (!User) User = getUser();
    if (!User) return res.status(500).json({ error: 'User model not available' });
    
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      user = await User.findById(userId);
    }
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
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const { twoFactorEnabled, emailVerified, phoneVerified } = req.body;
    
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      user = await User.findById(userId);
    }
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

// Debug endpoint to test if users routes are working
router.get('/test', (req, res) => {
  try {
    console.log('🧪 Users test endpoint hit');
    
    // Check model availability
    const models = {
      User: !!getUser(),
      TripPlan: !!getTripPlan(),
      Post: !!getPost(),
      Itinerary: !!getItinerary(),
      Deal: !!getDeal()
    };
    
    res.json({ 
      message: 'Users routes are working!', 
      timestamp: new Date().toISOString(),
      database: {
        connected: mongoose.connection.readyState === 1,
        state: mongoose.connection.readyState,
        states: { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
      },
      models,
      availableRoutes: [
        'GET /api/users/test',
        'POST /api/users/sync',
        'GET /api/users/profile',
        'GET /api/users/trip-plans',
        'POST /api/users/trip-plans',
        'PUT /api/users/trip-plans/:id',
        'DELETE /api/users/trip-plans/:id'
      ]
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;