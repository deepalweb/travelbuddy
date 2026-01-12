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
