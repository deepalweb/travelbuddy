import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { EnhancedPlacesSearch } from '../enhanced-places-search.js';
import { PlacesOptimizer } from '../places-optimization.js';

// Initialize Azure OpenAI
const openai = process.env.AZURE_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
}) : null;

const router = express.Router();

// AI-powered places generation endpoint
router.post('/ai/generate', async (req, res) => {
  try {
    const { prompt, maxTokens = 4000, temperature = 0.7 } = req.body;
    
    if (!openai) {
      return res.status(500).json({ error: 'Azure OpenAI not configured' });
    }
    
    if (!prompt) {
      return res.status(400).json({ error: 'prompt required' });
    }
    
    console.log('🤖 Azure OpenAI generating content');
    
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: temperature,
      max_tokens: maxTokens
    });
    
    const content = completion.choices[0].message.content;
    
    res.json({
      content: content,
      response: content,
      text: content
    });
    
  } catch (error) {
    console.error('❌ Azure OpenAI error:', error);
    res.status(500).json({ 
      error: 'AI generation failed', 
      details: error.message 
    });
  }
});

// Hybrid AI + Google Places endpoint
router.get('/hybrid', async (req, res) => {
  try {
    const { lat, lng, query = 'restaurants', limit = 30 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }
    
    console.log(`🔄 Hybrid search: ${query} near ${lat}, ${lng}`);
    
    let results = [];
    
    // Try AI generation first (cost-effective)
    if (openai) {
      try {
        const prompt = `Find 15 real ${query} near ${lat}, ${lng}. Return JSON array: [{"place_id":"id","name":"name","formatted_address":"address","geometry":{"location":{"lat":${lat},"lng":${lng}}},"rating":4.0,"types":["${query}"],"description":"description"}]`;
        
        const completion = await openai.chat.completions.create({
          model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
        });
        
        const aiPlaces = JSON.parse(completion.choices[0].message.content);
        results = aiPlaces.map(place => ({ ...place, source: 'ai' }));
        console.log(`🤖 AI provided ${results.length} places`);
      } catch (aiError) {
        console.warn('⚠️ AI generation failed, using Google Places only');
      }
    }
    
    // Fill gaps with Google Places if needed
    if (results.length < limit && process.env.GOOGLE_PLACES_API_KEY) {
      try {
        const enhancedSearch = new EnhancedPlacesSearch(process.env.GOOGLE_PLACES_API_KEY);
        const googlePlaces = await enhancedSearch.searchPlacesComprehensive(
          parseFloat(lat), parseFloat(lng), query, 20000
        );
        
        const needed = limit - results.length;
        const additionalPlaces = googlePlaces.slice(0, needed).map(place => ({ ...place, source: 'google' }));
        results = [...results, ...additionalPlaces];
        
        console.log(`🔍 Added ${additionalPlaces.length} Google Places`);
      } catch (googleError) {
        console.warn('⚠️ Google Places failed:', googleError.message);
      }
    }
    
    console.log(`✅ Hybrid search returned ${results.length} total places`);
    
    res.json({
      status: 'OK',
      results: results,
      query: query,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });
    
  } catch (error) {
    console.error('❌ Hybrid search error:', error);
    res.status(500).json({ error: 'Hybrid search failed', details: error.message });
  }
});

