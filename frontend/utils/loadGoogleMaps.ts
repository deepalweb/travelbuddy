declare global {
  interface Window { google?: any }
}

let loadPromise: Promise<any> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<any> {
  if (window.google && window.google.maps) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Lazy import to avoid circular deps for environments without module support
      import('../services/usageAnalyticsService').then(m => {
        m.usageAnalytics.postUsage({ api: 'maps', action: 'load', status: 'success' });
      }).catch(() => {});
      resolve(window.google);
    };
  script.onerror = () => {
      import('../services/usageAnalyticsService').then(m => {
        m.usageAnalytics.postUsage({ api: 'maps', action: 'load', status: 'error' });
      }).catch(() => {});
      reject(new Error('Failed to load Google Maps JS API'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}
