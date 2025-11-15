import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Get place photo by reference
router.get('/photo', async (req, res) => {
  try {
    const { photo_reference, maxwidth = 400 } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!photo_reference || !apiKey) {
      return res.status(400).json({ error: 'Missing photo_reference or API key' });
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${photo_reference}&key=${apiKey}`;
    
    // Proxy the image to avoid CORS issues
    const response = await fetch(photoUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch photo from Google' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Stream the image
    response.body.pipe(res);
  } catch (error) {
    console.error('Photo fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Search place and get photos
router.get('/search-with-photos/:placeName', async (req, res) => {
  try {
    const { placeName } = req.params;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    // Search for place
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&key=${apiKey}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const place = data.results[0];
      const photoReference = place.photos?.[0]?.photo_reference;
      
      res.json({
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        photo_reference: photoReference,
        photo_url: photoReference ? `/api/places-photos/photo?photo_reference=${photoReference}&maxwidth=400` : null,
        rating: place.rating,
        types: place.types
      });
    } else {
      res.status(404).json({ error: 'Place not found' });
    }
  } catch (error) {
    console.error('Place search error:', error);
    res.status(500).json({ error: 'Failed to search place' });
  }
});

export default router;