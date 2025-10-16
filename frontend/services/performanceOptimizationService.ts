import { Place } from '../types';

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  apiResponseTime: number;
  userInteractionDelay: number;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  strategy: 'lru' | 'fifo' | 'lfu';
}

export interface OptimizationResult {
  before: PerformanceMetrics;
  after: PerformanceMetrics;
  improvements: string[];
  recommendations: string[];
}

class PerformanceOptimizationService {
  private cache: Map<string, { data: any; timestamp: number; accessCount: number }> = new Map();
  private cacheConfig: CacheConfig = {
    maxSize: 1000,
    ttl: 30 * 60 * 1000, // 30 minutes
    strategy: 'lru'
  };
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    apiResponseTime: 0,
    userInteractionDelay: 0
  };
  private performanceObserver?: PerformanceObserver;

  constructor() {
    this.initializePerformanceMonitoring();
    this.setupMemoryManagement();
  }

  // Intelligent Caching System
  set(key: string, data: any, customTTL?: number): void {
    const ttl = customTTL || this.cacheConfig.ttl;
    const entry = {
      data,
      timestamp: Date.now(),
      accessCount: 0
    };

    // Implement cache eviction if at max size
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictCache();
    }

    this.cache.set(key, entry);
    
    // Set automatic cleanup
    setTimeout(() => {
      if (this.cache.has(key)) {
        const currentEntry = this.cache.get(key)!;
        if (Date.now() - currentEntry.timestamp >= ttl) {
          this.cache.delete(key);
        }
      }
    }, ttl);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheConfig.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access count for LFU strategy
    entry.accessCount++;
    return entry.data;
  }

  // Smart cache eviction based on strategy
  private evictCache(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;
    
    switch (this.cacheConfig.strategy) {
      case 'lru':
        // Evict least recently used
        keyToEvict = Array.from(this.cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
        break;
      
      case 'lfu':
        // Evict least frequently used
        keyToEvict = Array.from(this.cache.entries())
          .sort((a, b) => a[1].accessCount - b[1].accessCount)[0][0];
        break;
      
      case 'fifo':
      default:
        // Evict first in
        keyToEvict = this.cache.keys().next().value;
        break;
    }

    this.cache.delete(keyToEvict);
  }

  // Image Optimization
  optimizeImage(imageUrl: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}): string {
    const { width = 400, height = 300, quality = 80, format = 'webp' } = options;
    
    // For external images, use a service like Cloudinary or implement lazy loading
    if (imageUrl.startsWith('http')) {
      // Return optimized URL (mock implementation)
      return `${imageUrl}?w=${width}&h=${height}&q=${quality}&f=${format}`;
    }
    
    return imageUrl;
  }

  // Lazy Loading Implementation
  createLazyLoader(): IntersectionObserver {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = this.optimizeImage(src);
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    return imageObserver;
  }

  // Component Virtualization for Large Lists
  calculateVisibleItems(
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 5
  ): { startIndex: number; endIndex: number; visibleItems: number } {
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);

    return { startIndex, endIndex, visibleItems };
  }

  // Bundle Optimization
  async loadComponentDynamically<T>(
    importFunction: () => Promise<{ default: T }>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const module = await importFunction();
      const loadTime = performance.now() - startTime;
      
      // Track dynamic import performance
      this.metrics.loadTime = loadTime;
      
      return module.default;
    } catch (error) {
      console.error('Dynamic import failed:', error);
      throw error;
    }
  }

  // API Request Optimization
  async optimizedFetch(
    url: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<any> {
    const startTime = performance.now();
    
    // Check cache first
    if (cacheKey) {
      const cached = this.get(cacheKey);
      if (cached) {
        this.updateCacheHitRate(true);
        return cached;
      }
    }

    try {
      // Add request optimization headers
      const optimizedOptions: RequestInit = {
        ...options,
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'max-age=300',
          ...options.headers
        }
      };

      const response = await fetch(url, optimizedOptions);
      const data = await response.json();
      
      const responseTime = performance.now() - startTime;
      this.metrics.apiResponseTime = responseTime;
      
      // Cache successful responses
      if (cacheKey && response.ok) {
        this.set(cacheKey, data);
      }
      
      this.updateCacheHitRate(false);
      return data;
    } catch (error) {
      console.error('Optimized fetch failed:', error);
      throw error;
    }
  }

  // Memory Management
  private setupMemoryManagement(): void {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory;
        this.metrics.memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
        
        // Trigger cleanup if memory usage is high
        if (this.metrics.memoryUsage > 0.8) {
          this.performMemoryCleanup();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  private performMemoryCleanup(): void {
    // Clear old cache entries
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheConfig.ttl / 2) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  // Performance Monitoring
  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          switch (entry.entryType) {
            case 'navigation':
              const navEntry = entry as PerformanceNavigationTiming;
              this.metrics.loadTime = navEntry.loadEventEnd - navEntry.navigationStart;
              break;
            
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                this.metrics.renderTime = entry.startTime;
              }
              break;
            
            case 'measure':
              if (entry.name.includes('user-interaction')) {
                this.metrics.userInteractionDelay = entry.duration;
              }
              break;
          }
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'paint', 'measure', 'largest-contentful-paint'] 
      });
    }
  }

  // Debouncing for User Interactions
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Throttling for Scroll Events
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Preloading Critical Resources
  preloadCriticalResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
        link.as = 'image';
      }
      
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Service Worker for Offline Caching
  async registerServiceWorker(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return true;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return false;
      }
    }
    return false;
  }

  // Performance Analytics
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    cacheStats: {
      size: number;
      hitRate: number;
      memoryUsage: string;
    };
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    if (this.metrics.loadTime > 3000) {
      recommendations.push('Consider code splitting to reduce initial bundle size');
    }
    
    if (this.metrics.cacheHitRate < 0.5) {
      recommendations.push('Improve caching strategy for better performance');
    }
    
    if (this.metrics.memoryUsage > 0.7) {
      recommendations.push('Optimize memory usage by cleaning up unused objects');
    }
    
    if (this.metrics.apiResponseTime > 1000) {
      recommendations.push('Optimize API calls or implement request batching');
    }

    return {
      metrics: this.metrics,
      cacheStats: {
        size: this.cache.size,
        hitRate: this.metrics.cacheHitRate,
        memoryUsage: `${(this.metrics.memoryUsage * 100).toFixed(1)}%`
      },
      recommendations
    };
  }

  private updateCacheHitRate(hit: boolean): void {
    // Simple moving average for cache hit rate
    const alpha = 0.1;
    this.metrics.cacheHitRate = this.metrics.cacheHitRate * (1 - alpha) + (hit ? 1 : 0) * alpha;
  }

  // Cleanup
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.cache.clear();
  }
}

export const performanceOptimizationService = new PerformanceOptimizationService();