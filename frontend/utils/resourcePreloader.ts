// Resource preloader for critical assets and code splitting optimization
class ResourcePreloader {
  private static instance: ResourcePreloader;
  private preloadedResources = new Set<string>();
  private preloadQueue: Array<{ url: string; type: 'script' | 'style' | 'image' | 'font'; priority: 'high' | 'medium' | 'low' }> = [];
  private isProcessing = false;

  static getInstance(): ResourcePreloader {
    if (!ResourcePreloader.instance) {
      ResourcePreloader.instance = new ResourcePreloader();
    }
    return ResourcePreloader.instance;
  }

  /**
   * Preload critical resources for the current route
   */
  preloadCriticalResources(): void {
    // Preload critical CSS
    this.preloadResource('/css/critical.css', 'style', 'high');
    
    // Preload essential fonts
    this.preloadResource('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZs.woff2', 'font', 'high');
    
    // Preload essential images
    this.preloadResource('/images/logo.png', 'image', 'high');
    this.preloadResource('/images/hero-bg.jpg', 'image', 'medium');
  }

  /**
   * Preload resources based on user intent (hover, focus)
   */
  preloadOnIntent(routeName: string): void {
    switch (routeName) {
      case 'places':
        this.preloadResource('/js/places-chunk.js', 'script', 'medium');
        this.preloadResource('/css/places.css', 'style', 'medium');
        break;
      case 'community':
        this.preloadResource('/js/community-chunk.js', 'script', 'medium');
        this.preloadResource('/css/community.css', 'style', 'medium');
        break;
      case 'admin':
        this.preloadResource('/js/admin-chunk.js', 'script', 'low');
        this.preloadResource('/css/admin.css', 'style', 'low');
        break;
      case 'ai-planner':
        this.preloadResource('/js/ai-components.js', 'script', 'medium');
        break;
    }
  }

  /**
   * Preload resources based on user behavior patterns
   */
  preloadBasedOnBehavior(userInteractions: string[]): void {
    // Analyze user behavior and preload likely next resources
    const behaviorPatterns = this.analyzeUserBehavior(userInteractions);
    
    behaviorPatterns.forEach(pattern => {
      switch (pattern) {
        case 'likely-to-search-places':
          this.preloadResource('/js/places-chunk.js', 'script', 'medium');
          break;
        case 'likely-to-use-ai-planner':
          this.preloadResource('/js/ai-components.js', 'script', 'medium');
          break;
        case 'likely-to-view-community':
          this.preloadResource('/js/community-chunk.js', 'script', 'low');
          break;
      }
    });
  }

  /**
   * Add resource to preload queue
   */
  private preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font', priority: 'high' | 'medium' | 'low'): void {
    if (this.preloadedResources.has(url)) {
      return; // Already preloaded
    }

