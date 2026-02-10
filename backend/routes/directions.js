import express from 'express';
const router = express.Router();
import axios from 'axios';

// Google Directions API endpoint
router.post('/directions', async (req, res) => {
  try {
    const { origin, destination, mode, waypoints } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const params = {
      origin,
      destination,
      mode: mode || 'walking',
      key: process.env.GOOGLE_MAPS_API_KEY,
    };

    if (waypoints) {
      params.waypoints = `optimize:true|${waypoints}`;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', { params });

    res.json(response.data);
  } catch (error) {
    console.error('Directions API error:', error.message);
    res.status(500).json({ error: 'Failed to get directions' });
  }
});

export default router;
