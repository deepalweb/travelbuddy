import express from 'express';
import { AzureMapsSearch } from '../services/azureMapsSearch.js';

const router = express.Router();

const popularPlaces = [
  'restaurants', 'hotels', 'temples', 'beaches', 'museums', 'parks',
  'cafes', 'bars', 'shopping malls', 'tourist attractions'
];

const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

router.get('/suggestions', async (req, res) => {
  try {
    const { q, lat, lng } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: popularPlaces.slice(0, 5) });
    }

    const query = q.toLowerCase().trim();
    const cacheKey = `${query}_${lat}_${lng}`;
    
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ suggestions: cached.data });
    }

    const suggestions = [];
    
    // Local fuzzy matching
    const localMatches = popularPlaces.filter(place => 
      place.toLowerCase().includes(query) || 
      query.split(' ').some(word => place.toLowerCase().includes(word))
    ).slice(0, 3);
    suggestions.push(...localMatches);

    // Azure Maps autocomplete if location provided
    if (lat && lng && process.env.AZURE_MAPS_API_KEY) {
      try {
        const azureMaps = new AzureMapsSearch(process.env.AZURE_MAPS_API_KEY);
        const results = await azureMaps.searchPlacesComprehensive(
          parseFloat(lat), 
          parseFloat(lng), 
          query, 
          10000
        );
        
        const placeNames = results
          .slice(0, 5)
          .map(r => r.name)
          .filter(name => !suggestions.includes(name));
        suggestions.push(...placeNames);
      } catch (error) {
        console.error('Azure autocomplete error:', error);
      }
    }

    // Add query variations
    if (suggestions.length < 5) {
      const variations = [
        `${query} near me`,
        `best ${query}`,
        `${query} restaurants`,
        `${query} attractions`
      ].filter(v => !suggestions.includes(v));
      suggestions.push(...variations);
    }

    const finalSuggestions = [...new Set(suggestions)].slice(0, 8);
    
    cache.set(cacheKey, { data: finalSuggestions, timestamp: Date.now() });
    
    res.json({ suggestions: finalSuggestions });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.json({ suggestions: popularPlaces.slice(0, 5) });
  }
});

export default router;