    this.preloadQueue.push({ url, type, priority });
    this.processQueue();
  }

  /**
   * Process preload queue with priority
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.preloadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    // Sort by priority
    this.preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process high priority items first
    const highPriorityItems = this.preloadQueue.filter(item => item.priority === 'high');
    await this.processItems(highPriorityItems);

    // Then medium priority
    const mediumPriorityItems = this.preloadQueue.filter(item => item.priority === 'medium');
    await this.processItems(mediumPriorityItems);

    // Finally low priority
    const lowPriorityItems = this.preloadQueue.filter(item => item.priority === 'low');
    await this.processItems(lowPriorityItems);

    this.isProcessing = false;
  }

  /**
   * Process items with rate limiting
   */
  private async processItems(items: Array<{ url: string; type: 'script' | 'style' | 'image' | 'font' }>): Promise<void> {
    const batchSize = 3; // Process 3 items at a time
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const promises = batch.map(item => this.loadResource(item.url, item.type));
      
      await Promise.allSettled(promises);
      
      // Remove processed items from queue
      batch.forEach(item => {
        const index = this.preloadQueue.findIndex(qItem => qItem.url === item.url);
        if (index > -1) {
          this.preloadQueue.splice(index, 1);
        }
      });

      // Small delay between batches to avoid overwhelming the network
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Load individual resource
   */
  private loadResource(url: string, type: 'script' | 'style' | 'image' | 'font'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedResources.has(url)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      
      switch (type) {
        case 'script':
          link.as = 'script';
          link.href = url;
          break;
        case 'style':
          link.as = 'style';
          link.href = url;
          break;
        case 'image':
          link.as = 'image';
          link.href = url;
          break;
        case 'font':
          link.as = 'font';
          link.href = url;
          link.crossOrigin = 'anonymous';
          break;
      }

      link.onload = () => {
        this.preloadedResources.add(url);
        resolve();
      };

      link.onerror = () => {
        console.warn(`[Preloader] Failed to preload: ${url}`);
        reject(new Error(`Failed to preload ${url}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Analyze user behavior patterns
   */
  private analyzeUserBehavior(interactions: string[]): string[] {
    const patterns: string[] = [];

    // Simple pattern analysis
    if (interactions.includes('search-input-focus') || interactions.includes('place-card-hover')) {
      patterns.push('likely-to-search-places');
    }

    if (interactions.includes('trip-planner-button-click') || interactions.includes('ai-assistant-open')) {
      patterns.push('likely-to-use-ai-planner');
    }

    if (interactions.includes('community-tab-click') || interactions.includes('photo-upload-button-hover')) {
      patterns.push('likely-to-view-community');
    }

    return patterns;
  }

  /**
   * Prefetch DNS for external domains
   */
  prefetchDNS(): void {
    const domains = [
      'https://images.unsplash.com',
      'https://api.gemini.google.com',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://tile.openstreetmap.org',
      'https://open.er-api.com'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  /**
   * Setup resource hints based on viewport
   */
  setupViewportOptimizations(): void {
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      document.head.appendChild(viewport);
    }

    // Add performance hints
    const hints = [
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
      { rel: 'preconnect', href: 'https://images.unsplash.com' },
    ];

    hints.forEach(hint => {
      if (!document.querySelector(`link[href="${hint.href}"]`)) {
        const link = document.createElement('link');
        link.rel = hint.rel;
        link.href = hint.href;
        if (hint.crossorigin) {
          link.crossOrigin = hint.crossorigin;
        }
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Get preloader statistics
   */
  getStats(): { preloadedCount: number; queueLength: number; hitRate: number } {
    return {
      preloadedCount: this.preloadedResources.size,
      queueLength: this.preloadQueue.length,
      hitRate: this.preloadedResources.size / (this.preloadedResources.size + this.preloadQueue.length)
    };
  }

  /**
   * Clear preloader cache
   */
  clearCache(): void {
    this.preloadedResources.clear();
    this.preloadQueue.length = 0;
  }
}

export const resourcePreloader = ResourcePreloader.getInstance();

// Helper functions for React components
export const useResourcePreloader = () => {
  const preloadOnHover = (routeName: string) => {
    resourcePreloader.preloadOnIntent(routeName);
  };

  const preloadCritical = () => {
    resourcePreloader.preloadCriticalResources();
  };

  const trackUserInteraction = (interaction: string) => {
    // Store interaction for behavior analysis
    const interactions = JSON.parse(localStorage.getItem('user-interactions') || '[]');
    interactions.push(interaction);
    
    // Keep only last 50 interactions
    if (interactions.length > 50) {
      interactions.splice(0, interactions.length - 50);
    }
    
    localStorage.setItem('user-interactions', JSON.stringify(interactions));
    resourcePreloader.preloadBasedOnBehavior(interactions);
  };

  return {
    preloadOnHover,
    preloadCritical,
    trackUserInteraction,
    getStats: resourcePreloader.getStats,
    clearCache: resourcePreloader.clearCache
  };
};

// Initialize preloader
if (typeof document !== 'undefined') {
  resourcePreloader.prefetchDNS();
  resourcePreloader.setupViewportOptimizations();
}
