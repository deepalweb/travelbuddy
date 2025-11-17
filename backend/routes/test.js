const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    platform: req.platform || 'unknown',
    version: '1.0.0'
  });
});

// Connectivity test for mobile/web
router.get('/connectivity', (req, res) => {
  const platform = req.headers['x-platform'] || 'web';
  
  res.json({
    connected: true,
    platform: platform,
    timestamp: new Date().toISOString(),
    endpoints: {
      places: '/api/v1/places/search',
      deals: '/api/v1/deals',
      suggestions: '/api/v1/suggestions/personalized'
    }
  });
});

module.exports = router;