import { authApiService } from './authApiService'
import { placesApiService } from './placesApiService'
import { tripsApiService } from './tripsApiService'
import { userApiService } from './userApiService'
import { communityApiService } from './communityApiService'
import { subscriptionService } from './subscriptionService'

// Unified API service for backward compatibility
export const apiService = {
  // Auth
  ...authApiService,
  
  // Places
  ...placesApiService,
  
  // Trips
  ...tripsApiService,
  getTrips: () => tripsApiService.getUserTrips(),
  
  // User
  ...userApiService,
  
  // Community
  ...communityApiService,
  
  // Subscription
  ...subscriptionService,
  
  // Health check
  async healthCheck() {
    const baseUrl = await placesApiService['getBaseUrl']()
    const response = await fetch(`${baseUrl}/health`)
    return response.json()
  }
}

// Export individual services for direct use
export {
  authApiService,
  placesApiService,
  tripsApiService,
  userApiService,
  communityApiService
}

// Subscription helpers
export const subscriptionHelpers = {
  canAccessFeature: (subscription: any, feature: string): boolean => {
    if (!subscription || subscription.status === 'expired' || subscription.status === 'cancelled') {
      const freeFeatures = ['basic_search', 'view_places', 'basic_trip_planning', 'community_view']
      return freeFeatures.includes(feature)
    }

    const tierFeatures: Record<string, string[]> = {
      free: ['basic_search', 'view_places', 'basic_trip_planning', 'community_view'],
      basic: ['basic_search', 'view_places', 'basic_trip_planning', 'community_view', 'extended_search', 'basic_ai', 'favorites'],
      premium: ['basic_search', 'view_places', 'basic_trip_planning', 'community_view', 'extended_search', 'basic_ai', 'favorites', 'advanced_ai', 'offline_maps', 'priority_support'],
      pro: ['basic_search', 'view_places', 'basic_trip_planning', 'community_view', 'extended_search', 'basic_ai', 'favorites', 'advanced_ai', 'offline_maps', 'priority_support', 'business_features', 'team_collaboration']
    }

    const features = tierFeatures[subscription.tier] || tierFeatures.free
    return features.includes(feature)
  },

  getTierLimits: (tier: string) => {
    const limits: Record<string, any> = {
      free: { placesPerDay: 10, aiQueriesPerMonth: 0, dealsPerDay: 3, favoritesMax: 10, tripsPerMonth: 1 },
      basic: { placesPerDay: 30, aiQueriesPerMonth: 5, dealsPerDay: 10, favoritesMax: 50, tripsPerMonth: 5 },
      premium: { placesPerDay: 100, aiQueriesPerMonth: 20, dealsPerDay: 25, favoritesMax: -1, tripsPerMonth: 15 },
      pro: { placesPerDay: -1, aiQueriesPerMonth: 100, dealsPerDay: -1, favoritesMax: -1, tripsPerMonth: -1 }
    }
    return limits[tier] || limits.free
  },

  isTrialExpired: (subscription: any): boolean => {
    if (!subscription || subscription.status !== 'trial') return false
    if (!subscription.trialEndDate) return false
    return new Date() > new Date(subscription.trialEndDate)
  },

  hasActiveSubscription: (subscription: any): boolean => {
    if (!subscription) return false
    if (subscription.status === 'active') return true
    if (subscription.status === 'trial' && !subscriptionHelpers.isTrialExpired(subscription)) return true
    return false
  }
}
