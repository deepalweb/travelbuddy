import express from 'express';
import { BlobServiceClient } from '@azure/storage-blob';

const router = express.Router();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'places-cache';

let containerClient;

if (connectionString) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);
  containerClient.createIfNotExists()
    .then(() => console.log('✅ Places cache container ready'))
    .catch(err => console.error('❌ Places cache container error:', err.message));
}

// Save places cache
router.post('/places', async (req, res) => {
  try {
    if (!containerClient) {
      return res.status(503).json({ error: 'Azure Storage not configured' });
    }

    const { cacheKey, places, timestamp } = req.body;
    const blobName = `${cacheKey}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const data = JSON.stringify({ timestamp, places });
    await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders: { blobContentType: 'application/json' }
    });

    console.log(`✅ Cached ${places.length} places: ${cacheKey}`);
    res.json({ success: true, cached: places.length });
  } catch (error) {
    console.error('❌ Cache save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Load places cache
router.get('/places/:cacheKey', async (req, res) => {
  try {
    if (!containerClient) {
      return res.status(503).json({ error: 'Azure Storage not configured' });
    }

    const blobName = `${req.params.cacheKey}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download();
    const data = await streamToString(downloadResponse.readableStreamBody);
    const parsed = JSON.parse(data);

    console.log(`✅ Loaded ${parsed.places.length} places from cache`);
    res.json(parsed);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: 'Cache not found' });
    }
    console.error('❌ Cache load error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear ALL caches (MongoDB + Azure Blob)
router.delete('/places/all', async (req, res) => {
  try {
    let cleared = { mongodb: 0, azureBlob: 0 };
    
    // 1. Clear MongoDB cache
    try {
      const PlacesCache = (await import('../models/PlacesCache.js')).default;
      const result = await PlacesCache.deleteMany({});
      cleared.mongodb = result.deletedCount;
      console.log(`🗑️ Cleared ${cleared.mongodb} MongoDB cache entries`);
    } catch (e) {
      console.log('⚠️ MongoDB cache clear skipped:', e.message);
    }
    
    // 2. Clear Azure Blob cache
    if (containerClient) {
      let blobCount = 0;
      for await (const blob of containerClient.listBlobsFlat()) {
        await containerClient.deleteBlob(blob.name);
        blobCount++;
      }
      cleared.azureBlob = blobCount;
      console.log(`🗑️ Cleared ${cleared.azureBlob} Azure Blob cache entries`);
    }
    
    res.json({ success: true, cleared });
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => chunks.push(data.toString()));
    readableStream.on('end', () => resolve(chunks.join('')));
    readableStream.on('error', reject);
  });
}

export default router;