// Enhanced Places Search endpoint specifically for mobile
router.get('/mobile/nearby', async (req, res) => {
  try {
    const { lat, lng, q, radius = 25000, limit = 60, offset = 0 } = req.query;
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
    const skipResults = parseInt(offset, 10);

    console.log(`🔍 Mobile places search: ${query} within ${searchRadius}m, limit: ${maxResults}`);

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
      console.warn('⚠️ Enhanced search returned 0 results');
      return res.json({
        status: 'OK',
        results: [],
        query: query,
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: searchRadius
      });
    }
    
    // Filter out results too far from search location (strict 2x radius check)
    const searchLat = parseFloat(lat);
    const searchLng = parseFloat(lng);
    const maxDistanceKm = (searchRadius / 1000) * 2; // 2x radius as max
    
    results = results.filter(place => {
      const placeLat = place.geometry?.location?.lat;
      const placeLng = place.geometry?.location?.lng;
      if (!placeLat || !placeLng) return false;
      
      // Haversine distance calculation
      const R = 6371; // Earth radius in km
      const dLat = (placeLat - searchLat) * Math.PI / 180;
      const dLng = (placeLng - searchLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(searchLat * Math.PI / 180) * Math.cos(placeLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      if (distance > maxDistanceKm) {
        console.log(`🚫 Rejected ${place.name}: ${distance.toFixed(1)}km away (max: ${maxDistanceKm}km)`);
        return false;
      }
      return true;
    });
    
    console.log(`✅ Location filtered: ${results.length} places within ${maxDistanceKm}km`);
    
    // Apply mobile-optimized filtering (quality)
    results = PlacesOptimizer.filterQualityResults(results, { minRating: 3.0 });
    results = PlacesOptimizer.enrichPlaceTypes(results);
    results = PlacesOptimizer.rankResults(results, searchLat, searchLng, query);
    
    // Ensure variety in results for mobile
    const diverseResults = PlacesOptimizer.ensureVariety(results, maxResults + skipResults);
    
    // Apply offset for pagination
    const paginatedResults = diverseResults.slice(skipResults, skipResults + maxResults);
    
    console.log(`✅ Mobile search returned ${paginatedResults.length} diverse places (offset: ${skipResults})`);
    
    res.json({
      status: 'OK',
      results: paginatedResults,
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

// Get place photo by reference
router.get('/photo', async (req, res) => {
  try {
    const { ref, w = 400 } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }
    
    if (!ref) {
      return res.status(400).json({ error: 'Photo reference required' });
    }
    
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${ref}&maxwidth=${w}&key=${apiKey}`;
    
    // Redirect to Google's photo URL
    res.redirect(photoUrl);
    
  } catch (error) {
    console.error('❌ Photo fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// Get place images from Wikipedia and other sources
router.get('/images', async (req, res) => {
  try {
    const { place } = req.query;
    
    if (!place) {
      return res.status(400).json({ error: 'place name required' });
    }
    
    const images = [];
    
    // Try Wikipedia API for place images
    try {
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(place)}`;
      const wikiResponse = await fetch(wikiUrl);
      const wikiData = await wikiResponse.json();
      
      if (wikiData.thumbnail) {
        images.push({
          url: wikiData.thumbnail.source.replace(/\/\d+px-/, '/800px-'),
          source: 'wikipedia',
          description: wikiData.description || place
        });
      }
      
      // Get additional images from Wikipedia page
      if (wikiData.pageid) {
        const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=images&pageids=${wikiData.pageid}&imlimit=3`;
        const imagesResponse = await fetch(imagesUrl);
        const imagesData = await imagesResponse.json();
        
        if (imagesData.query?.pages?.[wikiData.pageid]?.images) {
          const pageImages = imagesData.query.pages[wikiData.pageid].images
            .filter(img => img.title.match(/\.(jpg|jpeg|png|webp)$/i))
            .slice(0, 2);
            
          for (const img of pageImages) {
            const imgUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(img.title.replace('File:', ''))}?width=800`;
            images.push({
              url: imgUrl,
              source: 'wikimedia',
              description: img.title.replace('File:', '').replace(/\.[^.]+$/, '')
            });
          }
        }
      }
    } catch (wikiError) {
      console.warn('Wikipedia image search failed:', wikiError.message);
    }
    
    // Add fallback images
    const placeHash = place.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    const fallbackImages = [
      {
        url: `https://source.unsplash.com/800x600/?${encodeURIComponent(place)},landmark`,
        source: 'unsplash',
        description: `${place} landmark`
      },
      {
        url: `https://picsum.photos/seed/${Math.abs(placeHash)}/800/600`,
        source: 'picsum',
        description: `${place} view`
      }
    ];
    
    images.push(...fallbackImages);
    
    res.json({
      status: 'OK',
      place: place,
      images: images.slice(0, 6)
    });
    
  } catch (error) {
    console.error('❌ Image search error:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Get place details by place_id
router.get('/details', async (req, res) => {
  try {
    const { place_id } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }
    
    if (!place_id) {
      return res.status(400).json({ error: 'place_id required' });
    }
    
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,rating,formatted_phone_number,formatted_address,opening_hours,website,photos,user_ratings_total&key=${apiKey}`;
    
    const response = await fetch(detailsUrl);
    const data = await response.json();
    
    if (data.status === 'OK') {
      res.json(data.result);
    } else {
      res.status(400).json({ error: data.status, message: data.error_message });
    }
    
  } catch (error) {
    console.error('❌ Place details error:', error);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

export default router;