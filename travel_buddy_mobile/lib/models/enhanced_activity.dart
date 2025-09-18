class EnhancedActivity {
  final String id;
  final String title;
  final String description;
  final String timeSlot;
  final Duration estimatedDuration;
  final ActivityType type;
  final Location location;
  final CostInfo costInfo;
  final TravelInfo travelInfo;
  final List<String> images;
  final ContextualInfo contextInfo;
  final List<ActionableLink> actionableLinks;

  EnhancedActivity({
    required this.id,
    required this.title,
    required this.description,
    required this.timeSlot,
    required this.estimatedDuration,
    required this.type,
    required this.location,
    required this.costInfo,
    required this.travelInfo,
    required this.images,
    required this.contextInfo,
    required this.actionableLinks,
  });
}

class CostInfo {
  final double entryFee;
  final String currency;
  final Map<String, double> mealCosts; // budget, mid-range, luxury
  final double transportCost;
  final List<String> paymentMethods;
  final bool hasDiscounts;

  CostInfo({
    required this.entryFee,
    required this.currency,
    required this.mealCosts,
    required this.transportCost,
    required this.paymentMethods,
    required this.hasDiscounts,
  });
}

class TravelInfo {
  final String fromPrevious;
  final Duration travelTime;
  final TransportMode recommendedMode;
  final double estimatedCost;
  final String routeInstructions;
  final bool isAccessible;

  TravelInfo({
    required this.fromPrevious,
    required this.travelTime,
    required this.recommendedMode,
    required this.estimatedCost,
    required this.routeInstructions,
    required this.isAccessible,
  });
}

class ContextualInfo {
  final String crowdLevel; // low, moderate, high
  final String bestTimeToVisit;
  final List<String> weatherTips;
  final List<String> localTips;
  final List<String> safetyAlerts;
  final bool isIndoorActivity;

  ContextualInfo({
    required this.crowdLevel,
    required this.bestTimeToVisit,
    required this.weatherTips,
    required this.localTips,
    required this.safetyAlerts,
    required this.isIndoorActivity,
  });
}

class ActionableLink {
  final String title;
  final String url;
  final ActionType type; // booking, tickets, reservation, map

  ActionableLink({
    required this.title,
    required this.url,
    required this.type,
  });
}

class Location {
  final String address;
  final double latitude;
  final double longitude;

  Location({
    required this.address,
    required this.latitude,
    required this.longitude,
  });
}

enum ActivityType { landmark, restaurant, museum, shopping, nature, entertainment }
enum TransportMode { walk, metro, bus, taxi, bike }
enum ActionType { booking, tickets, reservation, map, skipLine }