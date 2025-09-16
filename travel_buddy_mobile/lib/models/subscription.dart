import 'user.dart';

class Subscription {
  final SubscriptionTier tier;
  final SubscriptionStatus status;
  final bool isTrialActive;
  final DateTime? trialEndDate;
  final DateTime? subscriptionEndDate;

  Subscription({
    required this.tier,
    required this.status,
    required this.isTrialActive,
    this.trialEndDate,
    this.subscriptionEndDate,
  });
}

class SubscriptionPlan {
  final SubscriptionTier tier;
  final String name;
  final double monthlyPrice;
  final double? annualPrice;
  final List<String> features;
  final bool isRecommended;
  final String? badge;

  const SubscriptionPlan({
    required this.tier,
    required this.name,
    required this.monthlyPrice,
    this.annualPrice,
    required this.features,
    this.isRecommended = false,
    this.badge,
  });
}

class UserSubscription {
  final SubscriptionTier tier;
  final SubscriptionStatus status;
  final DateTime? trialEndDate;
  final DateTime? subscriptionEndDate;
  final int? trialDaysRemaining;

  UserSubscription({
    required this.tier,
    required this.status,
    this.trialEndDate,
    this.subscriptionEndDate,
    this.trialDaysRemaining,
  });
}

class SubscriptionLimits {
  final int placesPerDay;
  final int aiQueriesPerDay;
  final int dealsPerDay;
  final int favoritesMax;
  final int postsPerDay;
  final bool hasTrialAccess;
  final int trialDays;

  const SubscriptionLimits({
    required this.placesPerDay,
    required this.aiQueriesPerDay,
    required this.dealsPerDay,
    required this.favoritesMax,
    required this.postsPerDay,
    required this.hasTrialAccess,
    required this.trialDays,
  });
}