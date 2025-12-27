import express from 'express';
import { AIPlacesGenerator } from '../services/ai-places-generator.js';

const router = express.Router();

// AI-only place generation endpoint
router.get('/ai-places/nearby', async (req, res) => {
  try {
    const { lat, lng, category = 'tourist attractions', limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    console.log(`🤖 AI-only places request: ${category} near ${lat}, ${lng}`);

    const places = await AIPlacesGenerator.generatePlaces(
      parseFloat(lat),
      parseFloat(lng),
      category,
      parseInt(limit, 10)
    );

    res.json({
      status: 'OK',
      source: 'ai-generated',
      results: places,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      category: category
    });

  } catch (error) {
    console.error('❌ AI places generation error:', error);
    res.status(500).json({
      error: 'Failed to generate places',
      details: error.message
    });
  }
});

export default router;
