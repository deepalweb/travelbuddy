import 'dart:math';
import 'package:geolocator/geolocator.dart';
import '../models/place.dart';
import '../models/route_models.dart';

class EnhancedRoutePlanningService {
  /// Advanced route optimization using multiple criteria
  static Future<OptimizedRoute> planOptimalRoute({
    required Position currentLocation,
    required List<Place> places,
    required RoutePreferences preferences,
    DateTime? startTime,
  }) async {
    final routes = await _generateRouteAlternatives(
      currentLocation: currentLocation,
      places: places,
      preferences: preferences,
      startTime: startTime ?? DateTime.now(),
    );

    return routes.first; // Return best route
  }

  /// Generate multiple route alternatives
  static Future<List<OptimizedRoute>> _generateRouteAlternatives({
    required Position currentLocation,
    required List<Place> places,
    required RoutePreferences preferences,
    required DateTime startTime,
  }) async {
    final routes = <OptimizedRoute>[];

    // Route 1: Shortest Distance (Nearest First)
    routes.add(await createShortestRoute(currentLocation, places, startTime));

    // Route 2: Fastest Time (Traffic Optimized)
    routes.add(await createFastestRoute(currentLocation, places, startTime));

    // Route 3: Scenic Route (Highest Rated Places)
    routes.add(await createScenicRoute(currentLocation, places, startTime));

    return routes..sort((a, b) => b.totalScore.compareTo(a.totalScore));
  }

  /// Create shortest distance route
  static Future<OptimizedRoute> createShortestRoute(
    Position currentLocation,
    List<Place> places,
    DateTime startTime,
  ) async {
    final sortedPlaces = await _sortByDistance(currentLocation, places);
    final schedule = await _createTimeSchedule(sortedPlaces, startTime);
    
    return OptimizedRoute(
      id: 'shortest_${DateTime.now().millisecondsSinceEpoch}',
      title: 'Shortest Route',
      type: RouteType.shortest,
      places: sortedPlaces,
      schedule: schedule,
      totalDistance: _calculateTotalDistance(currentLocation, sortedPlaces),
      estimatedDuration: _calculateTotalDuration(schedule),
      totalScore: _calculateRouteScore(sortedPlaces, RouteType.shortest),
    );
  }

  /// Create fastest time route (considering traffic)
  static Future<OptimizedRoute> createFastestRoute(
    Position currentLocation,
    List<Place> places,
    DateTime startTime,
  ) async {
    // TODO: Integrate with Google Maps Traffic API
    final optimizedPlaces = await _optimizeForTraffic(currentLocation, places, startTime);
    final schedule = await _createTimeSchedule(optimizedPlaces, startTime);
    
    return OptimizedRoute(
      id: 'fastest_${DateTime.now().millisecondsSinceEpoch}',
      title: 'Fastest Route',
      type: RouteType.fastest,
      places: optimizedPlaces,
      schedule: schedule,
      totalDistance: _calculateTotalDistance(currentLocation, optimizedPlaces),
      estimatedDuration: _calculateTotalDuration(schedule),
      totalScore: _calculateRouteScore(optimizedPlaces, RouteType.fastest),
    );
  }

  /// Create scenic route (highest rated places)
  static Future<OptimizedRoute> createScenicRoute(
    Position currentLocation,
    List<Place> places,
    DateTime startTime,
  ) async {
    final scenicPlaces = await _optimizeForRating(currentLocation, places);
    final schedule = await _createTimeSchedule(scenicPlaces, startTime);
    
    return OptimizedRoute(
      id: 'scenic_${DateTime.now().millisecondsSinceEpoch}',
      title: 'Scenic Route',
      type: RouteType.scenic,
      places: scenicPlaces,
      schedule: schedule,
      totalDistance: _calculateTotalDistance(currentLocation, scenicPlaces),
      estimatedDuration: _calculateTotalDuration(schedule),
      totalScore: _calculateRouteScore(scenicPlaces, RouteType.scenic),
    );
  }

