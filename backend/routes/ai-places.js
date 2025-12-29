import express from 'express';
import { AIPlacesGenerator } from '../services/ai-places-generator.js';

const router = express.Router();

// Experience-based image mapping
function getExperienceImage(type, placeName) {
  const name = placeName.toLowerCase();
  const category = type.toLowerCase();
  
  // Map to Unsplash experience images
  const imageMap = {
    restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
    bar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
    museum: 'https://images.unsplash.com/photo-1565173953406-d2a7e6a27e3f?w=400&h=300&fit=crop',
    park: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    temple: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=300&fit=crop',
    beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
    shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
    attraction: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop'
  };
  
  // Match by keywords
  if (name.includes('food') || name.includes('restaurant')) return imageMap.restaurant;
  if (name.includes('cafe') || name.includes('coffee')) return imageMap.cafe;
  if (name.includes('bar') || name.includes('pub')) return imageMap.bar;
  if (name.includes('museum') || name.includes('gallery')) return imageMap.museum;
  if (name.includes('park') || name.includes('garden')) return imageMap.park;
  if (name.includes('temple') || name.includes('church')) return imageMap.temple;
  if (name.includes('beach') || name.includes('coast')) return imageMap.beach;
  if (name.includes('shop') || name.includes('market')) return imageMap.shopping;
  if (name.includes('hotel') || name.includes('resort')) return imageMap.hotel;
  
  // Fallback by category
  return imageMap[category] || imageMap.attraction;
}

// AI-only place generation endpoint
router.get('/ai-places/nearby', async (req, res) => {
  try {
    const { lat, lng, category = 'tourist attractions', limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    console.log(`🤖 AI-only places request: ${category} near ${lat}, ${lng}`);

    let places = [];
    try {
      places = await AIPlacesGenerator.generatePlaces(
        parseFloat(lat),
        parseFloat(lng),
        category,
        parseInt(limit, 10)
      );
      console.log(`✅ AI generator returned ${places.length} places`);
    } catch (aiError) {
      console.error('⚠️ AI generation failed, using fallback:', aiError.message);
      // Return empty array instead of error - mobile app will handle it
      places = [];
    }

    // Add experience-based images
    places.forEach(place => {
      place.photoUrl = getExperienceImage(place.type || category, place.name);
    });
    
    console.log(`📤 Returning ${places.length} places to mobile app`);

    res.json({
      status: 'OK',
      source: 'ai-generated',
      results: places,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      category: category
    });

  } catch (error) {
    console.error('❌ AI places route error:', error);
    res.status(500).json({
      error: 'Failed to generate places',
      details: error.message
    });
  }
});

export default router;
