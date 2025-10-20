enum TransportMode {
  walking,
  driving,
  publicTransit,
  cycling,
}

enum RouteType {
  shortest,
  fastest,
  scenic,
  custom,
}

class RoutePreferences {
  final TransportMode transportMode;
  final bool considerOpeningHours;
  final bool optimizeForRating;
  final bool includeBreaks;
  final bool avoidTolls;
  final bool avoidHighways;
  final List<String> preferredPlaceTypes;
  final Duration maxWalkingTime;

  const RoutePreferences({
    required this.transportMode,
    this.considerOpeningHours = true,
    this.optimizeForRating = true,
    this.includeBreaks = true,
    this.avoidTolls = false,
    this.avoidHighways = false,
    this.preferredPlaceTypes = const [],
    this.maxWalkingTime = const Duration(minutes: 15),
  });
}

class OptimizedRoute {
  final String id;
  final String title;
  final List<dynamic> places;
  final RouteType type;
  final Duration estimatedDuration;
  final double totalDistance;
  final double totalScore;
  final List<ScheduledStop> schedule;

  OptimizedRoute({
    required this.id,
    required this.title,
    required this.places,
    required this.type,
    required this.estimatedDuration,
    required this.totalDistance,
    required this.totalScore,
    required this.schedule,
  });

  String get typeDisplayName {
    switch (type) {
      case RouteType.shortest:
        return 'Shortest';
      case RouteType.fastest:
        return 'Fastest';
      case RouteType.scenic:
        return 'Scenic';
      case RouteType.custom:
        return 'Custom';
    }
  }

  String get distanceDisplay => '${totalDistance.toStringAsFixed(1)} km';
  String get durationDisplay => '${estimatedDuration.inMinutes} min';
}

class ScheduledStop {
  final String id;
  final String name;
  final String address;
  final DateTime arrivalTime;
  final DateTime departureTime;
  final Duration duration;
  final String notes;
  final dynamic place;
  final Duration travelTimeToNext;

  ScheduledStop({
    required this.id,
    required this.name,
    required this.address,
    required this.arrivalTime,
    required this.departureTime,
    required this.duration,
    this.notes = '',
    this.place,
    this.travelTimeToNext = Duration.zero,
    Duration? visitDuration,
  });

  String get arrivalTimeDisplay => '${arrivalTime.hour.toString().padLeft(2, '0')}:${arrivalTime.minute.toString().padLeft(2, '0')}';
  String get departureTimeDisplay => '${departureTime.hour.toString().padLeft(2, '0')}:${departureTime.minute.toString().padLeft(2, '0')}';
  Duration get visitDuration => departureTime.difference(arrivalTime);
}