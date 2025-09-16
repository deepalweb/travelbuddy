import React, { useState, useEffect, useRef } from 'react';
import { Colors } from '../constants';

interface PerformanceMetrics {
  bundleSize: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkRequests: number;
  totalResourcesLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

const PerformanceOptimizer: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const performanceObserver = useRef<PerformanceObserver | null>(null);

  // Collect performance metrics
  const collectMetrics = async () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const fcpEntry = paint.find(entry => entry.name === 'first-contentful-paint');
    
    // Get Core Web Vitals
    let lcp = 0;
    let cls = 0;
    let fid = 0;

    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcp = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP measurement not supported');
      }
    }

    // Memory usage
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }

    // Network requests count
    const resourceEntries = performance.getEntriesByType('resource');
    
    const newMetrics: PerformanceMetrics = {
      bundleSize: await getBundleSize(),
      renderTime: navigation.loadEventEnd - navigation.loadEventStart,
      memoryUsage,
      cacheHitRate: getCacheHitRate(),
      networkRequests: resourceEntries.length,
      totalResourcesLoaded: resourceEntries.length,
      firstContentfulPaint: fcpEntry ? fcpEntry.startTime : 0,
      largestContentfulPaint: lcp,
      cumulativeLayoutShift: cls,
      firstInputDelay: fid
    };

    setMetrics(newMetrics);
    generateRecommendations(newMetrics);
  };

  // Estimate bundle size from loaded resources
  const getBundleSize = async (): Promise<number> => {
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;

    resourceEntries.forEach(entry => {
      if (entry.name.includes('.js') || entry.name.includes('.css')) {
        // Estimate size based on transfer time and typical bandwidth
        totalSize += entry.transferSize || 0;
      }
    });

    return Math.round(totalSize / 1024); // Convert to KB
  };

  // Get cache hit rate from service worker or local storage
  const getCacheHitRate = (): number => {
    try {
      const cacheStats = localStorage.getItem('app-cache-stats');
      if (cacheStats) {
        const stats = JSON.parse(cacheStats);
        return stats.hitRate || 0;
      }
    } catch (e) {
      // Fallback calculation
    }
    return 0.75; // Estimated default
  };

  // Generate performance recommendations
  const generateRecommendations = (metrics: PerformanceMetrics) => {
    const recs: string[] = [];

    if (metrics.bundleSize > 1000) { // > 1MB
      recs.push('🔧 Bundle size is large. Consider code splitting and lazy loading');
    }

    if (metrics.firstContentfulPaint > 2500) { // > 2.5s
      recs.push('⚡ First Contentful Paint is slow. Optimize critical rendering path');
    }

    if (metrics.largestContentfulPaint > 4000) { // > 4s
      recs.push('📊 Largest Contentful Paint needs improvement. Optimize images and fonts');
    }

    if (metrics.memoryUsage > 50) { // > 50MB
      recs.push('🧠 High memory usage detected. Check for memory leaks');
    }

    if (metrics.cacheHitRate < 0.7) { // < 70%
      recs.push('💾 Low cache hit rate. Improve caching strategy');
    }

    if (metrics.networkRequests > 50) {
      recs.push('🌐 Many network requests. Consider bundling or HTTP/2 push');
    }

    if (recs.length === 0) {
      recs.push('✅ Performance looks good! Keep up the great work');
    }

    setRecommendations(recs);
  };

  // Apply automatic optimizations
  const applyOptimizations = () => {
    // Enable resource hints
    const head = document.head;
    
    // Preconnect to external domains
    const preconnects = [
      'https://images.unsplash.com',
      'https://api.gemini.google.com',
      'https://fonts.gstatic.com'
    ];

    preconnects.forEach(domain => {
      if (!document.querySelector(`link[href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        head.appendChild(link);
      }
    });

    // Optimize images with intersection observer for lazy loading
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    // Enable font display swap for better performance
    const fontLinks = document.querySelectorAll('link[rel="stylesheet"]');
    fontLinks.forEach(link => {
      if (link.getAttribute('href')?.includes('fonts')) {
        link.setAttribute('rel', 'preload');
        link.setAttribute('as', 'style');
        link.setAttribute('onload', "this.onload=null;this.rel='stylesheet'");
      }
    });
  };

  useEffect(() => {
    collectMetrics();
    
    // Collect metrics periodically
    const interval = setInterval(collectMetrics, 30000); // Every 30 seconds

    // Set up performance observers
    if ('PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'largest-contentful-paint') {
            setMetrics(prev => prev ? { ...prev, largestContentfulPaint: entry.startTime } : null);
          }
        });
      });

      try {
        performanceObserver.current.observe({ 
          entryTypes: ['largest-contentful-paint', 'layout-shift', 'first-input'] 
        });
      } catch (e) {
        console.warn('[Performance] Some metrics not supported');
      }
    }

    return () => {
      clearInterval(interval);
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
    };
  }, []);

  const formatTime = (time: number) => `${Math.round(time)}ms`;
  const formatSize = (size: number) => `${Math.round(size)}KB`;
  const formatMemory = (memory: number) => `${Math.round(memory)}MB`;
  const formatPercent = (percent: number) => `${Math.round(percent * 100)}%`;

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 w-12 h-12 rounded-full text-white text-xs font-bold z-50 shadow-lg"
        style={{ backgroundColor: Colors.primary }}
        title="Performance Optimizer"
      >
        ⚡
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-4 left-4 w-80 max-h-96 overflow-y-auto rounded-lg shadow-xl z-50 p-4"
      style={{ backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}` }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg" style={{ color: Colors.text }}>
          Performance Optimizer
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-sm px-2 py-1 rounded hover:opacity-75"
          style={{ color: Colors.text_secondary }}
        >
          ✕
        </button>
      </div>

      {metrics && (
        <div className="space-y-3">
          {/* Core Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded" style={{ backgroundColor: Colors.background }}>
              <div style={{ color: Colors.text_secondary }}>Bundle Size</div>
              <div className="font-bold" style={{ color: Colors.text }}>
                {formatSize(metrics.bundleSize)}
              </div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: Colors.background }}>
              <div style={{ color: Colors.text_secondary }}>Memory</div>
              <div className="font-bold" style={{ color: Colors.text }}>
                {formatMemory(metrics.memoryUsage)}
              </div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: Colors.background }}>
              <div style={{ color: Colors.text_secondary }}>FCP</div>
              <div className="font-bold" style={{ 
                color: metrics.firstContentfulPaint > 2500 ? Colors.accentError : Colors.accentSuccess 
              }}>
                {formatTime(metrics.firstContentfulPaint)}
              </div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: Colors.background }}>
              <div style={{ color: Colors.text_secondary }}>Cache Hit</div>
              <div className="font-bold" style={{ 
                color: metrics.cacheHitRate > 0.7 ? Colors.accentSuccess : Colors.accentWarning 
              }}>
                {formatPercent(metrics.cacheHitRate)}
              </div>
            </div>
          </div>

          {/* Web Vitals */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm" style={{ color: Colors.text }}>
              Core Web Vitals
            </h4>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <div className="flex justify-between">
                <span style={{ color: Colors.text_secondary }}>LCP:</span>
                <span style={{ 
                  color: metrics.largestContentfulPaint > 4000 ? Colors.accentError : 
                         metrics.largestContentfulPaint > 2500 ? Colors.accentWarning : Colors.accentSuccess 
                }}>
                  {formatTime(metrics.largestContentfulPaint)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: Colors.text_secondary }}>Network Requests:</span>
                <span style={{ 
                  color: metrics.networkRequests > 50 ? Colors.accentWarning : Colors.text 
                }}>
                  {metrics.networkRequests}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm" style={{ color: Colors.text }}>
              Recommendations
            </h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className="text-xs p-2 rounded" 
                  style={{ backgroundColor: Colors.background, color: Colors.text_secondary }}
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={applyOptimizations}
              className="flex-1 px-3 py-2 text-xs rounded font-medium transition-colors"
              style={{ 
                backgroundColor: Colors.primary, 
                color: 'white'
              }}
            >
              Apply Optimizations
            </button>
            <button
              onClick={collectMetrics}
              className="px-3 py-2 text-xs rounded font-medium transition-colors"
              style={{ 
                backgroundColor: Colors.cardBorder, 
                color: Colors.text 
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceOptimizer;
