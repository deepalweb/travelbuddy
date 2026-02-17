import express from 'express';
import { AzureMapsSearch } from '../services/azureMapsSearch.js';
import { BlobServiceClient } from '@azure/storage-blob';

const router = express.Router();

// Initialize Azure Maps
const azureMaps = new AzureMapsSearch(process.env.AZURE_MAPS_KEY);

// Initialize Azure Blob for cache clearing
let containerClient;
if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  containerClient = blobServiceClient.getContainerClient('places-cache');
}

// Mobile places discovery endpoint
router.post('/discover', async (req, res) => {
  try {
    const { latitude, longitude, userPreferences = {} } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    console.log(`📍 Mobile places discovery for: ${latitude}, ${longitude}`);

    // Search real places using Azure Maps
    const queries = ['restaurant', 'attraction', 'shopping', 'entertainment', 'park', 'museum'];
    const allPlaces = [];
    
    for (const query of queries) {
      const places = await azureMaps.searchPlacesComprehensive(latitude, longitude, query, 5000);
      allPlaces.push(...places.slice(0, 10));
    }
    
    // Categorize places
    const categorizedPlaces = categorizePlaces(allPlaces);
    
    console.log(`✅ Found ${allPlaces.length} real places in ${Object.keys(categorizedPlaces).length} categories`);
    
    res.json({
      status: 'success',
      totalPlaces: allPlaces.length,
      categories: categorizedPlaces,
      allPlaces: allPlaces
    });

  } catch (error) {
    console.error('❌ Mobile places discovery error:', error);
    res.status(500).json({ 
      error: 'Failed to discover places', 
      details: error.message 
    });
  }
});

// Clear ALL caches endpoint
router.delete('/clear-cache', async (req, res) => {
  try {
    let cleared = { mongodb: 0, azureBlob: 0 };
    
    // 1. Clear MongoDB cache
    try {
      const PlacesCache = (await import('../models/PlacesCache.js')).default;
      const result = await PlacesCache.deleteMany({});
      cleared.mongodb = result.deletedCount;
      console.log(`🗑️ Cleared ${cleared.mongodb} MongoDB entries`);
    } catch (e) {
      console.log('⚠️ MongoDB clear skipped:', e.message);
    }
    
    // 2. Clear Azure Blob cache
    if (containerClient) {
      let blobCount = 0;
      for await (const blob of containerClient.listBlobsFlat()) {
        await containerClient.deleteBlob(blob.name);
        blobCount++;
      }
      cleared.azureBlob = blobCount;
      console.log(`🗑️ Cleared ${cleared.azureBlob} Azure Blob entries`);
    }
    
    res.json({ success: true, cleared });
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Categorize places for mobile sections
function categorizePlaces(places) {
  const categories = {
    restaurants: [],
    attractions: [],
    shopping: [],
    entertainment: [],
    nature: [],
    culture: []
  };

  places.forEach(place => {
    const category = place.category || 'attractions';
    if (categories[category]) {
      categories[category].push(place);
    } else {
      categories.attractions.push(place);
    }
  });

  return categories;
}

export default router;