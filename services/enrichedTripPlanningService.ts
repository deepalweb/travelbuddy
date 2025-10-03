import { TripPlanSuggestion, DailyTripPlan, ActivityDetail } from '../types';
import { fetchFactualPlaces } from './realPlacesService';

interface EnrichedPlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating: number;
  user_ratings_total: number;
  types: string[];
  geometry: {
    location: { lat: number; lng: number };
  };
  photos?: Array<{ photo_reference: string }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  price_level?: number;
}

interface TripContext {
  destination: string;
  duration: string;
  interests: string;
  pace: string;
  budget: string;
  coordinates: { lat: number; lng: number };
}

export class EnrichedTripPlanningService {
  private static instance: EnrichedTripPlanningService;

  static getInstance(): EnrichedTripPlanningService {
    if (!EnrichedTripPlanningService.instance) {
      EnrichedTripPlanningService.instance = new EnrichedTripPlanningService();
    }
    return EnrichedTripPlanningService.instance;
  }

  async generateEnrichedTripPlan(params: {
    destination: string;
    duration: string;
    interests: string;
    pace: string;
    budget: string;
  }): Promise<TripPlanSuggestion> {
    const coordinates = await this.getDestinationCoordinates(params.destination);
    const context: TripContext = { ...params, coordinates };
    
    const days = this.extractDays(params.duration);
    const realPlaces = await this.fetchRealPlaces(context);
    const dailyPlans = await this.generateRichDailyPlans(realPlaces, days, context);
    
    return {
      id: `enriched_${Date.now()}`,
      tripTitle: `${params.destination} ${params.duration} Adventure`,
      destination: params.destination,
      duration: params.duration,
      introduction: this.generateContextualIntroduction(context, realPlaces),
      dailyPlans,
      conclusion: this.generateSmartConclusion(context, realPlaces),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private async getDestinationCoordinates(destination: string): Promise<{ lat: number; lng: number }> {
    // Use geocoding to get coordinates
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(destination)}`);
      if (response.ok) {
        const data = await response.json();
        return data.location;
      }
    } catch (error) {
      console.warn('Geocoding failed, using fallback coordinates');
    }
    
    // Fallback coordinates for common destinations
    const fallbacks: Record<string, { lat: number; lng: number }> = {
      'jaffna': { lat: 9.6615, lng: 80.0255 },
      'anuradhapura': { lat: 8.3114, lng: 80.4037 },
      'polonnaruwa': { lat: 7.9403, lng: 81.0188 },
      'kandy': { lat: 7.2906, lng: 80.6337 },
      'colombo': { lat: 6.9271, lng: 79.8612 }
    };
    
    const key = destination.toLowerCase().split(',')[0].trim();
    return fallbacks[key] || { lat: 7.8731, lng: 80.7718 }; // Sri Lanka center
  }

  private async fetchRealPlaces(context: TripContext): Promise<EnrichedPlace[]> {
    const { coordinates, interests, budget } = context;
    const categories = this.getSearchCategories(interests);
    const allPlaces: EnrichedPlace[] = [];
    
    // Fetch places for each category
    for (const category of categories) {
      try {
        const places = await fetchFactualPlaces(
          coordinates.lat,
          coordinates.lng,
          category,
          5000 // 5km radius
        ) as EnrichedPlace[];
        
        // Filter by budget and rating
        const filtered = places
          .filter(place => this.matchesBudget(place, budget))
          .filter(place => (place.rating || 0) >= 3.5)
          .slice(0, 8); // Top 8 per category
        
        allPlaces.push(...filtered);
      } catch (error) {
        console.warn(`Failed to fetch ${category} places:`, error);
      }
    }
    
    // Remove duplicates and sort by rating
    const unique = this.removeDuplicatePlaces(allPlaces);
    return unique.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  private getSearchCategories(interests: string): string[] {
    const categories: string[] = [];
    const interestLower = interests.toLowerCase();
    
    if (interestLower.includes('culture') || interestLower.includes('history')) {
      categories.push('museum', 'temple', 'historic site', 'cultural center');
    }
    if (interestLower.includes('food') || interestLower.includes('dining')) {
      categories.push('restaurant', 'local cuisine', 'street food', 'cafe');
    }
    if (interestLower.includes('nature') || interestLower.includes('outdoor')) {
      categories.push('park', 'garden', 'nature reserve', 'scenic viewpoint');
    }
    if (interestLower.includes('shopping')) {
      categories.push('market', 'shopping center', 'local crafts', 'souvenir shop');
    }
    if (interestLower.includes('nightlife') || interestLower.includes('entertainment')) {
      categories.push('bar', 'nightclub', 'live music', 'theater');
    }
    
    // Default categories if no specific interests
    if (categories.length === 0) {
      categories.push('tourist attraction', 'restaurant', 'museum', 'park');
    }
    
    return categories;
  }

  private matchesBudget(place: EnrichedPlace, budget: string): boolean {
    const priceLevel = place.price_level || 2; // Default to moderate
    
    switch (budget.toLowerCase()) {
      case 'budget':
      case 'low':
        return priceLevel <= 2;
      case 'luxury':
      case 'high':
        return priceLevel >= 3;
      case 'moderate':
      case 'medium':
      default:
        return true; // Include all price levels for moderate budget
    }
  }

  private removeDuplicatePlaces(places: EnrichedPlace[]): EnrichedPlace[] {
    const seen = new Set<string>();
    return places.filter(place => {
      const key = `${place.name}_${place.formatted_address}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async generateRichDailyPlans(
    places: EnrichedPlace[],
    days: number,
    context: TripContext
  ): Promise<DailyTripPlan[]> {
    const dailyPlans: DailyTripPlan[] = [];
    const placesPerDay = Math.ceil(places.length / days);
    
    for (let day = 1; day <= days; day++) {
      const dayPlaces = places.slice((day - 1) * placesPerDay, day * placesPerDay);
      const activities = await this.generateEnrichedActivities(dayPlaces, day, context);
      
      dailyPlans.push({
        day,
        title: this.generateDayTitle(dayPlaces, day),
        activities,
        date: this.getDateString(day),
        summary: this.generateDaySummary(dayPlaces),
        dayEstimatedCost: this.calculateRealCost(dayPlaces, context.budget),
        totalWalkingTime: this.calculateWalkingTime(dayPlaces),
        totalTravelTime: this.calculateTravelTime(dayPlaces),
        dailyRecap: this.generateDayRecap(dayPlaces)
      });
    }
    
    return dailyPlans;
  }

  private async generateEnrichedActivities(
    places: EnrichedPlace[],
    day: number,
    context: TripContext
  ): Promise<ActivityDetail[]> {
    const activities: ActivityDetail[] = [];
    const timeSlots = this.getOptimalTimeSlots(context.pace);
    
    for (let i = 0; i < Math.min(places.length, timeSlots.length); i++) {
      const place = places[i];
      const timeSlot = timeSlots[i];
      
      activities.push({
        timeOfDay: timeSlot.period,
        activityTitle: place.name,
        description: await this.generateRichDescription(place, context),
        estimatedDuration: this.getEstimatedDuration(place),
        location: place.formatted_address,
        category: this.getCategoryFromTypes(place.types),
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        googlePlaceId: place.place_id,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        photoThumbnail: place.photos?.[0] ? 
          `/api/places/photo?ref=${place.photos[0].photo_reference}&w=400` : undefined,
        fullAddress: place.formatted_address,
        openingHours: place.opening_hours?.weekday_text,
        isOpenNow: place.opening_hours?.open_now || true,
        estimatedCost: this.getEstimatedCost(place, context.budget),
        practicalTip: this.generatePracticalTip(place),
        tags: this.generateTags(place),
        travelMode: 'walking',
        travelTimeMin: i > 0 ? 15 : 0,
        estimatedVisitDurationMin: this.getVisitDuration(place)
      });
    }
    
    return activities;
  }

  private async generateRichDescription(place: EnrichedPlace, context: TripContext): Promise<string> {
    const rating = place.rating ? `⭐ ${place.rating}` : '';
    const reviews = place.user_ratings_total ? `(${place.user_ratings_total} reviews)` : '';
    const category = this.getCategoryFromTypes(place.types);
    
    return `📍 **${place.name}** ${rating} ${reviews}
🏷️ ${category}

${this.getPlaceDescription(place, context)}

🕒 **Best Time:** ${this.getBestVisitTime(place)}
💰 **Cost:** ${this.getEstimatedCost(place, context.budget)}
⏱️ **Duration:** ${this.getEstimatedDuration(place)}

💡 **Insider Tip:** ${this.generatePracticalTip(place)}

🚶 **Getting There:** ${this.getTravelTip(place)}`;
  }

  private getPlaceDescription(place: EnrichedPlace, context: TripContext): string {
    const type = place.types[0] || 'establishment';
    
    if (type.includes('restaurant') || type.includes('food')) {
      return `Experience authentic local cuisine at this highly-rated dining spot. Perfect for trying traditional ${context.destination} flavors.`;
    }
    if (type.includes('museum') || type.includes('historic')) {
      return `Discover the rich history and culture of ${context.destination} at this fascinating heritage site.`;
    }
    if (type.includes('temple') || type.includes('religious')) {
      return `A sacred site offering spiritual tranquility and architectural beauty. Dress modestly and respect local customs.`;
    }
    if (type.includes('park') || type.includes('nature')) {
      return `Enjoy natural beauty and peaceful surroundings. Great for photos and relaxation.`;
    }
    if (type.includes('market') || type.includes('shopping')) {
      return `Browse local products, handicrafts, and souvenirs. Perfect for experiencing local life and finding unique items.`;
    }
    
    return `A popular local attraction that offers authentic experiences and insights into ${context.destination} culture.`;
  }

  private getBestVisitTime(place: EnrichedPlace): string {
    const type = place.types[0] || 'establishment';
    
    if (type.includes('restaurant')) return 'Lunch (12:00-14:00) or Dinner (18:00-20:00)';
    if (type.includes('temple')) return 'Early morning (6:00-9:00) for peaceful atmosphere';
    if (type.includes('museum')) return 'Morning (9:00-12:00) to avoid crowds';
    if (type.includes('market')) return 'Morning (8:00-11:00) for freshest products';
    if (type.includes('park')) return 'Early morning or late afternoon for best light';
    
    return 'Morning to afternoon (9:00-17:00)';
  }

  private getEstimatedCost(place: EnrichedPlace, budget: string): string {
    const priceLevel = place.price_level || 2;
    const type = place.types[0] || 'establishment';
    
    if (type.includes('restaurant')) {
      switch (priceLevel) {
        case 1: return '$5-10 per person';
        case 2: return '$10-20 per person';
        case 3: return '$20-40 per person';
        case 4: return '$40+ per person';
        default: return '$10-20 per person';
      }
    }
    
    if (type.includes('museum') || type.includes('attraction')) {
      return priceLevel >= 3 ? '$10-15 entrance' : '$3-8 entrance';
    }
    
    if (type.includes('temple') || type.includes('park')) {
      return 'Free (donations welcome)';
    }
    
    return 'Free to $10';
  }

  private getEstimatedDuration(place: EnrichedPlace): string {
    const type = place.types[0] || 'establishment';
    
    if (type.includes('restaurant')) return '1-1.5 hours';
    if (type.includes('museum')) return '1.5-2 hours';
    if (type.includes('temple')) return '45-60 minutes';
    if (type.includes('market')) return '1-2 hours';
    if (type.includes('park')) return '1-3 hours';
    
    return '1-2 hours';
  }

  private getVisitDuration(place: EnrichedPlace): number {
    const type = place.types[0] || 'establishment';
    
    if (type.includes('restaurant')) return 90;
    if (type.includes('museum')) return 120;
    if (type.includes('temple')) return 60;
    if (type.includes('market')) return 90;
    if (type.includes('park')) return 120;
    
    return 90;
  }

  private generatePracticalTip(place: EnrichedPlace): string {
    const type = place.types[0] || 'establishment';
    
    if (type.includes('restaurant')) {
      return 'Try the local specialties and ask for spice level preferences. Cash is often preferred.';
    }
    if (type.includes('temple')) {
      return 'Remove shoes before entering, dress modestly (cover shoulders and knees), and maintain silence.';
    }
    if (type.includes('museum')) {
      return 'Check for guided tour times and photography restrictions. Student discounts may be available.';
    }
    if (type.includes('market')) {
      return 'Bargaining is expected. Bring small bills and keep valuables secure.';
    }
    
    return 'Check opening hours before visiting and bring water, especially during hot weather.';
  }

  private getTravelTip(place: EnrichedPlace): string {
    return 'Tuk-tuk (Rs. 200-500), walking if nearby, or local bus for budget option';
  }

  private generateTags(place: EnrichedPlace): string[] {
    const tags: string[] = [];
    const rating = place.rating || 0;
    
    if (rating >= 4.5) tags.push('Highly Rated');
    if (rating >= 4.0) tags.push('Popular');
    if (place.user_ratings_total && place.user_ratings_total > 500) tags.push('Well Reviewed');
    
    const type = place.types[0] || 'establishment';
    if (type.includes('restaurant')) tags.push('Local Cuisine');
    if (type.includes('temple')) tags.push('Cultural Site');
    if (type.includes('museum')) tags.push('Educational');
    if (type.includes('market')) tags.push('Shopping');
    if (type.includes('park')) tags.push('Nature');
    
    tags.push('Must Visit');
    return tags;
  }

  private getCategoryFromTypes(types: string[]): string {
    const type = types[0] || 'establishment';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getOptimalTimeSlots(pace: string): Array<{period: string, start: string, end: string}> {
    const slots = {
      'relaxed': [
        {period: 'Morning', start: '09:00', end: '10:30'},
        {period: 'Late Morning', start: '11:00', end: '12:30'},
        {period: 'Afternoon', start: '14:30', end: '16:00'},
        {period: 'Evening', start: '17:00', end: '18:30'}
      ],
      'moderate': [
        {period: 'Morning', start: '08:30', end: '10:00'},
        {period: 'Late Morning', start: '10:30', end: '12:00'},
        {period: 'Afternoon', start: '13:30', end: '15:00'},
        {period: 'Late Afternoon', start: '15:30', end: '17:00'},
        {period: 'Evening', start: '17:30', end: '19:00'}
      ],
      'fast-paced': [
        {period: 'Early Morning', start: '08:00', end: '09:30'},
        {period: 'Morning', start: '10:00', end: '11:30'},
        {period: 'Late Morning', start: '12:00', end: '13:30'},
        {period: 'Afternoon', start: '14:30', end: '16:00'},
        {period: 'Late Afternoon', start: '16:30', end: '18:00'},
        {period: 'Evening', start: '18:30', end: '20:00'}
      ]
    };
    
    return slots[pace.toLowerCase() as keyof typeof slots] || slots.moderate;
  }

  private generateContextualIntroduction(context: TripContext, places: EnrichedPlace[]): string {
    const topRated = places.filter(p => (p.rating || 0) >= 4.5).length;
    const restaurants = places.filter(p => p.types.some(t => t.includes('restaurant'))).length;
    const attractions = places.filter(p => p.types.some(t => t.includes('tourist_attraction') || t.includes('museum'))).length;
    
    return `🌟 **Welcome to your ${context.destination} adventure!**

We've crafted this ${context.duration} itinerary using real places and current data to give you authentic, memorable experiences.

**What makes this special:**
• ${topRated} highly-rated venues (4.5+ stars)
• ${restaurants} authentic dining experiences
• ${attractions} must-see attractions and cultural sites
• Real-time ratings and reviews from ${places.reduce((sum, p) => sum + (p.user_ratings_total || 0), 0).toLocaleString()} travelers

**Your itinerary includes:**
✨ Hand-picked locations based on current ratings
🍽️ Local restaurants loved by both tourists and locals  
📍 Exact addresses and Google Maps integration
💰 Real cost estimates based on current prices
⏰ Optimal timing to avoid crowds and catch the best moments

This isn't just a list of places – it's your guide to experiencing ${context.destination} like a local, with insider tips and practical advice for each stop.`;
  }

  private generateSmartConclusion(context: TripContext, places: EnrichedPlace[]): string {
    const avgRating = places.reduce((sum, p) => sum + (p.rating || 0), 0) / places.length;
    
    return `🎯 **Your ${context.destination} Adventure Awaits!**

You're all set with ${places.length} carefully selected experiences, averaging ${avgRating.toFixed(1)} stars from real travelers.

**Before you go:**
• Download Google Maps offline for ${context.destination}
• Check opening hours as they may change seasonally
• Bring small bills for local markets and tuk-tuks
• Respect local customs, especially at religious sites

**Pro Tips:**
• Use the Google Place IDs provided to get directions
• Ask locals for their favorite spots – they love sharing hidden gems
• Try street food from busy stalls (high turnover = fresh food)
• Learn basic Sinhala greetings – locals appreciate the effort!

Have an incredible journey! 🌟`;
  }

  private generateDayTitle(places: EnrichedPlace[], day: number): string {
    const types = places.map(p => p.types[0] || 'establishment');
    
    if (types.some(t => t.includes('temple') || t.includes('historic'))) {
      return `Day ${day}: Cultural Heritage & Sacred Sites`;
    }
    if (types.some(t => t.includes('restaurant') || t.includes('food'))) {
      return `Day ${day}: Culinary Discovery & Local Flavors`;
    }
    if (types.some(t => t.includes('market') || t.includes('shopping'))) {
      return `Day ${day}: Markets & Local Life`;
    }
    if (types.some(t => t.includes('park') || t.includes('nature'))) {
      return `Day ${day}: Nature & Scenic Beauty`;
    }
    
    return `Day ${day}: Local Highlights & Hidden Gems`;
  }

  private generateDaySummary(places: EnrichedPlace[]): string {
    const avgRating = places.reduce((sum, p) => sum + (p.rating || 0), 0) / places.length;
    return `Explore ${places.length} top-rated locations (avg ${avgRating.toFixed(1)}★) with authentic local experiences`;
  }

  private generateDayRecap(places: EnrichedPlace[]): string {
    const names = places.slice(0, 3).map(p => p.name).join(', ');
    const more = places.length > 3 ? ` and ${places.length - 3} more amazing spots` : '';
    return `Today's highlights include ${names}${more} – each chosen for their authentic local character and excellent reviews.`;
  }

  private calculateRealCost(places: EnrichedPlace[], budget: string): string {
    let total = 0;
    
    places.forEach(place => {
      const priceLevel = place.price_level || 2;
      const type = place.types[0] || 'establishment';
      
      if (type.includes('restaurant')) {
        total += priceLevel * 8; // $8-32 per restaurant
      } else if (type.includes('museum') || type.includes('attraction')) {
        total += priceLevel >= 3 ? 12 : 5; // $5-12 entrance fees
      }
      // Free attractions don't add to cost
    });
    
    const transport = places.length * 3; // $3 average transport per place
    const misc = 10; // Miscellaneous expenses
    
    return `$${total + transport + misc}-${Math.round((total + transport + misc) * 1.5)}`;
  }

  private calculateWalkingTime(places: EnrichedPlace[]): string {
    return `${places.length * 15} minutes`; // 15 min average walking between places
  }

  private calculateTravelTime(places: EnrichedPlace[]): string {
    return `${Math.round(places.length * 0.5)} hours`; // 30 min average travel time per place
  }

  private extractDays(duration: string): number {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3;
  }

  private getDateString(day: number): string {
    const date = new Date();
    date.setDate(date.getDate() + day - 1);
    return date.toLocaleDateString();
  }
}

export const enrichedTripPlanningService = EnrichedTripPlanningService.getInstance();