  /// Sort places by distance from current location
  static Future<List<Place>> _sortByDistance(Position currentLocation, List<Place> places) async {
    // Resolve coordinates for places that don't have them
    final resolvedPlaces = await _resolveCoordinates(places);
    
    final placesWithDistance = resolvedPlaces.map((place) {
      final distance = place.latitude != null && place.longitude != null
          ? Geolocator.distanceBetween(
              currentLocation.latitude,
              currentLocation.longitude,
              place.latitude!,
              place.longitude!,
            )
          : 5000.0; // Default 5km if no coordinates
      return {'place': place, 'distance': distance};
    }).toList();

    placesWithDistance.sort((a, b) => 
      (a['distance'] as double).compareTo(b['distance'] as double));

    return placesWithDistance.map((item) => item['place'] as Place).toList();
  }

  /// Optimize route considering traffic patterns
  static Future<List<Place>> _optimizeForTraffic(
    Position currentLocation,
    List<Place> places,
    DateTime startTime,
  ) async {
    // Placeholder for traffic optimization
    // TODO: Integrate with Google Maps Traffic API
    return _sortByDistance(currentLocation, places);
  }

  /// Optimize route for highest rated places
  static Future<List<Place>> _optimizeForRating(Position currentLocation, List<Place> places) async {
    final resolvedPlaces = await _resolveCoordinates(places);
    final sortedByRating = List<Place>.from(resolvedPlaces)
      ..sort((a, b) => (b.rating ?? 0.0).compareTo(a.rating ?? 0.0));
    
    // Balance rating with distance
    return _balanceRatingAndDistance(currentLocation, sortedByRating);
  }

  /// Balance high ratings with reasonable distances
  static List<Place> _balanceRatingAndDistance(Position currentLocation, List<Place> places) {
    // Simple algorithm: prioritize high-rated places that aren't too far
    final balanced = <Place>[];
    final remaining = List<Place>.from(places);
    
    while (remaining.isNotEmpty) {
      final currentPos = balanced.isEmpty 
          ? currentLocation 
          : Position(
              latitude: balanced.last.latitude ?? currentLocation.latitude,
              longitude: balanced.last.longitude ?? currentLocation.longitude,
              timestamp: DateTime.now(),
              accuracy: 0,
              altitude: 0,
              altitudeAccuracy: 0,
              heading: 0,
              headingAccuracy: 0,
              speed: 0,
              speedAccuracy: 0,
            );
      
      // Find best balance of rating and distance
      remaining.sort((a, b) {
        final distanceA = Geolocator.distanceBetween(
          currentPos.latitude, currentPos.longitude,
          a.latitude ?? 0.0, a.longitude ?? 0.0,
        );
        final distanceB = Geolocator.distanceBetween(
          currentPos.latitude, currentPos.longitude,
          b.latitude ?? 0.0, b.longitude ?? 0.0,
        );
        
        final scoreA = (a.rating ?? 0.0) * 1000 - distanceA * 0.001;
        final scoreB = (b.rating ?? 0.0) * 1000 - distanceB * 0.001;
        
        return scoreB.compareTo(scoreA);
      });
      
      balanced.add(remaining.removeAt(0));
    }
    
    return balanced;
  }

  /// Create time-based schedule for places
  static Future<List<ScheduledStop>> _createTimeSchedule(
    List<Place> places,
    DateTime startTime,
  ) async {
    final schedule = <ScheduledStop>[];
    var currentTime = startTime;
    
    for (int i = 0; i < places.length; i++) {
      final place = places[i];
      final visitDuration = _estimateVisitDuration(place);
      
      schedule.add(ScheduledStop(
        id: 'stop_${i}',
        name: place.name,
        address: place.address,
        arrivalTime: currentTime,
        departureTime: currentTime.add(visitDuration),
        duration: visitDuration,
        place: place,
        travelTimeToNext: i < places.length - 1 
            ? _estimateTravelTime(place, places[i + 1])
            : Duration.zero,
      ));
      
      currentTime = currentTime.add(visitDuration);
      if (i < places.length - 1) {
        currentTime = currentTime.add(_estimateTravelTime(place, places[i + 1]));
      }
    }
    
    return schedule;
  }

