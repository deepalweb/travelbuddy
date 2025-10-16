// API Rate Limiter and Caching Service
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[];
}

class APILimiter {
  private cache = new Map<string, CacheEntry<any>>();
  private requestCounts = new Map<string, RateLimitEntry>();
  private requestQueue = new Map<string, Array<() => Promise<any>>>();
  private isProcessingQueue = new Map<string, boolean>();
  
  // Enhanced rate limits per API with sliding window
  private limits = {
    gemini: { maxRequests: 10, windowMs: 60000 }, // Reduced to 10 requests per minute for better stability
  places: { maxRequests: 30, windowMs: 60000 } // 30 requests per minute
  };

  // Enhanced cache durations (in milliseconds)
  private cacheDurations = {
    places: 30 * 60 * 1000, // 30 minutes (increased)
  gemini: 20 * 60 * 1000 // 20 minutes (increased)
  };

  // Circuit breaker configuration
  private circuitBreakers = new Map<string, { failures: number; lastFailure: number; state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' }>();

  private getCacheKey(api: string, params: any): string {
    return `${api}:${JSON.stringify(params)}`;
  }

  private isRateLimited(api: keyof typeof this.limits): boolean {
    const limit = this.limits[api];
    const now = Date.now();
    const key = api;
    
    let current = this.requestCounts.get(key);
    
    if (!current) {
      current = { count: 0, resetTime: now + limit.windowMs, requests: [] };
      this.requestCounts.set(key, current);
    }
    
    // Clean old requests outside the window
    current.requests = current.requests.filter(time => now - time < limit.windowMs);
    
    // Check if we're at the limit (don't add current request yet)
    return current.requests.length >= limit.maxRequests;
  }

  private recordRequest(api: keyof typeof this.limits): void {
    const limit = this.limits[api];
    const now = Date.now();
    const key = api;
    
    let current = this.requestCounts.get(key);
    
    if (!current) {
      current = { count: 0, resetTime: now + limit.windowMs, requests: [] };
      this.requestCounts.set(key, current);
    }
    
    // Clean old requests outside the window
    current.requests = current.requests.filter(time => now - time < limit.windowMs);
    
    // Add current request
    current.requests.push(now);
    current.count = current.requests.length;
  }

  private getFromCache<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.expiresIn) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }

  private setCache<T>(cacheKey: string, data: T, expiresIn: number): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  private async processQueue(api: keyof typeof this.limits): Promise<void> {
    if (this.isProcessingQueue.get(api)) return;
    
    this.isProcessingQueue.set(api, true);
    const startTime = Date.now();
    const maxProcessingTime = 5 * 60 * 1000; // 5 minutes max
    
    while (true) {
      const queue = this.requestQueue.get(api) || [];
      if (queue.length === 0) break;
      
      // Check if we've been processing too long
      if (Date.now() - startTime > maxProcessingTime) {
        console.warn(`[APILimiter] Queue processing timeout for ${api}. Stopping processing.`);
        break;
      }
      
      // Check if we can make a request now
      if (this.isRateLimited(api)) {
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      const requestFn = queue.shift();
      if (requestFn) {
        try {
          // Record the request before making it
          this.recordRequest(api);
          await requestFn();
        } catch (error) {
          console.error(`[APILimiter] Queue processing error for ${api}:`, error);
        }
      }
      
      // Add delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.isProcessingQueue.set(api, false);
  }

  private async queueRequest<T>(api: keyof typeof this.limits, requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      if (!this.requestQueue.has(api)) {
        this.requestQueue.set(api, []);
      }
      
      this.requestQueue.get(api)!.push(queuedRequest);
      this.processQueue(api);
    });
  }

  async limitedRequest<T>(
    api: keyof typeof this.limits,
    params: any,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = this.getCacheKey(api, params);
    
    // Check cache first
    const cached = this.getFromCache<T>(cacheKey);
    if (cached) {
      console.log(`[APILimiter] Cache hit for ${api}`);
      return cached;
    }
    
    // Check circuit breaker
    const circuitBreaker = this.circuitBreakers.get(api) || { failures: 0, lastFailure: 0, state: 'CLOSED' as const };
    const now = Date.now();
    
    if (circuitBreaker.state === 'OPEN' && now - circuitBreaker.lastFailure < 60000) {
      throw new Error(`Service ${api} is temporarily unavailable. Please try again in a minute.`);
    }
    
    // Check rate limit
    if (this.isRateLimited(api)) {
      const queueLength = this.getQueueLength(api);
      console.warn(`[APILimiter] Rate limit exceeded for ${api}. Queuing request. (Queue length: ${queueLength})`);
      return this.queueRequest(api, requestFn);
    }
    
    // Record the request before making it
    this.recordRequest(api);
    
    // Make request
    console.log(`[APILimiter] Making API call to ${api} (${this.getRemainingRequests(api)} requests remaining)`);
    try {
      const result = await requestFn();
      
      // Reset circuit breaker on success
      this.circuitBreakers.set(api, { failures: 0, lastFailure: 0, state: 'CLOSED' });
      
      // Cache result
      const cacheDuration = this.cacheDurations[api] || 5 * 60 * 1000;
      this.setCache(cacheKey, result, cacheDuration);
      
      return result;
    } catch (error: any) {
      // Check if it's a daily quota exceeded error
      const errorMessage = error?.message || error?.toString() || '';
      const isDailyQuotaExceeded = errorMessage.toLowerCase().includes("exceeded your current quota") || 
                                   errorMessage.toLowerCase().includes("quota_value") ||
                                   errorMessage.toLowerCase().includes("free_tier");
      
      if (isDailyQuotaExceeded) {
        // For daily quota exceeded, don't update circuit breaker or retry
        console.error(`[APILimiter] Daily quota exceeded for ${api}. This is a hard limit that resets daily.`);
        
        // Store the daily quota exceeded status in localStorage
        localStorage.setItem('dailyQuotaExceeded', 'true');
        localStorage.setItem('dailyQuotaExceededTime', Date.now().toString());
        
        throw new Error("Daily API quota exceeded. The free tier allows 250 requests per day. Please try again tomorrow or upgrade your plan.");
      }
      
      // Update circuit breaker on failure (only for non-quota errors)
      circuitBreaker.failures++;
      circuitBreaker.lastFailure = now;
      
      if (circuitBreaker.failures >= 5) {
        circuitBreaker.state = 'OPEN';
      }
      
      this.circuitBreakers.set(api, circuitBreaker);
      throw error;
    }
  }

  getRemainingRequests(api: keyof typeof this.limits): number {
    const limit = this.limits[api];
    const current = this.requestCounts.get(api);
    
    if (!current) {
      return limit.maxRequests;
    }
    
    const now = Date.now();
    const validRequests = current.requests.filter(time => now - time < limit.windowMs);
    
    return Math.max(0, limit.maxRequests - validRequests.length);
  }

  getQueueLength(api: keyof typeof this.limits): number {
    return this.requestQueue.get(api)?.length || 0;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('[APILimiter] Cache cleared');
  }

  clearRateLimits(): void {
    this.requestCounts.clear();
    this.circuitBreakers.clear();
    console.log('[APILimiter] Rate limits cleared');
  }

  checkDailyQuotaReset(): void {
    const quotaExceededTime = localStorage.getItem('dailyQuotaExceededTime');
    if (quotaExceededTime) {
      const exceededTime = parseInt(quotaExceededTime);
      const now = Date.now();
      const timeSinceExceeded = now - exceededTime;
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      // If more than 24 hours have passed, clear the quota exceeded status
      if (timeSinceExceeded > oneDayInMs) {
        localStorage.removeItem('dailyQuotaExceeded');
        localStorage.removeItem('dailyQuotaExceededTime');
        console.log('[APILimiter] Daily quota reset - cleared exceeded status');
      }
    }
  }

  getStatus(api: keyof typeof this.limits): {
    remainingRequests: number;
    queueLength: number;
    circuitBreakerState: string;
    cacheSize: number;
  } {
    return {
      remainingRequests: this.getRemainingRequests(api),
      queueLength: this.getQueueLength(api),
      circuitBreakerState: this.circuitBreakers.get(api)?.state || 'CLOSED',
      cacheSize: this.cache.size
    };
  }
}

export const apiLimiter = new APILimiter();