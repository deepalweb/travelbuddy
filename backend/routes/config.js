import express from 'express';
const router = express.Router();

// Serve frontend configuration
router.get('/config', (req, res) => {
  res.json({
    apiBaseUrl: process.env.VITE_API_BASE_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net',
    firebase: {
      apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCuJr5N0ytr1h_Aq_5qQazNL0wQUnsZlAw',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'travelbuddy-2d1c5.firebaseapp.com',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'travelbuddy-2d1c5',
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'travelbuddy-2d1c5.firebasestorage.app',
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '45425409967',
      appId: process.env.VITE_FIREBASE_APP_ID || '1:45425409967:web:782638c65a40dcb156b95a'
    },
    googleMapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAey-fuui7b3I-PkzJDVfsTFa9Kv_b_6ls',
    unsplash: {
      accessKey: process.env.VITE_UNSPLASH_ACCESS_KEY || 'J4khiSIy9hN7kZabjiTdQR-SG_FgxNX25icqGuleqhs'
    }
  });
});

// Runtime config endpoint
router.get('/runtime', (req, res) => {
  res.json({
    apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCuJr5N0ytr1h_Aq_5qQazNL0wQUnsZlAw',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'travelbuddy-2d1c5.firebaseapp.com',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'travelbuddy-2d1c5'
  });
});

// Debug endpoint to check Azure environment variables
router.get('/debug-env', (req, res) => {
  res.json({
    hasFirebaseApiKey: !!process.env.VITE_FIREBASE_API_KEY,
    hasFirebaseAuthDomain: !!process.env.VITE_FIREBASE_AUTH_DOMAIN,
    hasFirebaseProjectId: !!process.env.VITE_FIREBASE_PROJECT_ID,
    nodeEnv: process.env.NODE_ENV,
    apiKeyPreview: process.env.VITE_FIREBASE_API_KEY ? process.env.VITE_FIREBASE_API_KEY.substring(0, 10) + '...' : 'Missing'
  });
});

export default router;