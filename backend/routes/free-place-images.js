import express from 'express';
import { resolveFreePlaceImage } from '../services/freePlaceImageService.js';

const router = express.Router();

router.get('/resolve', async (req, res) => {
  try {
    const { name, category = '', city = '', country = '' } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await resolveFreePlaceImage({
      name: String(name),
      category: String(category),
      city: String(city),
      country: String(country),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('❌ Free place image resolve error:', error);
    res.status(500).json({
      error: 'Failed to resolve free place image',
      details: error.message,
    });
  }
});

export default router;
