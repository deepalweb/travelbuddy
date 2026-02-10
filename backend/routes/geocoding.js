const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Geocoding endpoint to get coordinates for destinations
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address parameter is required' });
    }

    // Use Azure Maps Geocoding API
    const azureMapsKey = process.env.AZURE_MAPS_API_KEY;
    if (!azureMapsKey) {
      return res.status(500).json({ error: 'Azure Maps API key not configured' });
    }

    const geocodeUrl = `https://atlas.microsoft.com/search/address/json?subscription-key=${azureMapsKey}&api-version=1.0&query=${encodeURIComponent(address)}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const position = result.position;
      res.json({
        location: {
          lat: position.lat,
          lng: position.lon
        },
        formatted_address: result.address.freeformAddress
      });
    } else {
      res.status(404).json({ error: 'Location not found' });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Geocoding service failed' });
  }
});

module.exports = router;