import { PersonalizedSuggestion } from './personalizedSuggestionsService';

interface FriendActivity {
  friendName: string;
  placeName: string;
  action: 'visited' | 'liked' | 'reviewed';
  timestamp: Date;
}

interface CommunityRating {
  placeId: string;
  averageRating: number;
  reviewCount: number;
  recentReviews: string[];
}

interface TrendingPlace {
  placeId: string;
  placeName: string;
  trendScore: number;
  weeklyVisits: number;
}

class SocialIntegrationService {
  private static instance: SocialIntegrationService;

  static getInstance(): SocialIntegrationService {
    if (!SocialIntegrationService.instance) {
      SocialIntegrationService.instance = new SocialIntegrationService();
    }
    return SocialIntegrationService.instance;
  }

  // Mock friend activities (would come from backend in real app)
  getFriendActivities(): FriendActivity[] {
    return [
      {
        friendName: 'Sarah',
        placeName: 'Blue Bottle Coffee',
        action: 'visited',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        friendName: 'Mike',
        placeName: 'Central Park',
        action: 'liked',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      },
      {
        friendName: 'Emma',
        placeName: 'Local Art Gallery',
        action: 'reviewed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];
  }

  // Mock community ratings (would come from backend)
  getCommunityRatings(): CommunityRating[] {
    return [
      {
        placeId: 'place_1',
        averageRating: 4.7,
        reviewCount: 234,
        recentReviews: ['Amazing coffee!', 'Great atmosphere', 'Must visit']
      },
      {
        placeId: 'place_2',
        averageRating: 4.3,
        reviewCount: 156,
        recentReviews: ['Beautiful views', 'Perfect for photos', 'Peaceful spot']
      }
    ];
  }

  // Mock trending places (would be calculated from user activity)
  getTrendingPlaces(): TrendingPlace[] {
    return [
      {
        placeId: 'trending_1',
        placeName: 'Rooftop Bar Downtown',
        trendScore: 95,
        weeklyVisits: 1250
      },
      {
        placeId: 'trending_2',
        placeName: 'New Food Market',
        trendScore: 88,
        weeklyVisits: 890
      },
      {
        placeId: 'trending_3',
        placeName: 'Pop-up Art Exhibition',
        trendScore: 82,
        weeklyVisits: 670
      }
    ];
  }

  // Enhance suggestions with social data
  enhanceSuggestionsWithSocialData(suggestions: PersonalizedSuggestion[]): PersonalizedSuggestion[] {
    const friendActivities = this.getFriendActivities();
    const communityRatings = this.getCommunityRatings();
    const trendingPlaces = this.getTrendingPlaces();

    return suggestions.map(suggestion => {
      // Check for friend activity
      const friendActivity = friendActivities.find(activity => 
        activity.placeName.toLowerCase().includes(suggestion.name.toLowerCase())
      );

      // Check for community rating
      const communityRating = communityRatings.find(rating => 
        rating.placeId === suggestion.id
      );

      // Check if trending
      const isTrending = trendingPlaces.some(trending => 
        trending.placeName.toLowerCase().includes(suggestion.name.toLowerCase())
      );

      return {
        ...suggestion,
        socialData: {
          friendActivity: friendActivity ? `${friendActivity.friendName} ${friendActivity.action} this place` : undefined,
          communityRating: communityRating ? {
            rating: communityRating.averageRating,
            reviewCount: communityRating.reviewCount
          } : undefined,
          isTrending,
          trendingLabel: isTrending ? 'Popular this week' : undefined
        }
      };
    });
  }

  // Track user interaction (would sync with backend)
  trackUserInteraction(placeId: string, action: 'like' | 'pass' | 'visit') {
    console.log(`User ${action}d place: ${placeId}`);
    // In real app, this would send to backend for analytics
  }
}

export const socialIntegrationService = SocialIntegrationService.getInstance();
export type { FriendActivity, CommunityRating, TrendingPlace };