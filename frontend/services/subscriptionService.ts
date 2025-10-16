import { SubscriptionTier, SubscriptionStatus, CurrentUser } from '../types.ts';
import { apiService } from './apiService.ts';

export interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trialEndDate?: string;
  subscriptionEndDate?: string;
  trialDaysUsed?: number;
  trialDaysRemaining?: number;
  usageStats?: UserUsageStats;
}

export interface UserUsageStats {
  placesSearched: number;
  aiQueriesUsed: number;
  dealsViewed: number;
  favoritesUsed: number;
  postsCreated: number;
  lastResetDate: string;
}

export interface TierLimits {
  placesPerDay: number;
  aiQueriesPerDay: number;
  dealsPerDay: number;
  favoritesMax: number;
  postsPerDay: number;
  hasTrialAccess: boolean;
  trialDays: number;
}

// 4-Tier System Limits
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    placesPerDay: 50,
    aiQueriesPerDay: 0,
    dealsPerDay: 10,
    favoritesMax: 0,
    postsPerDay: 0,
    hasTrialAccess: false,
    trialDays: 0,
  },
  basic: {
    placesPerDay: 200,
    aiQueriesPerDay: 0,
    dealsPerDay: 50,
    favoritesMax: 50,
    postsPerDay: 3,
    hasTrialAccess: true,
    trialDays: 7,
  },
  premium: {
    placesPerDay: 500,
    aiQueriesPerDay: 50,
    dealsPerDay: 100,
    favoritesMax: 200,
    postsPerDay: 10,
    hasTrialAccess: true,
    trialDays: 7,
  },
  pro: {
    placesPerDay: -1, // unlimited
    aiQueriesPerDay: -1, // unlimited
    dealsPerDay: -1, // unlimited
    favoritesMax: -1, // unlimited
    postsPerDay: -1, // unlimited
    hasTrialAccess: true,
    trialDays: 7,
  },
};

export class SubscriptionService {
  private static instance: SubscriptionService;
  private usageCache = new Map<string, UserUsageStats>();

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Check if user has access to a specific tier level
   */
  hasAccess(user: CurrentUser | null, requiredTier: SubscriptionTier): boolean {
    if (!user) return requiredTier === 'free';
    
    const tierHierarchy: Record<SubscriptionTier, number> = { 
      free: 0, basic: 1, premium: 2, pro: 3 
    };
    
    // Check tier hierarchy
    if (tierHierarchy[user.tier] < tierHierarchy[requiredTier]) {
      return false;
    }
    
    if (requiredTier === 'free') return true;
    
    const now = new Date();
    
    // Check trial access
    if (user.subscriptionStatus === 'trial' && user.trialEndDate) {
      return new Date(user.trialEndDate) >= now;
    }
    
    // Check active subscription
    if (user.subscriptionStatus === 'active' && user.subscriptionEndDate) {
      return new Date(user.subscriptionEndDate) >= now;
    }
    
    return false;
  }

  /**
   * Start a free trial for a specific tier
   */
  async startTrial(user: CurrentUser, tier: SubscriptionTier): Promise<SubscriptionData> {
    const limits = TIER_LIMITS[tier];
    if (!limits.hasTrialAccess) {
      throw new Error(`Trial not available for ${tier} tier`);
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + limits.trialDays);

    const subscriptionData: SubscriptionData = {
      tier,
      status: 'trial',
      trialEndDate: trialEndDate.toISOString(),
      trialDaysUsed: 0,
      trialDaysRemaining: limits.trialDays,
    };

    console.log('[SubscriptionService] Starting trial:', subscriptionData);

    // Update user in backend
    if (user.mongoId) {
      try {
        console.log('[SubscriptionService] Updating trial in backend for user:', user.mongoId);
        const updateData = {
          tier,
          subscriptionStatus: 'trial',
          trialEndDate: subscriptionData.trialEndDate,
        };
        console.log('[SubscriptionService] Sending update data:', updateData);
        
  const res = await apiService.startTrial(user.mongoId, tier);
  const updatedUser = (res && (res.user || res)) as any;
        console.log('[SubscriptionService] Backend response:', updatedUser);
        console.log('[SubscriptionService] Trial updated in backend successfully');
      } catch (error) {
        console.error('[SubscriptionService] Failed to update trial in backend:', error);
        // Continue with localStorage update even if backend fails
      }
    } else {
      console.warn('[SubscriptionService] No mongoId found, skipping backend update');
    }

    // Persist to localStorage immediately
    const updatedUser = {
      ...user,
      tier,
      subscriptionStatus: 'trial' as const,
      trialEndDate: subscriptionData.trialEndDate,
    };
    
    try {
      localStorage.setItem('travelbuddy_current_user', JSON.stringify(updatedUser));
      console.log('[SubscriptionService] Trial persisted to localStorage');
    } catch (error) {
      console.error('[SubscriptionService] Failed to persist trial to localStorage:', error);
    }

    // Track trial start
    this.trackUsage(user.mongoId || user.email || user.username, 'trial_started', tier);

    return subscriptionData;
  }

