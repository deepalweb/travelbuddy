// Generic get-or-fetch cache helper over the shared PlacesCache Mongo collection (24h TTL).
import PlacesCache from '../../models/PlacesCache.js';
import costTracker from '../costTracker.js';
import mongoose from 'mongoose';

export async function getOrFetch(key, fetcher) {
  // Mongoose buffers model operations while disconnected. That default is useful
  // during startup, but it turns an optional cache miss into a 10-second delay for
  // every Google Places query when MongoDB is unavailable. The trip planner must
  // remain usable without its cache, so bypass Mongo until the connection is ready.
  if (mongoose.connection.readyState !== 1) {
    return fetcher();
  }

  try {
    const cached = await PlacesCache.findOne({ key });
    if (cached) {
      costTracker.trackCacheHit();
      PlacesCache.updateOne({ key }, { $inc: { hits: 1 } }).catch(() => {});
      return cached.data;
    }
  } catch (cacheError) {
    console.warn(`⚠️ PlacesCache lookup failed for ${key}:`, cacheError.message);
  }

  const data = await fetcher();

  try {
    await PlacesCache.findOneAndUpdate(
      { key },
      { key, data, hits: 1, createdAt: new Date() },
      { upsert: true }
    );
  } catch (cacheError) {
    console.warn(`⚠️ PlacesCache write failed for ${key}:`, cacheError.message);
  }

  return data;
}
