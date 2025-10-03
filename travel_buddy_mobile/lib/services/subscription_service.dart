import '../models/user.dart';
import '../models/subscription.dart';

class SubscriptionService {
  static final SubscriptionService _instance = SubscriptionService._internal();
  factory SubscriptionService() => _instance;
  SubscriptionService._internal();

  static final Map<SubscriptionTier, SubscriptionLimits> tierLimits = {
    SubscriptionTier.free: const SubscriptionLimits(
      placesPerDay: 10,
      aiQueriesPerDay: 0,
      dealsPerDay: 3,
      favoritesMax: 0,
      postsPerDay: 0,
      hasTrialAccess: false,
      trialDays: 0,
    ),
    SubscriptionTier.basic: const SubscriptionLimits(
      placesPerDay: 30,
      aiQueriesPerDay: 0,
      dealsPerDay: 10,
      favoritesMax: 50,
      postsPerDay: 3,
      hasTrialAccess: true,
      trialDays: 7,
    ),
    SubscriptionTier.premium: const SubscriptionLimits(
      placesPerDay: 100,
      aiQueriesPerDay: 20,
      dealsPerDay: 20,
      favoritesMax: 200,
      postsPerDay: 10,
      hasTrialAccess: true,
      trialDays: 7,
    ),
    SubscriptionTier.pro: const SubscriptionLimits(
      placesPerDay: -1,
      aiQueriesPerDay: 100,
      dealsPerDay: -1,
      favoritesMax: -1,
      postsPerDay: -1,
      hasTrialAccess: true,
      trialDays: 7,
    ),
  };

  static final List<SubscriptionPlan> plans = [
    const SubscriptionPlan(
      tier: SubscriptionTier.free,
      name: 'Explorer',
      monthlyPrice: 0,
      features: [
        '10 places per day',
        '3 deals per day',
        'Basic search',
      ],
    ),
    const SubscriptionPlan(
      tier: SubscriptionTier.basic,
      name: 'Traveler',
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      features: [
        '30 places per day',
        '10 deals per day',
        'Favorites (50 places)',
        'Community posts (3/day)',
        '7-day free trial',
      ],
    ),
    const SubscriptionPlan(
      tier: SubscriptionTier.premium,
      name: 'Smart Traveler',
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      isRecommended: true,
      features: [
        '100 places per day',
        '20 AI queries per month',
        '20 deals per day',
        'Favorites (200 places)',
        'Community posts (10/day)',
        '7-day free trial',
      ],
    ),
    const SubscriptionPlan(
      tier: SubscriptionTier.pro,
      name: 'Business/Teams',
      monthlyPrice: 39.99,
      annualPrice: 399.99,
      badge: 'BEST VALUE',
      features: [
        'Unlimited places',
        '100 AI queries per month',
        'Unlimited deals',
        'Unlimited favorites',
        'Priority support',
        'Early access features',
        '7-day free trial',
      ],
    ),
  ];

  bool hasAccess(CurrentUser? user, SubscriptionTier requiredTier) {
    if (user == null) return requiredTier == SubscriptionTier.free;

    final tierHierarchy = {
      SubscriptionTier.free: 0,
      SubscriptionTier.basic: 1,
      SubscriptionTier.premium: 2,
      SubscriptionTier.pro: 3,
    };

    if ((tierHierarchy[user.tier] ?? 0) < (tierHierarchy[requiredTier] ?? 0)) {
      return false;
    }

    if (requiredTier == SubscriptionTier.free) return true;

    final now = DateTime.now();

    // Check trial access
    if (user.subscriptionStatus == SubscriptionStatus.trial && user.trialEndDate != null) {
      return DateTime.parse(user.trialEndDate!).isAfter(now);
    }

    // Check active subscription
    if (user.subscriptionStatus == SubscriptionStatus.active && user.subscriptionEndDate != null) {
      return DateTime.parse(user.subscriptionEndDate!).isAfter(now);
    }

    return false;
  }

  Future<Subscription> getCurrentSubscription() async {
    // Mock current subscription - replace with actual API call
    return Subscription(
      tier: SubscriptionTier.free,
      status: SubscriptionStatus.active,
      isTrialActive: false,
    );
  }

  Future<UserSubscription> startTrial(CurrentUser user, SubscriptionTier tier) async {
    final limits = tierLimits[tier]!;
    if (!limits.hasTrialAccess) {
      throw Exception('Trial not available for $tier tier');
    }

    final trialEndDate = DateTime.now().add(Duration(days: limits.trialDays));

    try {
      // Use AppProvider's backend integration instead of direct API calls
      print('✅ Trial started locally - backend sync handled by AppProvider');
    } catch (e) {
      print('❌ Failed to start trial: $e');
    }

    return UserSubscription(
      tier: tier,
      status: SubscriptionStatus.trial,
      trialEndDate: trialEndDate,
      trialDaysRemaining: limits.trialDays,
    );
  }

  Future<UserSubscription> subscribe(CurrentUser user, SubscriptionTier tier) async {
    final subscriptionEndDate = DateTime.now().add(const Duration(days: 365));

    try {
      // TODO: Implement API call when backend methods are available
      print('✅ Subscription started');
    } catch (e) {
      print('❌ Failed to start subscription: $e');
    }

    return UserSubscription(
      tier: tier,
      status: SubscriptionStatus.active,
      subscriptionEndDate: subscriptionEndDate,
    );
  }

  Future<UserSubscription> cancelSubscription(CurrentUser user) async {
    try {
      // TODO: Implement API call when backend methods are available
      print('✅ Subscription canceled');
    } catch (e) {
      print('❌ Failed to cancel subscription: $e');
    }

    return UserSubscription(
      tier: SubscriptionTier.free,
      status: SubscriptionStatus.canceled,
    );
  }

  CurrentUser checkSubscriptionStatus(CurrentUser user) {
    final now = DateTime.now();
    
    // Check trial expiration
    if (user.subscriptionStatus == SubscriptionStatus.trial && user.trialEndDate != null) {
      if (DateTime.parse(user.trialEndDate!).isBefore(now)) {
        return user.copyWith(
          subscriptionStatus: SubscriptionStatus.expired,
          tier: SubscriptionTier.free,
          trialEndDate: null,
        );
      }
    }

    // Check subscription expiration
    if (user.subscriptionStatus == SubscriptionStatus.active && user.subscriptionEndDate != null) {
      if (DateTime.parse(user.subscriptionEndDate!).isBefore(now)) {
        return user.copyWith(
          subscriptionStatus: SubscriptionStatus.expired,
          tier: SubscriptionTier.free,
          subscriptionEndDate: null,
        );
      }
    }

    return user;
  }

  bool canUseFeature(CurrentUser user, String feature) {
    final limits = tierLimits[user.tier]!;
    
    switch (feature) {
      case 'ai_planning':
        return limits.aiQueriesPerDay != 0;
      case 'premium_deals':
        return user.tier == SubscriptionTier.premium || user.tier == SubscriptionTier.pro;
      case 'favorites':
        return limits.favoritesMax != 0;
      case 'community_posts':
        return limits.postsPerDay != 0;
      default:
        return true;
    }
  }
}