import express from 'express';

const router = express.Router();

// Check authorization status
router.get('/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      firebase: {
        configured: !!(process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_ADMIN_CREDENTIALS_JSON),
        adminConfigured: !!process.env.FIREBASE_ADMIN_CREDENTIALS_JSON,
        clientConfigured: !!process.env.VITE_FIREBASE_API_KEY
      },
      authentication: {
        methods: [],
        endpoints: {
          demoLogin: '/api/demo-auth/demo-login',
          firebaseSync: '/api/users/sync',
          createAdmin: '/api/setup/create-admin'
        }
      },
      database: {
        connected: global.User ? true : false,
        models: ['User', 'Post', 'TripPlan', 'Deal'].filter(model => global[model])
      }
    };

    // Check available auth methods
    if (status.firebase.configured) {
      status.authentication.methods.push('Firebase Auth', 'Google Sign-in');
    }
    if (process.env.ADMIN_API_KEY) {
      status.authentication.methods.push('Demo Admin Login');
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check auth status', 
      details: error.message 
    });
  }
});

export default router;