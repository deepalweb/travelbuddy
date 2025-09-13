import { Loader } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_CONFIG, PLACES_CONFIG, MAPS_ERROR_MESSAGES } from '../config/googleMaps';
import { Place } from '../types';
import { generateContentWithRetry, processResponse } from './geminiService';

export class GoogleMapsAIService {
  private static instance: GoogleMapsAIService;
  private loader: Loader;
  private placesService: google.maps.places.PlacesService | null = null;
  private directionsService: google.maps.DirectionsService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private isInitialized = false;

  constructor() {
    this.loader = new Loader({
      apiKey: GOOGLE_MAPS_CONFIG.apiKey,
      version: GOOGLE_MAPS_CONFIG.version,
      libraries: GOOGLE_MAPS_CONFIG.libraries
    });
  }

  static getInstance(): GoogleMapsAIService {
    if (!GoogleMapsAIService.instance) {
      GoogleMapsAIService.instance = new GoogleMapsAIService();
    }
    return GoogleMapsAIService.instance;
  }

  async initialize(map?: google.maps.Map): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loader.load();
      
      if (map) {
        this.placesService = new google.maps.places.PlacesService(map);
      }
      
      this.directionsService = new google.maps.DirectionsService();
      this.geocoder = new google.maps.Geocoder();
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`${MAPS_ERROR_MESSAGES.LOAD_FAILED}: ${error}`);
    }
  }

  async loadGoogleMaps(): Promise<typeof google.maps> {
    await this.loader.load();
    return google.maps;
  }

  // Hybrid Google Places + Gemini AI approach
  async getEnhancedNearbyPlaces(
    location: { lat: number; lng: number },
    radius: number = PLACES_CONFIG.radius,
    type?: string
  ): Promise<Place[]> {
    try {
      const [googlePlaces, aiPlaces] = await Promise.all([
        this.getGooglePlaces(location, radius, type),
        this.getGeminiPlaces(location.lat, location.lng, type)
      ]);

      // AI Enhancement: Merge and deduplicate using Gemini
      return this.mergeAndEnhancePlaces(googlePlaces, aiPlaces);
    } catch (error) {
      console.error('Enhanced places search failed:', error);
      throw error;
    }
  }

  private async getGooglePlaces(
    location: { lat: number; lng: number },
    radius: number,
    type?: string
  ): Promise<google.maps.places.PlaceResult[]> {
    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
        type: type as any
      };

      this.placesService!.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`${MAPS_ERROR_MESSAGES.PLACES_SEARCH_FAILED}: ${status}`));
        }
      });
    });
  }

  private async getGeminiPlaces(
    lat: number,
    lng: number,
    type?: string
  ): Promise<Place[]> {
    // Use your existing Gemini service to get AI-generated places
    const { fetchAttractionPlaces } = await import('./geminiService');
    return fetchAttractionPlaces(lat, lng, type || 'attractions', '');
  }

  // AI Enhancement: Use Gemini to merge and enhance place data
  private async mergeAndEnhancePlaces(
    googlePlaces: google.maps.places.PlaceResult[],
    aiPlaces: Place[]
  ): Promise<Place[]> {
    try {
      const prompt = `
        Intelligently merge these two place datasets:
        
        Google Places (authoritative): ${JSON.stringify(googlePlaces.slice(0, 10).map(p => ({
          name: p.name,
          rating: p.rating,
          types: p.types,
          vicinity: p.vicinity,
          place_id: p.place_id
        })))}
        
        AI Places (discovery): ${JSON.stringify(aiPlaces.slice(0, 10).map(p => ({
          name: p.name,
          type: p.type,
          rating: p.rating,
          address: p.address
        })))}
        
        Return a JSON array of enhanced places with:
        1. No duplicates (match by name/location similarity within 100m)
        2. Prioritize Google Places for accuracy
        3. Include AI places for unique discoveries
        4. Enhanced descriptions combining both sources
        5. Confidence scores (0-1) for each place
        
        Format: [{"name": "", "type": "", "rating": 0, "address": "", "confidence": 0.95, "source": "google|ai|hybrid", "description": ""}]
      `;

      const response = await generateContentWithRetry({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const mergedPlaces = processResponse(response, 'mergeAndEnhancePlaces');
      
      // Convert to Place format
      return this.convertToPlaceFormat(mergedPlaces, googlePlaces, aiPlaces);
    } catch (error) {
      console.error('AI place merging failed, falling back to simple merge:', error);
      return this.fallbackMerge(googlePlaces, aiPlaces);
    }
  }

  private convertToPlaceFormat(
    mergedData: any[],
    googlePlaces: google.maps.places.PlaceResult[],
    aiPlaces: Place[]
  ): Place[] {
    return mergedData.map((item, index) => {
      // Find matching Google or AI place for full data
      const googlePlace = googlePlaces.find(gp => 
        gp.name?.toLowerCase().includes(item.name?.toLowerCase() || '') ||
        item.name?.toLowerCase().includes(gp.name?.toLowerCase() || '')
      );
      
      const aiPlace = aiPlaces.find(ap => 
        ap.name.toLowerCase().includes(item.name?.toLowerCase() || '') ||
        item.name?.toLowerCase().includes(ap.name.toLowerCase())
      );

      return {
        id: googlePlace?.place_id || aiPlace?.id || `merged-${index}`,
        name: item.name || googlePlace?.name || aiPlace?.name || 'Unknown',
        type: item.type || googlePlace?.types?.[0] || aiPlace?.type || 'establishment',
        rating: item.rating || googlePlace?.rating || aiPlace?.rating || 0,
        address: item.address || googlePlace?.vicinity || aiPlace?.address || '',
        geometry: googlePlace?.geometry || aiPlace?.geometry || {
          location: { lat: 0, lng: 0 },
          viewport: { northeast: { lat: 0, lng: 0 }, southwest: { lat: 0, lng: 0 } }
        },
        photoUrl: aiPlace?.photoUrl || googlePlace?.photos?.[0]?.getUrl?.() || '',
        description: item.description || aiPlace?.description || '',
        isOpen: googlePlace?.opening_hours?.open_now ?? aiPlace?.isOpen ?? true,
        priceLevel: googlePlace?.price_level || aiPlace?.priceLevel || 0,
        confidence: item.confidence || 0.8,
        source: item.source || 'hybrid',
        // Enhanced AI metadata
        aiInsights: item.description || '',
        lastUpdated: new Date().toISOString()
      } as Place & { confidence: number; source: string; aiInsights: string; lastUpdated: string };
    });
  }

  private fallbackMerge(
    googlePlaces: google.maps.places.PlaceResult[],
    aiPlaces: Place[]
  ): Place[] {
    const merged: Place[] = [];
    const usedNames = new Set<string>();

    // Add Google Places first (higher priority)
    googlePlaces.forEach(gp => {
      if (gp.name && !usedNames.has(gp.name.toLowerCase())) {
        usedNames.add(gp.name.toLowerCase());
        merged.push({
          id: gp.place_id || `google-${merged.length}`,
          name: gp.name,
          type: gp.types?.[0] || 'establishment',
          rating: gp.rating || 0,
          address: gp.vicinity || '',
          geometry: gp.geometry || { location: { lat: 0, lng: 0 } },
          photoUrl: gp.photos?.[0]?.getUrl?.() || '',
          isOpen: gp.opening_hours?.open_now ?? true,
          priceLevel: gp.price_level || 0
        } as Place);
      }
    });

    // Add unique AI places
    aiPlaces.forEach(ap => {
      if (!usedNames.has(ap.name.toLowerCase())) {
        usedNames.add(ap.name.toLowerCase());
        merged.push(ap);
      }
    });

    return merged;
  }

  // Get optimized route with AI insights
  async getOptimizedRoute(
    places: Place[],
    origin: { lat: number; lng: number },
    travelMode: 'DRIVING' | 'WALKING' | 'TRANSIT' = 'DRIVING'
  ): Promise<{
    route: google.maps.DirectionsResult;
    aiInsights: string;
    estimatedDuration: string;
    suggestions: string[];
  }> {
    if (!this.directionsService) {
      throw new Error('Directions service not initialized');
    }

    const waypoints = places.slice(0, -1).map(place => ({
      location: new google.maps.LatLng(
        place.geometry!.location.lat,
        place.geometry!.location.lng
      ),
      stopover: true
    }));

    const destination = places[places.length - 1];

    return new Promise((resolve, reject) => {
      this.directionsService!.route({
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(
          destination.geometry!.location.lat,
          destination.geometry!.location.lng
        ),
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode[travelMode]
      }, async (result, status) => {
        if (status === 'OK' && result) {
          // Generate AI insights for the route
          const aiInsights = await this.generateRouteInsights(result, places, travelMode);
          
          resolve({
            route: result,
            aiInsights: aiInsights.insights,
            estimatedDuration: aiInsights.duration,
            suggestions: aiInsights.suggestions
          });
        } else {
          reject(new Error(`${MAPS_ERROR_MESSAGES.DIRECTIONS_FAILED}: ${status}`));
        }
      });
    });
  }

  private async generateRouteInsights(
    route: google.maps.DirectionsResult,
    places: Place[],
    travelMode: string
  ): Promise<{ insights: string; duration: string; suggestions: string[] }> {
    try {
      const totalDistance = route.routes[0]?.legs.reduce((sum, leg) => 
        sum + (leg.distance?.value || 0), 0) || 0;
      const totalDuration = route.routes[0]?.legs.reduce((sum, leg) => 
        sum + (leg.duration?.value || 0), 0) || 0;

      const prompt = `
        Analyze this travel route and provide insights:
        
        Route Details:
        - Travel Mode: ${travelMode}
        - Total Distance: ${(totalDistance / 1000).toFixed(1)}km
        - Total Duration: ${Math.round(totalDuration / 60)}min
        - Number of stops: ${places.length}
        
        Places to visit: ${places.map(p => `${p.name} (${p.type})`).join(', ')}
        
        Provide:
        1. Brief travel insights (2-3 sentences)
        2. Estimated duration with breaks
        3. 3 practical suggestions for the route
        
        Return JSON: {"insights": "", "duration": "", "suggestions": []}
      `;

      const response = await generateContentWithRetry({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      return processResponse(response, 'generateRouteInsights');
    } catch (error) {
      console.error('Route insights generation failed:', error);
      return {
        insights: 'Route optimized for efficient travel between selected places.',
        duration: `${Math.round((route.routes[0]?.legs.reduce((sum, leg) => 
          sum + (leg.duration?.value || 0), 0) || 0) / 60)}min`,
        suggestions: ['Plan for traffic delays', 'Check opening hours', 'Bring water and snacks']
      };
    }
  }

  // Geocoding with AI enhancement
  async enhancedGeocode(address: string): Promise<{
    results: google.maps.GeocoderResult[];
    aiSuggestions: string[];
  }> {
    if (!this.geocoder) {
      throw new Error('Geocoder not initialized');
    }

    return new Promise((resolve, reject) => {
      this.geocoder!.geocode({ address }, async (results, status) => {
        if (status === 'OK' && results) {
          // Get AI suggestions for better search terms
          const aiSuggestions = await this.getLocationSuggestions(address, results);
          resolve({ results, aiSuggestions });
        } else {
          reject(new Error(`${MAPS_ERROR_MESSAGES.GEOCODING_FAILED}: ${status}`));
        }
      });
    });
  }

  private async getLocationSuggestions(
    originalQuery: string,
    results: google.maps.GeocoderResult[]
  ): Promise<string[]> {
    try {
      const prompt = `
        Based on the search query "${originalQuery}" and found locations:
        ${results.map(r => r.formatted_address).slice(0, 3).join(', ')}
        
        Suggest 3 alternative search terms that might help find better results.
        Return as JSON array: ["suggestion1", "suggestion2", "suggestion3"]
      `;

      const response = await generateContentWithRetry({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      return processResponse(response, 'getLocationSuggestions');
    } catch (error) {
      console.error('Location suggestions failed:', error);
      return [];
    }
  }
}

// Export singleton instance
export const googleMapsAI = GoogleMapsAIService.getInstance();
