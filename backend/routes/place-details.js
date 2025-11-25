import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Get place details by place_id
router.get('/details', async (req, res) => {
  try {
    const { place_id } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!place_id) {
      return res.status(400).json({ error: 'place_id is required' });
    }
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,rating,formatted_phone_number,opening_hours,photos,user_ratings_total,formatted_address,geometry&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      res.json(data.result);
    } else {
      res.status(404).json({ error: 'Place not found', status: data.status });
    }
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get place photo by reference
router.get('/photo', async (req, res) => {
  try {
    const { ref, w = 800 } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!ref) {
      return res.status(400).json({ error: 'ref (photo_reference) is required' });
    }
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${w}&photo_reference=${ref}&key=${apiKey}`;
    
    const response = await fetch(photoUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch photo' });
    }
    
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    response.body.pipe(res);
  } catch (error) {
    console.error('Photo fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;