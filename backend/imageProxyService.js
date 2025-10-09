import sharp from 'sharp';
import fetch from 'node-fetch';
import crypto from 'crypto';

class ImageProxyService {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100;
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Generate secure image URL without exposing API keys
  generateSecureUrl(photoReference, width = 400, height = 400) {
    const timestamp = Date.now();
    const signature = crypto
      .createHmac('sha256', process.env.IMAGE_PROXY_SECRET || 'default-secret')
      .update(`${photoReference}:${width}:${height}:${timestamp}`)
      .digest('hex');
    
    return `/api/images/proxy?ref=${photoReference}&w=${width}&h=${height}&t=${timestamp}&s=${signature}`;
  }

  // Validate secure URL signature
  validateSignature(photoReference, width, height, timestamp, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.IMAGE_PROXY_SECRET || 'default-secret')
      .update(`${photoReference}:${width}:${height}:${timestamp}`)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  // Proxy and resize images
  async proxyImage(photoReference, width = 400, height = 400) {
    const cacheKey = `${photoReference}:${width}:${height}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.buffer;
      }
      this.cache.delete(cacheKey);
    }

    try {
      // Fetch from Google Places API (server-side only)
      const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${width}&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(googleUrl);
      if (!response.ok) throw new Error('Failed to fetch image');

      const buffer = await response.buffer();
      
      // Resize and optimize image
      const processedBuffer = await sharp(buffer)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Cache the processed image
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      this.cache.set(cacheKey, {
        buffer: processedBuffer,
        timestamp: Date.now()
      });

      return processedBuffer;
    } catch (error) {
      throw new Error(`Image proxy error: ${error.message}`);
    }
  }
}

export default new ImageProxyService();