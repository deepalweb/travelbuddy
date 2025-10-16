import { EnhancedActivity, ActivityType, TransportMode, ActionType } from '../enhancedTypes';
import { Place } from '../types';

class EnhancedPlanningService {
  static generateEnhancedActivities(places: Place[], interests: string): EnhancedActivity[] {
    return places.slice(0, 4).map((place, index) => ({
      id: place.id,
      title: place.name,
      description: place.description || `Explore ${place.name} and discover its unique attractions.`,
      timeSlot: this.getTimeSlot(index),
      estimatedDuration: this.getDuration(place.type),
      type: this.mapToActivityType(place.type),
      location: {
        address: place.address,
        latitude: place.geometry?.location?.lat || 0,
        longitude: place.geometry?.location?.lng || 0
      },
      costInfo: {
        entryFee: this.getEntryCost(place.type),
        currency: '$',
        mealCosts: place.type === 'restaurant' ? { budget: 15, midRange: 30, luxury: 60 } : {},
        transportCost: index === 0 ? 0 : 3,
        paymentMethods: ['Card', 'Cash'],
        hasDiscounts: place.rating > 4.5
      },
      travelInfo: {
        fromPrevious: index === 0 ? 'Starting Point' : 'Previous Location',
        travelTime: index === 0 ? 0 : 15,
        recommendedMode: TransportMode.WALK,
        estimatedCost: index === 0 ? 0 : 3,
        routeInstructions: `Navigate to ${place.name}`,
        isAccessible: true
      },
      contextInfo: {
        crowdLevel: this.getCrowdLevel(place.rating),
        bestTimeToVisit: this.getBestTime(place.type),
        weatherTips: ['Check weather before visiting'],
        localTips: [place.localTip || `Rated ${place.rating}/5 by visitors`],
        safetyAlerts: [],
        isIndoorActivity: this.isIndoor(place.type)
      },
      actionableLinks: [
        {
          title: 'Directions',
          url: `https://maps.google.com/?q=${encodeURIComponent(place.name)}`,
          type: ActionType.MAP
        },
        ...(place.type === 'restaurant' ? [{
          title: 'Reserve',
          url: `https://opentable.com/search?query=${encodeURIComponent(place.name)}`,
          type: ActionType.RESERVATION
        }] : [])
      ]
    }));
  }

  private static getTimeSlot(index: number): string {
    const slots = ['09:00-11:00', '12:30-14:30', '15:30-17:30', '18:00-20:00'];
    return slots[index] || '09:00-11:00';
  }

  private static getDuration(type: string): string {
    if (type.includes('restaurant')) return '1.5 hours';
    if (type.includes('museum')) return '2.5 hours';
    return '2 hours';
  }

  private static mapToActivityType(type: string): ActivityType {
    if (type.includes('restaurant')) return ActivityType.RESTAURANT;
    if (type.includes('museum')) return ActivityType.MUSEUM;
    if (type.includes('park')) return ActivityType.NATURE;
    if (type.includes('shopping')) return ActivityType.SHOPPING;
    return ActivityType.LANDMARK;
  }

  private static getEntryCost(type: string): number {
    if (type.includes('restaurant')) return 25;
    if (type.includes('museum')) return 15;
    if (type.includes('park')) return 0;
    return 12;
  }

  private static getCrowdLevel(rating: number): 'Low' | 'Moderate' | 'High' {
    if (rating > 4.5) return 'High';
    if (rating > 4.0) return 'Moderate';
    return 'Low';
  }

  private static getBestTime(type: string): string {
    if (type.includes('restaurant')) return 'Lunch: 12:00-14:00, Dinner: 19:00-21:00';
    if (type.includes('museum')) return 'Morning: 10:00-12:00 (less crowded)';
    return 'Flexible timing';
  }

  private static isIndoor(type: string): boolean {
    return type.includes('museum') || type.includes('restaurant') || type.includes('shopping');
  }
}

export default EnhancedPlanningService;