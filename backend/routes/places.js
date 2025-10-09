import express from 'express';
import fetch from 'node-fetch';
import { EnhancedPlacesSearch } from '../enhanced-places-search.js';
import { PlacesOptimizer } from '../places-optimization.js';

const router = express.Router();

// Enhanced Places Search endpoint specifically for mobile
router.get('/mobile/nearby', async (req, res) => {
  try {
    const { lat, lng, q, radius = 25000, limit = 60 } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    console.log(`🔍 Mobile API Key Check: ${apiKey ? 'Present' : 'Missing'} (length: ${apiKey?.length || 0})`);
    
    if (!apiKey) {
      console.error('❌ GOOGLE_PLACES_API_KEY not configured');
      return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY not configured' });
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const query = (q || '').toString().trim() || 'points of interest';
    const searchRadius = parseInt(radius, 10);
    const maxResults = parseInt(limit, 10);

    console.log(`🔍 Mobile places search: ${query} within ${searchRadius}m, limit: ${maxResults}`);

    // Try simple nearby search first to test API
    const testUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${searchRadius}&type=establishment&key=${apiKey}`;
    console.log(`🧪 Testing API with: ${testUrl.replace(apiKey, 'API_KEY_HIDDEN')}`);
    
    const testResponse = await fetch(testUrl);
    const testData = await testResponse.json();
    
    console.log(`🧪 API Test Response: Status=${testData.status}, Results=${testData.results?.length || 0}`);
    
    if (testData.status !== 'OK') {
      console.error(`❌ Google Places API Error: ${testData.status} - ${testData.error_message}`);
      return res.status(502).json({ 
        error: 'Google Places API Error', 
        status: testData.status,
        message: testData.error_message
      });
    }

    const enhancedSearch = new EnhancedPlacesSearch(apiKey);
    
    // Use comprehensive search for better mobile results
    let results = await enhancedSearch.searchPlacesComprehensive(
      parseFloat(lat), 
      parseFloat(lng), 
      query, 
      searchRadius
    );
    
    console.log(`🔍 Enhanced search returned: ${results.length} raw results`);
    
    if (results.length === 0) {
      console.warn('⚠️ Enhanced search returned 0 results, using test results');
      results = testData.results || [];
    }
    
    // Apply mobile-optimized filtering
    results = PlacesOptimizer.filterQualityResults(results, { minRating: 3.0 });
    results = PlacesOptimizer.enrichPlaceTypes(results);
    results = PlacesOptimizer.rankResults(results, parseFloat(lat), parseFloat(lng), query);
    
    // Ensure variety in results for mobile
    const diverseResults = PlacesOptimizer.ensureVariety(results, maxResults);
    
    console.log(`✅ Mobile search returned ${diverseResults.length} diverse places`);
    
    res.json({
      status: 'OK',
      results: diverseResults.slice(0, maxResults),
      query: query,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: searchRadius
    });
    
  } catch (error) {
    console.error('❌ Mobile places search error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch places', 
      details: error.message 
    });
  }
});

// Batch places search for mobile sections
router.post('/mobile/batch', async (req, res) => {
  try {
    const { lat, lng, queries, radius = 20000 } = req.body;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    console.log(`🔍 Batch API Key Check: ${apiKey ? 'Present' : 'Missing'}`);
    
    if (!apiKey) {
      console.error('❌ GOOGLE_PLACES_API_KEY not configured for batch');
      return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY not configured' });
    }

    if (!lat || !lng || !Array.isArray(queries)) {
      return res.status(400).json({ error: 'lat, lng, and queries array are required' });
    }

    console.log(`🔍 Mobile batch search for ${queries.length} categories`);

    const enhancedSearch = new EnhancedPlacesSearch(apiKey);
    const results = {};
    
    // Process each query in parallel for faster results
    const searchPromises = queries.map(async (queryObj) => {
      const { category, query, limit = 15 } = queryObj;
      
      try {
        console.log(`🔍 Searching ${category}: ${query}`);
        
        let places = await enhancedSearch.searchPlacesComprehensive(
          parseFloat(lat), 
          parseFloat(lng), 
          query, 
          radius
        );
        
        console.log(`🔍 ${category} raw results: ${places.length}`);
        
        // Apply category-specific filtering
        places = PlacesOptimizer.filterQualityResults(places, { minRating: 3.5 });
        places = PlacesOptimizer.rankResults(places, parseFloat(lat), parseFloat(lng), query);
        
        results[category] = places.slice(0, limit);
        console.log(`✅ ${category}: ${results[category].length} places`);
        
      } catch (error) {
        console.error(`❌ Error fetching ${category}:`, error.message);
        results[category] = [];
      }
    });
    
    await Promise.all(searchPromises);
    
    const totalPlaces = Object.values(results).reduce((sum, places) => sum + places.length, 0);
    console.log(`✅ Mobile batch search completed: ${totalPlaces} total places`);
    
    res.json({
      status: 'OK',
      results: results,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: radius
    });
    
  } catch (error) {
    console.error('❌ Mobile batch search error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch batch places', 
      details: error.message 
    });
  }
});

export default router;