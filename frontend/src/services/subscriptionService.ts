import { apiService } from './apiService';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    placesPerDay: number;
    aiQueriesPerMonth: number;
    dealsPerDay: number;
    favoritesMax: number;
    tripsPerMonth: number;
  };
}

export interface UserSubscription {
  tier: string;
  status: 'active' | 'trial' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  autoRenew: boolean;
  paymentMethod?: string;
}

export interface SubscriptionUsage {
  placesToday: number;
  aiQueriesThisMonth: number;
  dealsToday: number;
  totalFavorites: number;
  tripsThisMonth: number;
}

export interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  plan: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
}

class SubscriptionService {
  private readonly baseUrl = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api';

  // Get available subscription tiers
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/tiers`);
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback to default tiers
      return this.getDefaultTiers();
    } catch (error) {
      console.error('Failed to fetch subscription tiers:', error);
      return this.getDefaultTiers();
    }
  }

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user subscription:', error);
      return null;
    }
  }

  // Get subscription usage statistics
  async getSubscriptionUsage(userId: string): Promise<SubscriptionUsage> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${userId}/usage`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Fallback to default usage
      return {
        placesToday: 0,
        aiQueriesThisMonth: 0,
        dealsToday: 0,
        totalFavorites: 0,
        tripsThisMonth: 0,
      };
    } catch (error) {
      console.error('Failed to fetch subscription usage:', error);
      return {
        placesToday: 0,
        aiQueriesThisMonth: 0,
        dealsToday: 0,
        totalFavorites: 0,
        tripsThisMonth: 0,
      };
    }
  }

  // Start free trial
  async startFreeTrial(userId: string, tier: string): Promise<boolean> {
    try {
      // Check if user has already used trial
      const hasUsedTrial = await this.checkTrialUsage(userId);
      if (hasUsedTrial) {
        throw new Error('Free trial already used');
      }

      const response = await fetch(`${this.baseUrl}/subscriptions/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          tier,
          trialDays: 7,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to start free trial:', error);
      return false;
    }
  }

  // Check if user has used free trial
  async checkTrialUsage(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/trial-history`);
      if (response.ok) {
        const data = await response.json();
        return data.hasUsedTrial === true;
      }
      return false;
    } catch (error) {
      console.error('Failed to check trial usage:', error);
      return false;
    }
  }

  // Process subscription payment
  async processPayment(
    userId: string,
    tier: string,
    amount: number,
    paymentMethod: 'paypal' | 'stripe' = 'paypal'
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      // For demo purposes, simulate payment processing
      console.log('🔄 Processing payment (demo mode)');
      
      const response = await fetch(`${this.baseUrl}/subscriptions/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          tier,
          amount,
          paymentMethod,
          // Demo payment data
          paymentData: {
            id: `demo_payment_${Date.now()}`,
            status: 'completed',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          paymentId: data.paymentId,
        };
      }

      return {
        success: false,
        error: 'Payment processing failed',
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  // Upgrade subscription
  async upgradeSubscription(userId: string, tier: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ tier }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      return false;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/subscriptions/${userId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          cancelAtPeriodEnd: true,
          reason: reason || 'user_requested',
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  // Get payment history
  async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${userId}/history`, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.payments || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      return [];
    }
  }

  // Check if user can access feature
  canAccessFeature(subscription: UserSubscription | null, feature: string): boolean {
    if (!subscription || subscription.status === 'expired' || subscription.status === 'cancelled') {
      return this.getFreeFeatures().includes(feature);
    }

    const tier = subscription.tier;
    const features = this.getTierFeatures(tier);
    return features.includes(feature);
  }

  // Check usage limits
  async checkUsageLimit(
    userId: string,
    feature: string,
    subscription: UserSubscription | null
  ): Promise<{ allowed: boolean; limit: number; current: number }> {
    const usage = await this.getSubscriptionUsage(userId);
    const limits = this.getTierLimits(subscription?.tier || 'free');

    switch (feature) {
      case 'places_search':
        return {
          allowed: usage.placesToday < limits.placesPerDay,
          limit: limits.placesPerDay,
          current: usage.placesToday,
        };
      case 'ai_queries':
        return {
          allowed: usage.aiQueriesThisMonth < limits.aiQueriesPerMonth,
          limit: limits.aiQueriesPerMonth,
          current: usage.aiQueriesThisMonth,
        };
      case 'deals_access':
        return {
          allowed: usage.dealsToday < limits.dealsPerDay,
          limit: limits.dealsPerDay,
          current: usage.dealsToday,
        };
      case 'favorites':
        return {
          allowed: usage.totalFavorites < limits.favoritesMax,
          limit: limits.favoritesMax,
          current: usage.totalFavorites,
        };
      case 'trip_planning':
        return {
          allowed: usage.tripsThisMonth < limits.tripsPerMonth,
          limit: limits.tripsPerMonth,
          current: usage.tripsThisMonth,
        };
      default:
        return { allowed: true, limit: -1, current: 0 };
    }
  }

  // Private helper methods
  private getDefaultTiers(): SubscriptionTier[] {
    return [
      {
        id: 'free',
        name: 'Explorer',
        price: 0,
        features: [
          '10 places per day',
          '3 deals per day',
          'Basic trip planning',
          'Community access',
          '10 favorites max',
        ],
        limits: {
          placesPerDay: 10,
          aiQueriesPerMonth: 0,
          dealsPerDay: 3,
          favoritesMax: 10,
          tripsPerMonth: 1,
        },
      },
      {
        id: 'basic',
        name: 'Globetrotter',
        price: 4.99,
        features: [
          '30 places per day',
          'Basic trip planning',
          'Save up to 50 favorites',
          'Standard support',
          '5 trips per month',
        ],
        limits: {
          placesPerDay: 30,
          aiQueriesPerMonth: 5,
          dealsPerDay: 10,
          favoritesMax: 50,
          tripsPerMonth: 5,
        },
      },
      {
        id: 'premium',
        name: 'WanderPro',
        price: 9.99,
        features: [
          '100 places per day',
          '20 AI queries per month',
          'Unlimited favorites',
          'Advanced trip planning',
          'Offline maps',
          'Priority support',
        ],
        limits: {
          placesPerDay: 100,
          aiQueriesPerMonth: 20,
          dealsPerDay: 25,
          favoritesMax: -1,
          tripsPerMonth: 15,
        },
      },
      {
        id: 'pro',
        name: 'WanderPro+',
        price: 19.99,
        features: [
          'Unlimited places',
          '100 AI queries per month',
          'Business travel features',
          'Team collaboration',
          'Custom integrations',
          'Dedicated support',
        ],
        limits: {
          placesPerDay: -1,
          aiQueriesPerMonth: 100,
          dealsPerDay: -1,
          favoritesMax: -1,
          tripsPerMonth: -1,
        },
      },
    ];
  }

  private getFreeFeatures(): string[] {
    return [
      'basic_search',
      'view_places',
      'basic_trip_planning',
      'community_view',
    ];
  }

  private getTierFeatures(tier: string): string[] {
    const features = {
      free: this.getFreeFeatures(),
      basic: [
        ...this.getFreeFeatures(),
        'extended_search',
        'basic_ai',
        'favorites',
      ],
      premium: [
        ...this.getFreeFeatures(),
        'extended_search',
        'basic_ai',
        'favorites',
        'advanced_ai',
        'offline_maps',
        'priority_support',
      ],
      pro: [
        ...this.getFreeFeatures(),
        'extended_search',
        'basic_ai',
        'favorites',
        'advanced_ai',
        'offline_maps',
        'priority_support',
        'business_features',
        'team_collaboration',
        'custom_integrations',
      ],
    };

    return features[tier as keyof typeof features] || features.free;
  }

  private getTierLimits(tier: string) {
    const limits = {
      free: {
        placesPerDay: 10,
        aiQueriesPerMonth: 0,
        dealsPerDay: 3,
        favoritesMax: 10,
        tripsPerMonth: 1,
      },
      basic: {
        placesPerDay: 30,
        aiQueriesPerMonth: 5,
        dealsPerDay: 10,
        favoritesMax: 50,
        tripsPerMonth: 5,
      },
      premium: {
        placesPerDay: 100,
        aiQueriesPerMonth: 20,
        dealsPerDay: 25,
        favoritesMax: -1,
        tripsPerMonth: 15,
      },
      pro: {
        placesPerDay: -1,
        aiQueriesPerMonth: 100,
        dealsPerDay: -1,
        favoritesMax: -1,
        tripsPerMonth: -1,
      },
    };

    return limits[tier as keyof typeof limits] || limits.free;
  }
}

export const subscriptionService = new SubscriptionService();