  /**
   * Subscribe to a tier (mock implementation)
   */
  async subscribe(user: CurrentUser, tier: SubscriptionTier): Promise<SubscriptionData> {
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

    const subscriptionData: SubscriptionData = {
      tier,
      status: 'active',
      subscriptionEndDate: subscriptionEndDate.toISOString(),
      trialEndDate: undefined,
    };

    console.log('[SubscriptionService] Subscribing to tier:', subscriptionData);

    // Update user in backend
    if (user.mongoId) {
      try {
        console.log('[SubscriptionService] Updating subscription in backend for user:', user.mongoId);
        const updateData = {
          tier,
          subscriptionStatus: 'active',
          subscriptionEndDate: subscriptionData.subscriptionEndDate,
          trialEndDate: undefined,
        };
        console.log('[SubscriptionService] Sending update data:', updateData);
        
  const res = await apiService.subscribeUser(user.mongoId, tier);
  const updatedUser = (res && (res.user || res)) as any;
        console.log('[SubscriptionService] Backend response:', updatedUser);
        console.log('[SubscriptionService] Subscription updated in backend successfully');
      } catch (error) {
        console.error('[SubscriptionService] Failed to update subscription in backend:', error);
        // Continue with localStorage update even if backend fails
      }
    } else {
      console.warn('[SubscriptionService] No mongoId found, skipping backend update');
    }

    // Persist to localStorage immediately
    const updatedUser = {
      ...user,
      tier,
      subscriptionStatus: 'active' as const,
      subscriptionEndDate: subscriptionData.subscriptionEndDate,
      trialEndDate: undefined,
    };
    
    try {
      localStorage.setItem('travelbuddy_current_user', JSON.stringify(updatedUser));
      console.log('[SubscriptionService] Subscription persisted to localStorage');
    } catch (error) {
      console.error('[SubscriptionService] Failed to persist subscription to localStorage:', error);
    }

    // Track subscription
    this.trackUsage(user.mongoId || user.email || user.username, 'subscription_started', tier);

    return subscriptionData;
  }

  /**
   * Cancel subscription (downgrade to free)
   */
  async cancelSubscription(user: CurrentUser): Promise<SubscriptionData> {
    const subscriptionData: SubscriptionData = {
      tier: 'free',
      status: 'canceled',
      trialEndDate: undefined,
      subscriptionEndDate: undefined,
    };

    // Update user in backend
    if (user.mongoId) {
  await apiService.cancelSubscription(user.mongoId);
    }

    // Track cancellation
    this.trackUsage(user.mongoId || user.email || user.username, 'subscription_canceled', user.tier);

    return subscriptionData;
  }

  /**
   * Upgrade/downgrade subscription tier
   */
  async changeTier(user: CurrentUser, newTier: SubscriptionTier): Promise<SubscriptionData> {
    if (newTier === 'free') {
      return this.cancelSubscription(user);
    }

    // For upgrades/downgrades, maintain the same subscription end date
    const subscriptionData: SubscriptionData = {
      tier: newTier,
      status: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate,
      trialEndDate: user.trialEndDate,
    };

    // Update user in backend
    if (user.mongoId) {
      await apiService.updateUser(user.mongoId, {
        tier: newTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate,
        trialEndDate: user.trialEndDate,
      });
    }

    // Track tier change
    this.trackUsage(user.mongoId || user.email || user.username, 'tier_changed', `${user.tier}_to_${newTier}`);

    return subscriptionData;
  }

