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
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API not configured' });
    }
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }
    
    const query = q || 'points of interest';
    const searchRadius = Math.min(parseInt(radius || '5000'), 50000);
    
    console.log(`🔍 Explore API: ${query} (${req.apiUsage.remaining} requests remaining)`);
    
    // Call Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${searchRadius}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results) {
      console.log(`✅ Google Places: ${data.results.length} results`);
      
      res.json({
        status: 'OK',
        results: data.results,
        apiUsage: req.apiUsage
      });
    } else {
      console.log(`⚠️ Google Places: ${data.status}`);
      res.json({
        status: data.status,
        results: [],
        apiUsage: req.apiUsage
      });
    }
    
  } catch (error) {
    console.error('❌ Explore API error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
