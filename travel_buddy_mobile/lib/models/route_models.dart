import 'place.dart';

enum RouteType {
  shortest,
  fastest,
  scenic,
  custom,
}

enum TransportMode {
  walking,
  driving,
  publicTransit,
  cycling,
}

class RoutePreferences {
  final TransportMode transportMode;
  final bool avoidTolls;
  final bool avoidHighways;
  final bool includeBreaks;
  final Duration maxWalkingTime;
  final List<String> preferredPlaceTypes;
  final bool considerOpeningHours;
  final bool optimizeForRating;

  const RoutePreferences({
    this.transportMode = TransportMode.walking,
    this.avoidTolls = false,
    this.avoidHighways = false,
    this.includeBreaks = true,
    this.maxWalkingTime = const Duration(hours: 6),
    this.preferredPlaceTypes = const [],
    this.considerOpeningHours = true,
    this.optimizeForRating = false,
  });
}

class OptimizedRoute {
  final String id;
  final RouteType type;
  final List<Place> places;
  final List<ScheduledStop> schedule;
  final double totalDistance; // in meters
  final Duration estimatedDuration;
  final double totalScore;
  final Map<String, dynamic>? metadata;

  const OptimizedRoute({
    required this.id,
    required this.type,
    required this.places,
    required this.schedule,
    required this.totalDistance,
    required this.estimatedDuration,
    required this.totalScore,
    this.metadata,
  });

  String get typeDisplayName {
    switch (type) {
      case RouteType.shortest:
        return 'Shortest Distance';
      case RouteType.fastest:
        return 'Fastest Time';
      case RouteType.scenic:
        return 'Most Scenic';
      case RouteType.custom:
        return 'Custom Route';
    }
  }

  String get distanceDisplay => '${(totalDistance / 1000).toStringAsFixed(1)} km';
  
  String get durationDisplay {
    final hours = estimatedDuration.inHours;
    final minutes = estimatedDuration.inMinutes % 60;
    return hours > 0 ? '${hours}h ${minutes}m' : '${minutes}m';
  }
}

class ScheduledStop {
  final Place place;
  final DateTime arrivalTime;
  final DateTime departureTime;
  final Duration visitDuration;
  final Duration travelTimeToNext;
  final String? notes;

  const ScheduledStop({
    required this.place,
    required this.arrivalTime,
    required this.departureTime,
    required this.visitDuration,
    required this.travelTimeToNext,
    this.notes,
  });

  String get arrivalTimeDisplay => 
      '${arrivalTime.hour.toString().padLeft(2, '0')}:${arrivalTime.minute.toString().padLeft(2, '0')}';
  
  String get departureTimeDisplay => 
      '${departureTime.hour.toString().padLeft(2, '0')}:${departureTime.minute.toString().padLeft(2, '0')}';
}

class RouteAlternative {
  final OptimizedRoute route;
  final String description;
  final List<String> highlights;
  final List<String> warnings;

  const RouteAlternative({
    required this.route,
    required this.description,
    this.highlights = const [],
    this.warnings = const [],
  });
}

class RouteAnalytics {
  final String routeId;
  final DateTime startTime;
  final DateTime? endTime;
  final int placesVisited;
  final int placesSkipped;
  final double actualDistance;
  final Duration actualDuration;
  final double accuracyScore;
  final Map<String, dynamic> userFeedback;

  const RouteAnalytics({
    required this.routeId,
    required this.startTime,
    this.endTime,
    required this.placesVisited,
    required this.placesSkipped,
    required this.actualDistance,
    required this.actualDuration,
    required this.accuracyScore,
    this.userFeedback = const {},
  });
}

class SmartSuggestion {
  final String id;
  final SuggestionType type;
  final String title;
  final String description;
  final Place? relatedPlace;
  final String? actionUrl;
  final DateTime validUntil;
  final int priority;

  const SmartSuggestion({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    this.relatedPlace,
    this.actionUrl,
    required this.validUntil,
    this.priority = 1,
  });
}

enum SuggestionType {
  restaurant,
  restroom,
  parking,
  photoSpot,
  weather,
  traffic,
  event,
  discount,
  alternative,
}