  /**
   * Check and update subscription status (handle expiration)
   */
  checkSubscriptionStatus(user: CurrentUser): CurrentUser {
    if (!user) return user;

    console.log('[SubscriptionService] Checking subscription status for user:', {
      tier: user.tier,
      status: user.subscriptionStatus,
      trialEndDate: user.trialEndDate,
      subscriptionEndDate: user.subscriptionEndDate
    });

    const now = new Date();
    let updatedUser = { ...user };
    let hasChanged = false;

    // Check trial expiration
    if (user.subscriptionStatus === 'trial' && user.trialEndDate) {
      const trialEnd = new Date(user.trialEndDate);
      if (trialEnd < now) {
        console.log('[SubscriptionService] Trial expired, downgrading to free');
        updatedUser.subscriptionStatus = 'expired';
        updatedUser.tier = 'free';
        updatedUser.trialEndDate = undefined;
        hasChanged = true;
      }
    }

    // Check subscription expiration
    if (user.subscriptionStatus === 'active' && user.subscriptionEndDate) {
      const subscriptionEnd = new Date(user.subscriptionEndDate);
      if (subscriptionEnd < now) {
        console.log('[SubscriptionService] Subscription expired, downgrading to free');
        updatedUser.subscriptionStatus = 'expired';
        updatedUser.tier = 'free';
        updatedUser.subscriptionEndDate = undefined;
        hasChanged = true;
      }
    }

    // Persist changes to localStorage immediately
    if (hasChanged) {
      console.log('[SubscriptionService] Subscription status changed, persisting to localStorage');
      try {
        localStorage.setItem('travelbuddy_current_user', JSON.stringify(updatedUser));
      } catch (e) {
        console.error('[SubscriptionService] Failed to persist user to localStorage:', e);
      }
    }

    return updatedUser;
  }

  /**
   * Get user usage statistics
   */
  async getUserUsage(userKey: string): Promise<UserUsageStats> {
    if (this.usageCache.has(userKey)) {
      return this.usageCache.get(userKey)!;
    }

    // Default usage stats
    const defaultStats: UserUsageStats = {
      placesSearched: 0,
      aiQueriesUsed: 0,
      dealsViewed: 0,
      favoritesUsed: 0,
      postsCreated: 0,
      lastResetDate: new Date().toISOString(),
    };

    this.usageCache.set(userKey, defaultStats);
    return defaultStats;
  }

  /**
   * Check if user can use a feature based on tier limits
   */
  async canUseFeature(
    user: CurrentUser,
    feature: keyof Omit<TierLimits, 'hasTrialAccess' | 'trialDays'>
  ): Promise<{ allowed: boolean; remaining?: number; limit?: number }> {
    const limits = TIER_LIMITS[user.tier];
    const userKey = user.mongoId || user.email || user.username;
    const usage = await this.getUserUsage(userKey);

    const featureMap = {
      placesPerDay: usage.placesSearched,
      aiQueriesPerDay: usage.aiQueriesUsed,
      dealsPerDay: usage.dealsViewed,
      favoritesMax: usage.favoritesUsed,
      postsPerDay: usage.postsCreated,
    };

    const currentUsage = featureMap[feature] || 0;
    const limit = limits[feature];

    // Unlimited usage (-1)
    if (limit === -1) {
      return { allowed: true };
    }

    // Check if within limits
    const allowed = currentUsage < limit;
    const remaining = Math.max(0, limit - currentUsage);

    return { allowed, remaining, limit };
  }

  /**
   * Track feature usage
   */
  async trackUsage(userKey: string, feature: string, metadata?: any): Promise<void> {
    const usage = await this.getUserUsage(userKey);
    
    // Reset daily counters if needed
    const today = new Date().toISOString().split('T')[0];
    const lastResetDate = usage.lastResetDate.split('T')[0];
    
    if (today !== lastResetDate) {
      usage.placesSearched = 0;
      usage.aiQueriesUsed = 0;
      usage.dealsViewed = 0;
      usage.postsCreated = 0;
      usage.lastResetDate = new Date().toISOString();
    }

    // Increment usage counters
    switch (feature) {
      case 'places_searched':
        usage.placesSearched++;
        break;
      case 'ai_query':
        usage.aiQueriesUsed++;
        break;
      case 'deal_viewed':
        usage.dealsViewed++;
        break;
      case 'favorite_added':
        usage.favoritesUsed++;
        break;
      case 'favorite_removed':
        usage.favoritesUsed = Math.max(0, usage.favoritesUsed - 1);
        break;
      case 'post_created':
        usage.postsCreated++;
        break;
    }

    this.usageCache.set(userKey, usage);

    // Log usage for analytics (could be sent to backend)
    console.log(`[SubscriptionService] ${feature}:`, {
      userKey,
      feature,
      metadata,
      usage: { ...usage },
    });
  }

  /**
   * Get subscription analytics for admin
   */
  getSubscriptionAnalytics(): {
    totalUsers: number;
    tierDistribution: Record<SubscriptionTier, number>;
    trialConversionRate: number;
    churnRate: number;
  } {
    // Mock analytics data - in real implementation would come from backend
    return {
      totalUsers: 1500,
      tierDistribution: {
        free: 800,
        basic: 450,
        premium: 200,
        pro: 50,
      },
      trialConversionRate: 65.2,
      churnRate: 8.1,
    };
  }
}

export const subscriptionService = SubscriptionService.getInstance();
