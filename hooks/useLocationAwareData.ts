import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentGeoLocation } from '../utils/geolocation';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const LOCATION_CACHE_KEY = 'lastKnownLocation';
const LOCATION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useLocationAwareData = () => {
  const [location, setLocation] = useState<LocationData | null>(() => {
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  const refreshLocation = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Skip if recently refreshed (unless forced)
    if (!force && location && (now - location.timestamp) < LOCATION_REFRESH_INTERVAL) {
      return location;
    }

    setIsRefreshing(true);
    try {
      const coords = await getCurrentGeoLocation();
      const newLocation: LocationData = {
        ...coords,
        timestamp: now
      };
      
      setLocation(newLocation);
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(newLocation));
      return newLocation;
    } catch (error) {
      console.warn('Location refresh failed:', error);
      return location; // Return cached location on error
    } finally {
      setIsRefreshing(false);
    }
  }, [location]);

  // Auto-refresh location when app becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshLocation(); // Refresh when app becomes active
      }
    };

    const handleFocus = () => {
      refreshLocation(); // Refresh when window gains focus
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refreshLocation]);

  // Initial location detection
  useEffect(() => {
    if (!location) {
      refreshLocation(true);
    }
  }, [location, refreshLocation]);

  return {
    location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
    isRefreshing,
    refreshLocation: () => refreshLocation(true),
    lastUpdated: location?.timestamp
  };
};