import { useState, useEffect, useRef, useCallback } from 'react';
import { Place } from '../types';
import { generateContentWithRetry, processResponse } from '../services/geminiService';
import { smartMapCache } from '../services/smartMapCache';

interface MapBounds {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
}

interface AIRecommendation {
  place: Place;
  reason: string;
  confidence: number;
  category: 'trending' | 'nearby' | 'similar' | 'seasonal' | 'time-based';
}

interface UseAIMapRecommendationsOptions {
  enabled?: boolean;
  maxRecommendations?: number;
  debounceMs?: number;
  userPreferences?: {
    interests?: string[];
    budget?: 'low' | 'medium' | 'high';
    travelStyle?: string;
  };
}

export const useAIMapRecommendations = (
  mapBounds: MapBounds | null,
  userLocation: { lat: number; lng: number } | null,
  currentPlaces: Place[] = [],
  options: UseAIMapRecommendationsOptions = {}
) => {
  const {
    enabled = true,
    maxRecommendations = 5,
    debounceMs = 1000,
    userPreferences = {}
  } = options;

  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastBoundsRef = useRef<MapBounds | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced recommendation generation
  const generateRecommendations = useCallback(async (
    bounds: MapBounds,
    userLoc: { lat: number; lng: number }
  ) => {
    if (!enabled) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const currentTime = new Date();
      const timeContext = {
        hour: currentTime.getHours(),
        dayOfWeek: currentTime.getDay(),
        month: currentTime.getMonth(),
        isWeekend: currentTime.getDay() === 0 || currentTime.getDay() === 6
      };

      // Check cache first
      const cachedRecommendations = smartMapCache.getCachedAIPlaces(
        { lat: (bounds.northeast.lat + bounds.southwest.lat) / 2, lng: (bounds.northeast.lng + bounds.southwest.lng) / 2 },
        'recommendations'
      );

      if (cachedRecommendations) {
        setRecommendations(cachedRecommendations);
        setIsLoading(false);
        return;
      }

      const prompt = `
        You are an AI travel advisor analyzing a map area for personalized recommendations.
        
        Map Area:
        - Northeast: ${bounds.northeast.lat}, ${bounds.northeast.lng}
        - Southwest: ${bounds.southwest.lat}, ${bounds.southwest.lng}
        - User Location: ${userLoc.lat}, ${userLoc.lng}
        
        Current Context:
        - Time: ${timeContext.hour}:00 (${timeContext.isWeekend ? 'Weekend' : 'Weekday'})
        - Month: ${timeContext.month + 1}
        
        Current Places Visible: ${currentPlaces.map(p => `${p.name} (${p.type})`).slice(0, 10).join(', ')}
        
        User Preferences:
        - Interests: ${userPreferences.interests?.join(', ') || 'General exploration'}
        - Budget: ${userPreferences.budget || 'Medium'}
        - Travel Style: ${userPreferences.travelStyle || 'Balanced'}
        
        Based on this context, suggest ${maxRecommendations} intelligent recommendations that are:
        1. Relevant to current time/season
        2. Complement existing visible places
        3. Match user preferences
        4. Are realistically accessible from the map area
        
        For each recommendation, provide:
        - Name and type of place
        - Why it's recommended (brief, specific reason)
        - Confidence score (0-1)
        - Category: trending|nearby|similar|seasonal|time-based
        - Estimated location within the map bounds
        
        Return JSON array:
        [
          {
            "name": "Place Name",
            "type": "restaurant",
            "reason": "Perfect for lunch given the current time and nearby attractions",
            "confidence": 0.85,
            "category": "time-based",
            "estimatedLocation": {"lat": 37.7749, "lng": -122.4194},
            "description": "Brief engaging description"
          }
        ]
      `;

      const response = await generateContentWithRetry({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const rawRecommendations = processResponse(response, 'generateRecommendations') as any[];
      
      // Convert to AIRecommendation format with full Place objects
      const aiRecommendations: AIRecommendation[] = rawRecommendations.map((rec: any, index: number) => ({
        place: {
          id: `ai-rec-${Date.now()}-${index}`,
          name: rec.name || 'AI Recommendation',
          type: rec.type || 'establishment',
          rating: 4.0 + Math.random() * 1.0, // Simulated rating
          address: `Near ${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}`,
          geometry: {
            location: rec.estimatedLocation || {
              lat: userLoc.lat + (Math.random() - 0.5) * 0.01,
              lng: userLoc.lng + (Math.random() - 0.5) * 0.01
            }
          },
          photoUrl: `https://source.unsplash.com/400x300/?${encodeURIComponent(rec.name)},travel`,
          description: rec.description || 'AI recommended location based on your preferences',
          isOpen: true,
          priceLevel: Math.floor(Math.random() * 4) + 1,
          localTip: `AI suggests: ${rec.reason}`,
          handyPhrase: 'Recommended by AI'
        } as Place,
        reason: rec.reason || 'Recommended based on your preferences',
        confidence: rec.confidence || 0.7,
        category: rec.category || 'nearby'
      }));

      // Cache the results
      smartMapCache.cacheAIPlaces(
        { lat: (bounds.northeast.lat + bounds.southwest.lat) / 2, lng: (bounds.northeast.lng + bounds.southwest.lng) / 2 },
        aiRecommendations,
        'recommendations'
      );

      setRecommendations(aiRecommendations);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('AI recommendations failed:', error);
        setError('Failed to generate recommendations');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [enabled, maxRecommendations, currentPlaces, userPreferences]);

  // Effect to handle bounds changes with debouncing
  useEffect(() => {
    if (!mapBounds || !userLocation || !enabled) {
      return;
    }

    // Check if bounds have significantly changed
    const boundsChanged = !lastBoundsRef.current || 
      Math.abs(lastBoundsRef.current.northeast.lat - mapBounds.northeast.lat) > 0.001 ||
      Math.abs(lastBoundsRef.current.northeast.lng - mapBounds.northeast.lng) > 0.001 ||
      Math.abs(lastBoundsRef.current.southwest.lat - mapBounds.southwest.lat) > 0.001 ||
      Math.abs(lastBoundsRef.current.southwest.lng - mapBounds.southwest.lng) > 0.001;

    if (!boundsChanged) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced timeout
    timeoutRef.current = setTimeout(() => {
      lastBoundsRef.current = mapBounds;
      generateRecommendations(mapBounds, userLocation);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mapBounds, userLocation, generateRecommendations, debounceMs, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Manual refresh function
  const refreshRecommendations = useCallback(() => {
    if (mapBounds && userLocation) {
      generateRecommendations(mapBounds, userLocation);
    }
  }, [mapBounds, userLocation, generateRecommendations]);

  // Filter recommendations by category
  const getRecommendationsByCategory = useCallback((category: AIRecommendation['category']) => {
    return recommendations.filter(rec => rec.category === category);
  }, [recommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refreshRecommendations,
    getRecommendationsByCategory,
    // Utility functions
    hasRecommendations: recommendations.length > 0,
    highConfidenceRecommendations: recommendations.filter(r => r.confidence > 0.8),
    recommendationsByCategory: {
      trending: getRecommendationsByCategory('trending'),
      nearby: getRecommendationsByCategory('nearby'),
      similar: getRecommendationsByCategory('similar'),
      seasonal: getRecommendationsByCategory('seasonal'),
      timeBased: getRecommendationsByCategory('time-based')
    }
  };
};
