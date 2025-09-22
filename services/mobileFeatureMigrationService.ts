import { EnhancedActivity, ActivityType, TransportMode, ActionType } from '../enhancedTypes';

class MobileFeatureMigrationService {
  // Migrate mobile mood-based recommendations to web
  static getMoodRecommendations(mood: string, userLocation?: { latitude: number; longitude: number }) {
    const recommendations = {
      adventurous: [
        { title: 'Hidden Waterfall Hike', time: '3h', cost: 'Free', emoji: '🏞️', type: 'nature' },
        { title: 'Urban Exploration Tour', time: '2h', cost: '$25', emoji: '🏙️', type: 'culture' },
        { title: 'Kayak Adventure', time: '4h', cost: '$45', emoji: '🚣', type: 'adventure' }
      ],
      relaxed: [
        { title: 'Botanical Garden Visit', time: '2h', cost: '$12', emoji: '🌺', type: 'nature' },
        { title: 'Spa & Wellness Center', time: '3h', cost: '$80', emoji: '🧘', type: 'wellness' },
        { title: 'Sunset Beach Walk', time: '1h', cost: 'Free', emoji: '🌅', type: 'nature' }
      ],
      cultural: [
        { title: 'Art Museum Tour', time: '3h', cost: '$18', emoji: '🖼️', type: 'culture' },
        { title: 'Historical Walking Tour', time: '2.5h', cost: '$20', emoji: '🏛️', type: 'culture' },
        { title: 'Local Theater Show', time: '2h', cost: '$35', emoji: '🎭', type: 'entertainment' }
      ],
      foodie: [
        { title: 'Food Market Tour', time: '2h', cost: '$30', emoji: '🍜', type: 'food' },
        { title: 'Cooking Class', time: '3h', cost: '$65', emoji: '👨‍🍳', type: 'food' },
        { title: 'Wine Tasting', time: '2h', cost: '$40', emoji: '🍷', type: 'food' }
      ],
      social: [
        { title: 'Community Event', time: '3h', cost: 'Free', emoji: '🎪', type: 'social' },
        { title: 'Group City Tour', time: '4h', cost: '$28', emoji: '🚌', type: 'culture' },
        { title: 'Social Dancing Class', time: '1.5h', cost: '$15', emoji: '💃', type: 'entertainment' }
      ]
    };
    
    return recommendations[mood as keyof typeof recommendations] || recommendations.adventurous;
  }

  // Migrate mobile local events to web
  static getLocalEvents(userLocation?: { latitude: number; longitude: number }) {
    return [
      { id: '1', title: 'Street Art Festival', location: 'Downtown', time: 'Today 2-6 PM', emoji: '🎨', category: 'Culture' },
      { id: '2', title: 'Food Truck Rally', location: 'Central Park', time: 'Tonight 6-10 PM', emoji: '🚚', category: 'Food' },
      { id: '3', title: 'Live Jazz Music', location: 'Blue Note Café', time: 'Tonight 8 PM', emoji: '🎷', category: 'Music' }
    ];
  }

  // Migrate mobile travel companion features
  static getTravelCompanionSuggestions(activities: EnhancedActivity[]) {
    return {
      moodSuggestions: activities.map(activity => ({
        id: activity.id,
        name: activity.title,
        type: activity.type,
        emoji: this.getActivityEmoji(activity.type),
        rating: 4.5,
        distance: '0.5km',
        tags: [activity.type, 'popular'],
        whyRecommended: `Perfect for your ${activity.type} interests`
      })),
      pairingCards: [
        {
          id: '1',
          title: 'Perfect Morning Combo',
          description: 'Start with coffee, then explore',
          items: [
            { name: 'Local Café', type: 'food', emoji: '☕', time: '9:00 AM' },
            { name: 'Museum Visit', type: 'culture', emoji: '🏛️', time: '10:30 AM' }
          ],
          duration: '3 hours',
          emoji: '🌅'
        }
      ]
    };
  }

