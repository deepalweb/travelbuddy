import React, { useEffect, useRef, useCallback, useMemo } from 'react';

interface MemoryOptimizationConfig {
  maxCacheSize?: number;
  cacheExpiry?: number;
  enableGarbageCollection?: boolean;
  enablePerformanceMonitoring?: boolean;
}

interface MemoryState {
  cacheSize: number;
  hitRate: number;
  gcCount: number;
  performanceMetrics: {
    renderTime: number;
    memoryUsage: number;
  };
}

// Check if we're in development mode
const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

/**
 * Hook for optimizing memory usage and performance
 */
export const useMemoryOptimization = (config: MemoryOptimizationConfig = {}) => {
  const {
    maxCacheSize = 50,
    cacheExpiry = 5 * 60 * 1000, // 5 minutes
    enableGarbageCollection = true,
    enablePerformanceMonitoring = false
  } = config;

  const cache = useRef(new Map<string, { data: any; timestamp: number; accessCount: number }>());
  const renderStartTime = useRef<number>(0);
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const gcTimer = useRef<number | undefined>(undefined);

  const memoryState = useRef<MemoryState>({
    cacheSize: 0,
    hitRate: 0,
    gcCount: 0,
    performanceMetrics: {
      renderTime: 0,
      memoryUsage: 0
    }
  });

  // Cache management functions
  const setCache = useCallback((key: string, data: any) => {
    const now = Date.now();
    
    // Remove expired entries first
    for (const [cacheKey, entry] of cache.current.entries()) {
      if (now - entry.timestamp > cacheExpiry) {
        cache.current.delete(cacheKey);
      }
    }

    // If cache is full, remove least recently used item
    if (cache.current.size >= maxCacheSize) {
      let lruKey = '';
      let lruTime = Infinity;
      let lruAccess = Infinity;

      for (const [cacheKey, entry] of cache.current.entries()) {
        if (entry.accessCount < lruAccess || 
           (entry.accessCount === lruAccess && entry.timestamp < lruTime)) {
          lruKey = cacheKey;
          lruTime = entry.timestamp;
          lruAccess = entry.accessCount;
        }
      }

      if (lruKey) {
        cache.current.delete(lruKey);
      }
    }

    cache.current.set(key, { data, timestamp: now, accessCount: 0 });
    memoryState.current.cacheSize = cache.current.size;
  }, [maxCacheSize, cacheExpiry]);

  const getCache = useCallback((key: string) => {
    const entry = cache.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > cacheExpiry) {
      cache.current.delete(key);
      memoryState.current.cacheSize = cache.current.size;
      return null;
    }

    // Update access count and timestamp
    entry.accessCount++;
    entry.timestamp = now;
    
    // Update hit rate
    const totalRequests = Array.from(cache.current.values())
      .reduce((sum, item) => sum + item.accessCount, 0);
    memoryState.current.hitRate = totalRequests > 0 ? 
      (totalRequests - cache.current.size) / totalRequests : 0;

    return entry.data;
  }, [cacheExpiry]);

  const clearCache = useCallback(() => {
    cache.current.clear();
    memoryState.current.cacheSize = 0;
    memoryState.current.hitRate = 0;
  }, []);

  // Garbage collection
  const runGarbageCollection = useCallback(() => {
    if (!enableGarbageCollection) return;

    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of cache.current.entries()) {
      if (now - entry.timestamp > cacheExpiry || entry.accessCount === 0) {
        cache.current.delete(key);
        removed++;
      }
    }

    memoryState.current.cacheSize = cache.current.size;
    memoryState.current.gcCount++;

    if (isDev && removed > 0) {
      console.log(`[Memory GC] Removed ${removed} expired cache entries`);
    }

    // Force browser garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }, [enableGarbageCollection, cacheExpiry]);

  // Performance monitoring
  const startRenderMeasurement = useCallback(() => {
    if (!enablePerformanceMonitoring) return;
    renderStartTime.current = performance.now();
  }, [enablePerformanceMonitoring]);

  const endRenderMeasurement = useCallback((componentName: string = 'Component') => {
    if (!enablePerformanceMonitoring || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    memoryState.current.performanceMetrics.renderTime = renderTime;

    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`);
    }

    renderStartTime.current = 0;
  }, [enablePerformanceMonitoring]);

  // Memory usage monitoring
  const getMemoryUsage = useCallback(() => {
    if (typeof performance !== 'undefined' && 'memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }, []);

  // Memoized expensive computations
  const memoizeExpensiveComputation = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    keyGenerator?: (...args: T) => string
  ) => {
    return (...args: T): R => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cachedResult = getCache(`computation_${key}`);
      
      if (cachedResult !== null) {
        return cachedResult;
      }

      const result = fn(...args);
      setCache(`computation_${key}`, result);
      return result;
    };
  }, [getCache, setCache]);

  // Object pooling for frequently created objects
  const objectPools = useRef(new Map<string, any[]>());

  const createPooledObject = useCallback(<T>(
    poolName: string,
    factory: () => T,
    reset?: (obj: T) => void
  ): T => {
    let pool = objectPools.current.get(poolName);
    if (!pool) {
      pool = [];
      objectPools.current.set(poolName, pool);
    }

    if (pool.length > 0) {
      const obj = pool.pop();
      if (reset) reset(obj);
      return obj;
    }

    return factory();
  }, []);

  const returnPooledObject = useCallback(<T>(poolName: string, obj: T) => {
    const pool = objectPools.current.get(poolName);
    if (pool && pool.length < 10) { // Max pool size
      pool.push(obj);
    }
  }, []);

  // Setup effects
  useEffect(() => {
    if (enableGarbageCollection) {
      gcTimer.current = window.setInterval(runGarbageCollection, 60000); // Run GC every minute
    }

    if (enablePerformanceMonitoring && typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'measure') {
            memoryState.current.performanceMetrics.renderTime = entry.duration;
          }
        }
      });
      
      try {
        performanceObserver.current.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (e) {
        console.warn('[Performance] Performance Observer not supported');
      }
    }

    return () => {
      if (gcTimer.current) {
        window.clearInterval(gcTimer.current);
      }
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
    };
  }, [enableGarbageCollection, enablePerformanceMonitoring, runGarbageCollection]);

  // Memory status
  const memoryStatus = useMemo(() => ({
    ...memoryState.current,
    memoryUsage: getMemoryUsage()
  }), [getMemoryUsage]);

  return {
    // Cache management
    setCache,
    getCache,
    clearCache,
    
    // Performance measurement
    startRenderMeasurement,
    endRenderMeasurement,
    
    // Memoization
    memoizeExpensiveComputation,
    
    // Object pooling
    createPooledObject,
    returnPooledObject,
    
    // Memory status
    memoryStatus,
    
    // Manual garbage collection
    runGarbageCollection
  };
};

// Higher-order component for automatic performance monitoring
export const withMemoryOptimization = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string = WrappedComponent.name
) => {
  return React.memo((props: P) => {
    const { startRenderMeasurement, endRenderMeasurement } = useMemoryOptimization({
      enablePerformanceMonitoring: isDev
    });

    useEffect(() => {
      startRenderMeasurement();
      return () => endRenderMeasurement(componentName);
    });

    return React.createElement(WrappedComponent, props);
  });
};
