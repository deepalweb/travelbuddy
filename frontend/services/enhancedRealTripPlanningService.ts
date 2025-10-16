import { TripPlanSuggestion, DailyTripPlan, ActivityDetail } from '../types';
import { realTimeDataService } from './realTimeDataService';

interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating: number;
  user_ratings_total: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photos?: Array<{ photo_reference: string }>;
  types: string[];
  geometry: {
    location: { lat: number; lng: number };
  };
}

interface WeatherData {
  temperature: number;
  condition: string;
  precipitation: number;
}

export class EnhancedRealTripPlanningService {
  private static instance: EnhancedRealTripPlanningService;
  private googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  static getInstance(): EnhancedRealTripPlanningService {
    if (!EnhancedRealTripPlanningService.instance) {
      EnhancedRealTripPlanningService.instance = new EnhancedRealTripPlanningService();
    }
    return EnhancedRealTripPlanningService.instance;
  }

  async generatePersonalizedTripPlan(params: {
    destination: string;
    duration: string;
    interests: string;
    pace: string;
    budget: string;
    groupType?: string;
    startDate?: string;
  }): Promise<TripPlanSuggestion> {
    const { destination, duration, interests, pace, budget, groupType, startDate } = params;
    
    // Extract number of days
    const days = this.extractDays(duration);
    
    // Get real places based on interests
    const places = await this.getRealPlaces(destination, interests, budget, days * 3);
    
    // Get weather data
    const weather = await this.getWeatherData(destination, startDate);
    
    // Generate personalized daily plans
    const dailyPlans = await this.generateDailyPlans(places, days, pace, weather, groupType);
    
    return {
      id: `enhanced_${Date.now()}`,
      tripTitle: `${destination} ${duration} ${this.getTripTheme(interests)}`,
      destination,
      duration,
      introduction: this.generatePersonalizedIntro(destination, interests, groupType, weather),
      dailyPlans,
      conclusion: `Enjoy your personalized ${destination} adventure!`,
      totalEstimatedCost: this.calculateTotalCost(dailyPlans),
      estimatedWalkingDistance: this.calculateWalkingDistance(dailyPlans),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private async getRealPlaces(destination: string, interests: string, budget: string, count: number): Promise<GooglePlace[]> {
    const placeTypes = this.mapInterestsToPlaceTypes(interests);
    const places: GooglePlace[] = [];
    
    for (const type of placeTypes) {
      try {
        const searchResults = await this.searchGooglePlaces(destination, type, budget);
        places.push(...searchResults.slice(0, Math.ceil(count / placeTypes.length)));
      } catch (error) {
        console.warn(`Failed to fetch ${type} places:`, error);
        // Add fallback realistic places
        places.push(...this.getFallbackPlaces(destination, type));
      }
    }
    
    return places.slice(0, count);
  }

  private async searchGooglePlaces(destination: string, type: string, budget: string): Promise<GooglePlace[]> {
    const maxPrice = this.getBudgetPriceLevel(budget);
    const query = `${type} in ${destination}`;
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.googleApiKey}&fields=place_id,name,formatted_address,rating,user_ratings_total,price_level,opening_hours,photos,types,geometry`
    );
    
    if (!response.ok) throw new Error('Google Places API failed');
    
    const data = await response.json();
    return data.results
      .filter((place: any) => !place.price_level || place.price_level <= maxPrice)
      .slice(0, 10);
  }

  private mapInterestsToPlaceTypes(interests: string): string[] {
    const interestMap: Record<string, string[]> = {
      'museum': ['museum', 'art_gallery'],
      'food': ['restaurant', 'cafe', 'bakery'],
      'shopping': ['shopping_mall', 'store'],
      'nature': ['park', 'zoo', 'aquarium'],
      'culture': ['tourist_attraction', 'place_of_worship'],
      'nightlife': ['night_club', 'bar'],
      'history': ['museum', 'tourist_attraction'],
      'art': ['art_gallery', 'museum'],
      'architecture': ['tourist_attraction', 'place_of_worship']
    };
    
    const types = new Set<string>();
    const lowerInterests = interests.toLowerCase();
    
    Object.entries(interestMap).forEach(([key, values]) => {
      if (lowerInterests.includes(key)) {
        values.forEach(type => types.add(type));
      }
    });
    
    // Default types if no matches
    if (types.size === 0) {
      return ['tourist_attraction', 'restaurant', 'park'];
    }
    
    return Array.from(types);
  }

  private getBudgetPriceLevel(budget: string): number {
    switch (budget.toLowerCase()) {
      case 'budget-friendly': return 1;
      case 'mid-range': return 2;
      case 'luxury': return 4;
      default: return 2;
    }
  }

  private async getWeatherData(destination: string, startDate?: string): Promise<WeatherData> {
    // Mock weather data - replace with real weather API
    return {
      temperature: 22,
      condition: 'sunny',
      precipitation: 10
    };
  }

  private async generateDailyPlans(places: GooglePlace[], days: number, pace: string, weather: WeatherData, groupType?: string): Promise<DailyTripPlan[]> {
    const placesPerDay = Math.ceil(places.length / days);
    const dailyPlans: DailyTripPlan[] = [];
    
    for (let day = 1; day <= days; day++) {
      const dayPlaces = places.slice((day - 1) * placesPerDay, day * placesPerDay);
      const activities = await this.generateActivitiesFromPlaces(dayPlaces, pace, weather, groupType);
      
      dailyPlans.push({
        day,
        title: `${this.getDayTheme(dayPlaces)} Day`,
        theme: this.getDayTheme(dayPlaces),
        activities,
        dayEstimatedCost: this.calculateDayCost(activities),
        dayWalkingDistance: this.calculateDayWalking(activities),
        date: this.getDateString(day),
        summary: this.generateDaySummary(dayPlaces),
        totalWalkingTime: this.calculateWalkingTime(activities),
        totalTravelTime: this.calculateTravelTime(activities),
        dailyRecap: this.generateDayRecap(dayPlaces)
      });
    }
    
    return dailyPlans;
  }

  private async generateActivitiesFromPlaces(places: GooglePlace[], pace: string, weather: WeatherData, groupType?: string): Promise<ActivityDetail[]> {
    const activities: ActivityDetail[] = [];
    const timeSlots = this.getTimeSlots(pace);
    
    for (let index = 0; index < places.length && index < timeSlots.length; index++) {
      const place = places[index];
      const timeSlot = timeSlots[index];
      
      // Get real-time data for each place
      const placeDetails = await realTimeDataService.getPlaceDetails(place.place_id);
      const crowdLevel = await realTimeDataService.getCrowdLevel(place.place_id);
      const waitTime = await realTimeDataService.getWaitTime(place.place_id);
      
      activities.push({
        timeOfDay: timeSlot.time,
        activityTitle: place.name,
        description: this.generateEnhancedActivityDescription(place, placeDetails, weather, groupType, crowdLevel, waitTime),
        estimatedDuration: timeSlot.duration,
        location: place.formatted_address,
        category: this.getCategoryFromTypes(place.types),
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        googlePlaceId: place.place_id,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        estimatedCost: this.getPlaceCost(place),
        fullAddress: place.formatted_address,
        openingHours: placeDetails.openingHours.join(', ') || 'Check locally',
        isOpenNow: placeDetails.isOpenNow,
        weatherNote: this.getWeatherNote(place, weather),
        tags: this.generateEnhancedPlaceTags(place, placeDetails, crowdLevel),
        practicalTip: this.generateEnhancedPracticalTip(place, placeDetails, groupType, crowdLevel),
        travelMode: 'walking',
        travelTimeMin: index > 0 ? 15 : 0,
        estimatedVisitDurationMin: this.getVisitDuration(place.types),
        crowdLevel: crowdLevel,
        photoThumbnail: placeDetails.photos[0] || undefined
      });
    }
    
    return activities;
  }

  private getTimeSlots(pace: string): Array<{time: string, start: string, end: string, duration: string}> {
    const slots = {
      'relaxed': [
        {time: '10:00-12:00', start: '10:00', end: '12:00', duration: '2 hours'},
        {time: '14:00-16:00', start: '14:00', end: '16:00', duration: '2 hours'},
        {time: '18:00-20:00', start: '18:00', end: '20:00', duration: '2 hours'}
      ],
      'moderate': [
        {time: '09:00-11:30', start: '09:00', end: '11:30', duration: '2.5 hours'},
        {time: '13:00-15:30', start: '13:00', end: '15:30', duration: '2.5 hours'},
        {time: '17:00-19:00', start: '17:00', end: '19:00', duration: '2 hours'},
        {time: '20:00-21:30', start: '20:00', end: '21:30', duration: '1.5 hours'}
      ],
      'fast-paced': [
        {time: '08:00-10:00', start: '08:00', end: '10:00', duration: '2 hours'},
        {time: '10:30-12:30', start: '10:30', end: '12:30', duration: '2 hours'},
        {time: '14:00-16:00', start: '14:00', end: '16:00', duration: '2 hours'},
        {time: '17:00-19:00', start: '17:00', end: '19:00', duration: '2 hours'},
        {time: '20:00-22:00', start: '20:00', end: '22:00', duration: '2 hours'}
      ]
    };
    
    return slots[pace.toLowerCase() as keyof typeof slots] || slots.moderate;
  }

  private generateEnhancedActivityDescription(place: GooglePlace, placeDetails: any, weather: WeatherData, groupType?: string, crowdLevel?: string, waitTime?: number): string {
    const baseDesc = this.getPlaceDescription(place);
    const weatherAdj = weather.condition === 'rainy' ? ' Indoor venue perfect for rainy weather.' : '';
    const groupAdj = groupType === 'family' ? ' Family-friendly with facilities for children.' : 
                     groupType === 'couple' ? ' Romantic atmosphere perfect for couples.' : '';
    const crowdAdj = crowdLevel === 'Very Busy' ? ` Currently ${crowdLevel.toLowerCase()} - consider visiting earlier.` : '';
    const waitAdj = waitTime && waitTime > 20 ? ` Expected wait time: ${waitTime} minutes.` : '';
    const reviewAdj = placeDetails.reviews?.length > 0 ? ` Recent visitors say: "${placeDetails.reviews[0].text.substring(0, 100)}..."` : '';
    
    return `${baseDesc}${weatherAdj}${groupAdj}${crowdAdj}${waitAdj}${reviewAdj}`;
  }

  private getPlaceDescription(place: GooglePlace): string {
    const type = place.types[0];
    const rating = place.rating ? ` Highly rated (${place.rating}⭐)` : '';
    
    const descriptions: Record<string, string> = {
      'tourist_attraction': `Iconic ${place.name} - must-see landmark.${rating}`,
      'museum': `Explore ${place.name} with fascinating exhibits.${rating}`,
      'restaurant': `Dine at ${place.name} for authentic local cuisine.${rating}`,
      'park': `Relax at ${place.name} - beautiful outdoor space.${rating}`,
      'shopping_mall': `Shop at ${place.name} for local goods and souvenirs.${rating}`,
      'art_gallery': `Discover art at ${place.name}.${rating}`
    };
    
    return descriptions[type] || `Visit ${place.name}.${rating}`;
  }

  private getFallbackPlaces(destination: string, type: string): GooglePlace[] {
    // Realistic fallback data for major cities
    const fallbackData: Record<string, Record<string, GooglePlace[]>> = {
      'paris': {
        'tourist_attraction': [{
          place_id: 'fallback_1',
          name: 'Eiffel Tower',
          formatted_address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
          rating: 4.6,
          user_ratings_total: 284000,
          price_level: 2,
          types: ['tourist_attraction'],
          geometry: { location: { lat: 48.8584, lng: 2.2945 } }
        }],
        'restaurant': [{
          place_id: 'fallback_2',
          name: 'Le Comptoir du Relais',
          formatted_address: '9 Carrefour de l\'Odéon, 75006 Paris, France',
          rating: 4.2,
          user_ratings_total: 1200,
          price_level: 2,
          types: ['restaurant'],
          geometry: { location: { lat: 48.8506, lng: 2.3387 } }
        }]
      }
    };
    
    const cityData = fallbackData[destination.toLowerCase()];
    return cityData?.[type] || [];
  }

  private extractDays(duration: string): number {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3;
  }

  private getTripTheme(interests: string): string {
    if (interests.includes('food')) return 'Culinary Journey';
    if (interests.includes('culture')) return 'Cultural Discovery';
    if (interests.includes('nature')) return 'Nature Escape';
    if (interests.includes('art')) return 'Art & Culture';
    return 'Adventure';
  }

  private generatePersonalizedIntro(destination: string, interests: string, groupType?: string, weather?: WeatherData): string {
    const group = groupType ? ` perfect for ${groupType} travelers` : '';
    const weatherNote = weather?.condition === 'rainy' ? ' with indoor alternatives for rainy days' : '';
    
    return `Discover ${destination} through a personalized ${interests} experience${group}. This itinerary features hand-picked venues based on your interests${weatherNote}.`;
  }

  private calculateTotalCost(dailyPlans: DailyTripPlan[]): string {
    const total = dailyPlans.reduce((sum, day) => {
      const dayTotal = day.activities.reduce((daySum, activity) => {
        const cost = parseInt(activity.estimatedCost.replace(/[€$]/g, '')) || 0;
        return daySum + cost;
      }, 0);
      return sum + dayTotal;
    }, 0);
    
    return `€${total}`;
  }

  private calculateWalkingDistance(dailyPlans: DailyTripPlan[]): string {
    const totalKm = dailyPlans.length * 2.5; // Estimate 2.5km per day
    return `${totalKm.toFixed(1)} km`;
  }

  private getDayTheme(places: GooglePlace[]): string {
    const types = places.flatMap(p => p.types);
    if (types.includes('museum') || types.includes('art_gallery')) return 'Culture & Art';
    if (types.includes('restaurant') || types.includes('cafe')) return 'Food & Dining';
    if (types.includes('park') || types.includes('zoo')) return 'Nature & Outdoors';
    if (types.includes('shopping_mall')) return 'Shopping & Leisure';
    return 'Exploration';
  }

  private getCategoryFromTypes(types: string[]): string {
    const categoryMap: Record<string, string> = {
      'tourist_attraction': 'landmark',
      'museum': 'culture',
      'restaurant': 'food',
      'park': 'nature',
      'shopping_mall': 'shopping'
    };
    
    for (const type of types) {
      if (categoryMap[type]) return categoryMap[type];
    }
    return 'other';
  }

  private getPlaceCost(place: GooglePlace): string {
    const priceLevel = place.price_level || 2;
    const costs = ['Free', '€5-15', '€15-30', '€30-60', '€60+'];
    return costs[priceLevel] || '€15-30';
  }

  private getWeatherNote(place: GooglePlace, weather: WeatherData): string {
    if (weather.condition === 'rainy' && place.types.includes('park')) {
      return 'Consider indoor alternative if raining';
    }
    if (weather.temperature > 30 && !place.types.includes('museum')) {
      return 'Visit early morning or evening during hot weather';
    }
    return '';
  }

  private generateEnhancedPlaceTags(place: GooglePlace, placeDetails: any, crowdLevel?: string): string[] {
    const tags = [];
    if (place.rating >= 4.5) tags.push('Highly Rated');
    if (place.user_ratings_total > 1000) tags.push('Popular');
    if (place.price_level === 1) tags.push('Budget-Friendly');
    if (placeDetails.isOpenNow) tags.push('Open Now');
    if (crowdLevel === 'Quiet') tags.push('Less Crowded');
    if (crowdLevel === 'Very Busy') tags.push('Peak Hours');
    if (placeDetails.photos?.length > 0) tags.push('Photo Worthy');
    return tags;
  }

  private generateEnhancedPracticalTip(place: GooglePlace, placeDetails: any, groupType?: string, crowdLevel?: string): string {
    const tips = [];
    
    if (crowdLevel === 'Very Busy') {
      tips.push('Visit early morning or late afternoon to avoid crowds');
    }
    
    if (placeDetails.currentWaitTime > 15) {
      tips.push('Book tickets online to skip queues');
    }
    
    if (place.types.includes('restaurant')) {
      tips.push('Make reservations in advance for dinner');
    }
    
    if (groupType === 'family') {
      tips.push('Family facilities and child-friendly amenities available');
    }
    
    if (place.types.includes('museum')) {
      tips.push('Audio guides available for enhanced experience');
    }
    
    return tips.length > 0 ? tips[0] : 'Check opening hours before visiting';
  }

  private getVisitDuration(types: string[]): number {
    if (types.includes('museum')) return 120;
    if (types.includes('restaurant')) return 90;
    if (types.includes('park')) return 60;
    if (types.includes('tourist_attraction')) return 90;
    return 60;
  }

  private calculateDayCost(activities: ActivityDetail[]): string {
    const total = activities.reduce((sum, activity) => {
      const cost = parseInt(activity.estimatedCost.replace(/[€$]/g, '')) || 0;
      return sum + cost;
    }, 0);
    return `€${total}`;
  }

  private calculateDayWalking(activities: ActivityDetail[]): string {
    return `${(activities.length * 0.8).toFixed(1)} km`;
  }

  private getDateString(day: number): string {
    const date = new Date();
    date.setDate(date.getDate() + day - 1);
    return date.toLocaleDateString();
  }

  private generateDaySummary(places: GooglePlace[]): string {
    const themes = places.map(p => this.getCategoryFromTypes(p.types));
    const uniqueThemes = [...new Set(themes)];
    return `A day of ${uniqueThemes.join(' and ')} exploration`;
  }

  private calculateWalkingTime(activities: ActivityDetail[]): string {
    const totalMinutes = activities.reduce((sum, activity) => sum + (activity.travelTimeMin || 0), 0);
    return `${totalMinutes} min`;
  }

  private calculateTravelTime(activities: ActivityDetail[]): string {
    return this.calculateWalkingTime(activities);
  }

  private generateDayRecap(places: GooglePlace[]): string {
    return `Visited ${places.length} amazing places with great reviews and local flavor.`;
  }
}

export const enhancedRealTripPlanningService = EnhancedRealTripPlanningService.getInstance();