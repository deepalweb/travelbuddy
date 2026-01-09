const express = require('express');
const router = express.Router();

// GET /api/config/keys - Return API keys for mobile app
router.get('/keys', (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    azureMapsApiKey: process.env.AZURE_MAPS_API_KEY || ''
  });
});

module.exports = router;
