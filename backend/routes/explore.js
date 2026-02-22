import express from 'express';
import { checkExploreLimit, getUsageStats } from '../middleware/apiUsageLimit.js';
import fetch from 'node-fetch';

const router = express.Router();

// Get user's API usage stats
router.get('/usage', getUsageStats);

// Explore places with rate limiting (5 requests per user per day)
router.get('/places', checkExploreLimit, async (req, res) => {
  try {
    const { lat, lng, q, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }
    
    const query = q || 'points of interest';
    const searchRadius = Math.min(parseInt(radius || '5000'), 50000);
    
    console.log(`🔍 Explore API: ${query} (${req.apiUsage.remaining} requests remaining)`);
    
    // Generate mock places for mobile app
    const locations = {
      'colombo': { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
      'kandy': { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
      'galle': { name: 'Galle', lat: 6.0535, lng: 80.2210 }
    };
    
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    let locationName = 'Sri Lanka';
    
    // Find closest known location
    let minDist = Infinity;
    for (const [key, loc] of Object.entries(locations)) {
      const dist = Math.sqrt(Math.pow(userLat - loc.lat, 2) + Math.pow(userLng - loc.lng, 2));
      if (dist < minDist) {
        minDist = dist;
        locationName = loc.name;
      }
    }
    
    // Determine category from query
    const categoryMap = {
      'restaurant': ['restaurant', 'food', 'dining'],
      'tourist_attraction': ['tourist', 'attraction', 'landmark'],
      'museum': ['museum', 'gallery', 'cultural'],
      'park': ['park', 'garden', 'nature'],
      'cafe': ['cafe', 'coffee']
    };
    
    let category = 'tourist_attraction';
    for (const [cat, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => query.toLowerCase().includes(kw))) {
        category = cat;
        break;
      }
    }
    
    // Generate 10-15 places
    const count = 10 + Math.floor(Math.random() * 6);
    const results = Array.from({ length: count }, (_, i) => {
      const names = {
        restaurant: ['The Spice Garden', 'Ocean View', 'Heritage Kitchen', 'Royal Dining', 'Sunset Grill'],
        tourist_attraction: ['National Museum', 'Historic Fort', 'Cultural Center', 'Ancient Temple', 'Royal Palace'],
        museum: ['National Museum', 'Art Gallery', 'History Museum', 'Cultural Museum', 'Heritage Center'],
        park: ['Botanical Gardens', 'City Park', 'Nature Reserve', 'Green Space', 'Scenic Gardens'],
        cafe: ['Coffee House', 'Garden Cafe', 'Artisan Coffee', 'Cozy Corner', 'Bean & Brew']
      };
      
      const categoryNames = names[category] || names.tourist_attraction;
      const name = categoryNames[i % categoryNames.length] + (i >= categoryNames.length ? ` ${Math.floor(i / categoryNames.length) + 1}` : '');
      
      return {
        place_id: `place_${Date.now()}_${i}`,
        name: name,
        vicinity: `${locationName}, Sri Lanka`,
        geometry: {
          location: {
            lat: userLat + (Math.random() - 0.5) * 0.02,
            lng: userLng + (Math.random() - 0.5) * 0.02
          }
        },
        rating: 3.5 + Math.random() * 1.5,
        user_ratings_total: Math.floor(Math.random() * 500) + 50,
        types: [category, 'point_of_interest'],
        business_status: 'OPERATIONAL',
        photos: [{
          photo_reference: `https://source.unsplash.com/400x300/?${category},${locationName}`,
          height: 300,
          width: 400
        }]
      };
    });
    
    console.log(`✅ Generated ${results.length} mock places`);
    
    res.json({
      status: 'OK',
      results: results,
      apiUsage: req.apiUsage
    });
    
  } catch (error) {
    console.error('❌ Explore API error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