  // Migrate mobile gamification features
  static getMiniChallenges() {
    const challenges = [
      {
        title: 'Street Art Hunter',
        description: 'Find the secret alley with wall art → snap a pic',
        reward: 'Explorer badge',
        emoji: '🎨',
        difficulty: 'easy'
      },
      {
        title: 'Local Taste Test',
        description: 'Try 3 local snacks under $5 today',
        reward: 'Foodie badge',
        emoji: '🍽️',
        difficulty: 'medium'
      },
      {
        title: 'Temple Bell Quest',
        description: 'Find and ring the ancient temple bell',
        reward: 'Culture Seeker badge',
        emoji: '🔔',
        difficulty: 'hard'
      }
    ];
    
    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  // Migrate mobile contextual recommendations
  static getContextualRecommendations(timeOfDay: string, weather: string) {
    const recommendations = {
      morning: {
        sunny: ['Outdoor café breakfast', 'Morning hike', 'Farmers market'],
        rainy: ['Museum visit', 'Indoor café', 'Shopping mall'],
        cloudy: ['City walking tour', 'Art gallery', 'Local market']
      },
      afternoon: {
        sunny: ['Park picnic', 'Outdoor activities', 'Beach visit'],
        rainy: ['Indoor attractions', 'Shopping', 'Movie theater'],
        cloudy: ['City exploration', 'Cultural sites', 'Food tour']
      },
      evening: {
        sunny: ['Sunset viewpoint', 'Outdoor dining', 'Evening walk'],
        rainy: ['Indoor restaurant', 'Bar/pub', 'Entertainment venue'],
        cloudy: ['Local restaurant', 'Cultural show', 'Night market']
      }
    };

    return recommendations[timeOfDay as keyof typeof recommendations]?.[weather as keyof typeof recommendations.morning] || 
           recommendations.afternoon.sunny;
  }

  private static getActivityEmoji(type: ActivityType): string {
    const emojiMap = {
      [ActivityType.LANDMARK]: '🏛️',
      [ActivityType.RESTAURANT]: '🍽️',
      [ActivityType.MUSEUM]: '🎨',
      [ActivityType.NATURE]: '🌳',
      [ActivityType.SHOPPING]: '🛍️',
      [ActivityType.ENTERTAINMENT]: '🎭'
    };
    return emojiMap[type] || '📍';
  }

  // Migrate mobile route optimization
  static optimizeActivityRoute(activities: EnhancedActivity[]): EnhancedActivity[] {
    // Simple optimization: sort by location proximity
    if (activities.length <= 1) return activities;

    const optimized = [...activities];
    optimized.sort((a, b) => {
      // Simple distance calculation (in real implementation, use proper distance calculation)
      const distanceA = Math.sqrt(a.location.latitude ** 2 + a.location.longitude ** 2);
      const distanceB = Math.sqrt(b.location.latitude ** 2 + b.location.longitude ** 2);
      return distanceA - distanceB;
    });

    return optimized;
  }

  // Migrate mobile cost optimization
  static optimizeCosts(activities: EnhancedActivity[], budget: number): {
    optimizedActivities: EnhancedActivity[];
    totalCost: number;
    savings: number;
  } {
    let totalCost = 0;
    const optimizedActivities = activities.map(activity => {
      const currentCost = activity.costInfo.entryFee + activity.costInfo.transportCost;
      totalCost += currentCost;
      
      // Apply discounts if available
      if (activity.costInfo.hasDiscounts) {
        const discountedCost = currentCost * 0.9; // 10% discount
        return {
          ...activity,
          costInfo: {
            ...activity.costInfo,
            entryFee: activity.costInfo.entryFee * 0.9
          }
        };
      }
      
      return activity;
    });

    const originalCost = activities.reduce((sum, a) => sum + a.costInfo.entryFee + a.costInfo.transportCost, 0);
    const savings = originalCost - totalCost;

    return {
      optimizedActivities,
      totalCost,
      savings
    };
  }
}

export default MobileFeatureMigrationService;