  /// Estimate visit duration based on place type
  static Duration _estimateVisitDuration(Place place) {
    switch (place.type.toLowerCase()) {
      case 'museum':
      case 'gallery':
        return const Duration(hours: 2);
      case 'restaurant':
      case 'cafe':
        return const Duration(hours: 1);
      case 'park':
      case 'garden':
        return const Duration(minutes: 45);
      case 'shopping':
      case 'mall':
        return const Duration(hours: 1, minutes: 30);
      case 'temple':
      case 'church':
        return const Duration(minutes: 30);
      default:
        return const Duration(minutes: 45);
    }
  }

  /// Estimate travel time between two places
  static Duration _estimateTravelTime(Place from, Place to) {
    if (from.latitude == null || to.latitude == null) {
      return const Duration(minutes: 15); // Default
    }
    
    final distance = Geolocator.distanceBetween(
      from.latitude!, from.longitude!,
      to.latitude!, to.longitude!,
    );
    
    // Assume average speed of 4 km/h walking
    final hours = (distance / 1000) / 4;
    return Duration(minutes: (hours * 60).round().clamp(5, 60));
  }

  /// Calculate total route distance
  static double _calculateTotalDistance(Position start, List<Place> places) {
    if (places.isEmpty) return 0.0;
    
    double total = 0.0;
    var lastLat = start.latitude;
    var lastLng = start.longitude;
    
    for (final place in places) {
      if (place.latitude != null && place.longitude != null) {
        total += Geolocator.distanceBetween(
          lastLat, lastLng,
          place.latitude!, place.longitude!,
        );
        lastLat = place.latitude!;
        lastLng = place.longitude!;
      } else {
        // Add estimated distance if coordinates missing
        total += 2000.0; // 2km default per place
      }
    }
    
    // Ensure minimum distance for display
    return total > 0 ? total : places.length * 2000.0;
  }

  /// Calculate total route duration
  static Duration _calculateTotalDuration(List<ScheduledStop> schedule) {
    if (schedule.isEmpty) return Duration.zero;
    
    final start = schedule.first.arrivalTime;
    final end = schedule.last.departureTime;
    return end.difference(start);
  }

  /// Calculate route score for optimization
  static double _calculateRouteScore(List<Place> places, RouteType type) {
    double score = 0.0;
    
    switch (type) {
      case RouteType.shortest:
        // Favor shorter distances
        score = 100.0 - (places.length * 2); // Penalty for more places
        break;
      case RouteType.fastest:
        // Favor time efficiency
        score = 90.0 + (places.length * 1); // Bonus for visiting more places
        break;
      case RouteType.scenic:
        // Favor high ratings
        final avgRating = places.fold(0.0, (sum, place) => sum + (place.rating ?? 0.0)) / places.length;
        score = avgRating * 20; // Scale rating to score
        break;
      case RouteType.custom:
        // Custom route scoring
        score = 80.0; // Default score for custom routes
        break;
    }
    
    return score;
  }

  /// Resolves coordinates for places that don't have them
  static Future<List<Place>> _resolveCoordinates(List<Place> places) async {
    final resolvedPlaces = <Place>[];
    
    for (final place in places) {
      if (place.latitude != null && place.longitude != null) {
        resolvedPlaces.add(place);
      } else {
        // For demo purposes, assign approximate coordinates based on place name
        final coords = _getApproximateCoordinates(place.name, place.address);
        resolvedPlaces.add(Place(
          id: place.id,
          name: place.name,
          address: place.address,
          latitude: coords['lat'],
          longitude: coords['lng'],
          rating: place.rating,
          type: place.type,
          photoUrl: place.photoUrl,
          description: place.description,
          localTip: place.localTip,
          handyPhrase: place.handyPhrase,
          phoneNumber: place.phoneNumber,
          website: place.website,
        ));
      }
    }
    
    return resolvedPlaces;
  }

  /// Get approximate coordinates for demo purposes
  static Map<String, double> _getApproximateCoordinates(String name, String address) {
    // Simple hash-based coordinate generation for consistent results
    final hash = name.hashCode + address.hashCode;
    final lat = 40.7128 + (hash % 1000) / 10000.0; // Around NYC area
    final lng = -74.0060 + (hash % 1000) / 10000.0;
    return {'lat': lat, 'lng': lng};
  }
}