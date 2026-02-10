const express = require('express');
const router = express.Router();
const axios = require('axios');

// Azure Maps Route Directions API endpoint
router.post('/directions', async (req, res) => {
  try {
    const { origin, destination, mode, waypoints } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    // Parse coordinates from origin and destination
    const originCoords = origin.split(',').map(c => c.trim());
    const destCoords = destination.split(',').map(c => c.trim());

    // Map Google modes to Azure Maps travel modes
    const travelModeMap = {
      'driving': 'car',
      'walking': 'pedestrian',
      'bicycling': 'bicycle',
      'transit': 'car' // Azure doesn't have transit, fallback to car
    };
    const travelMode = travelModeMap[mode] || 'car';

    // Build route query
    let query = `${originCoords[0]},${originCoords[1]}:${destCoords[0]},${destCoords[1]}`;
    
    // Add waypoints if provided
    if (waypoints) {
      const waypointCoords = waypoints.split('|').filter(w => !w.startsWith('optimize'));
      waypointCoords.forEach(wp => {
        const coords = wp.split(',').map(c => c.trim());
        query = `${originCoords[0]},${originCoords[1]}:${coords[0]},${coords[1]}:${destCoords[0]},${destCoords[1]}`;
      });
    }

    const url = `https://atlas.microsoft.com/route/directions/json?subscription-key=${process.env.AZURE_MAPS_API_KEY}&api-version=1.0&query=${query}&travelMode=${travelMode}`;

    const response = await axios.get(url);
    
    // Transform Azure Maps response to Google-like format
    const azureRoute = response.data.routes?.[0];
    if (!azureRoute) {
      return res.status(404).json({ error: 'No route found' });
    }

    const googleLikeResponse = {
      routes: [{
        legs: azureRoute.legs.map(leg => ({
          distance: { text: `${(leg.summary.lengthInMeters / 1000).toFixed(1)} km`, value: leg.summary.lengthInMeters },
          duration: { text: `${Math.round(leg.summary.travelTimeInSeconds / 60)} mins`, value: leg.summary.travelTimeInSeconds },
          start_location: { lat: leg.points[0].latitude, lng: leg.points[0].longitude },
          end_location: { lat: leg.points[leg.points.length - 1].latitude, lng: leg.points[leg.points.length - 1].longitude },
          steps: leg.points.map((point, idx) => ({
            distance: { text: '0 m', value: 0 },
            duration: { text: '0 mins', value: 0 },
            start_location: { lat: point.latitude, lng: point.longitude },
            end_location: { lat: point.latitude, lng: point.longitude },
            html_instructions: idx === 0 ? 'Head to destination' : 'Continue',
            travel_mode: mode?.toUpperCase() || 'DRIVING'
          }))
        })),
        overview_polyline: { points: azureRoute.legs[0].points.map(p => `${p.latitude},${p.longitude}`).join(';') },
        summary: `Via ${travelMode}`,
        warnings: [],
        waypoint_order: []
      }],
      status: 'OK'
    };

    res.json(googleLikeResponse);
  } catch (error) {
    console.error('Directions API error:', error.message);
    res.status(500).json({ error: 'Failed to get directions' });
  }
});

module.exports = router;
