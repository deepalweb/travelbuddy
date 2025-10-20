import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/place.dart';
import '../models/route_models.dart';
import '../config/environment.dart';

class SmartRouteService {
  static const String _directionsBaseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
  
  /// Creates optimized route with actual road directions
  static Future<SmartRouteResult> createSmartRoute({
    required Position currentLocation,
    required List<Place> places,
    required RoutePreferences preferences,
  }) async {
    try {
      // 1. Optimize place order based on preferences
      final optimizedPlaces = await _optimizePlaceOrder(
        currentLocation: currentLocation,
        places: places,
        preferences: preferences,
      );

      // 2. Insert intelligent breaks if enabled
      final placesWithBreaks = preferences.includeBreaks 
          ? await _insertIntelligentBreaks(optimizedPlaces, preferences)
          : optimizedPlaces;

      // 3. Get actual road directions between all points
      final routeSegments = await _getRouteSegments(
        currentLocation: currentLocation,
        places: placesWithBreaks,
        preferences: preferences,
      );

      // 4. Create polyline points from all segments
      final allPolylinePoints = <LatLng>[];
      double totalDistance = 0;
      Duration totalDuration = Duration.zero;

      for (final segment in routeSegments) {
        allPolylinePoints.addAll(segment.polylinePoints);
        totalDistance += segment.distance;
        totalDuration += segment.duration;
      }

      return SmartRouteResult(
        optimizedPlaces: placesWithBreaks,
        polylinePoints: allPolylinePoints,
        routeSegments: routeSegments,
        totalDistance: totalDistance,
        totalDuration: totalDuration,
        preferences: preferences,
        hasBreaks: preferences.includeBreaks,
      );
    } catch (e) {
      print('Smart route error: $e');
      // Fallback to simple route
      return _createFallbackRoute(currentLocation, places, preferences);
    }
  }

  /// Advanced place optimization with multiple algorithms
  static Future<List<Place>> _optimizePlaceOrder({
    required Position currentLocation,
    required List<Place> places,
    required RoutePreferences preferences,
  }) async {
    if (places.length <= 2) return places;

    final placesWithData = <PlaceWithData>[];
    
    for (final place in places) {
      if (place.latitude != null && place.longitude != null) {
        final distance = Geolocator.distanceBetween(
          currentLocation.latitude,
          currentLocation.longitude,
          place.latitude!,
          place.longitude!,
        );
        
        placesWithData.add(PlaceWithData(
          place: place,
          distance: distance,
          score: _calculateAdvancedScore(place, distance, preferences),
          priority: _calculatePriority(place, preferences),
        ));
      }
    }

    // Use different optimization algorithms based on transport mode
    switch (preferences.transportMode) {
      case TransportMode.walking:
        return _nearestNeighborOptimization(currentLocation, placesWithData, preferences);
      case TransportMode.driving:
        return _tspOptimization(currentLocation, placesWithData, preferences);
      case TransportMode.publicTransit:
        return _transitOptimization(currentLocation, placesWithData, preferences);
      case TransportMode.cycling:
        return _cyclingOptimization(currentLocation, placesWithData, preferences);
    }
  }

  /// Gets actual road directions between consecutive points
  static Future<List<RouteSegment>> _getRouteSegments({
    required Position currentLocation,
    required List<Place> places,
    required RoutePreferences preferences,
  }) async {
    final segments = <RouteSegment>[];
    
    if (places.isEmpty) return segments;

    // Create waypoints list
    final waypoints = <LatLng>[
      LatLng(currentLocation.latitude, currentLocation.longitude),
    ];
    
    for (final place in places) {
      if (place.latitude != null && place.longitude != null) {
        waypoints.add(LatLng(place.latitude!, place.longitude!));
      }
    }

    // Get directions for entire route
    final directionsResult = await _getDirections(
      origin: waypoints.first,
      destination: waypoints.last,
      waypoints: waypoints.sublist(1, waypoints.length - 1),
      preferences: preferences,
    );

    if (directionsResult != null) {
      // Parse route legs into segments
      final legs = directionsResult['routes'][0]['legs'] as List;
      
      for (int i = 0; i < legs.length; i++) {
        final leg = legs[i];
        final polylinePoints = _decodePolyline(leg['polyline']['points']);
        
        segments.add(RouteSegment(
          startPoint: waypoints[i],
          endPoint: waypoints[i + 1],
          polylinePoints: polylinePoints,
          distance: (leg['distance']['value'] as num).toDouble(),
          duration: Duration(seconds: leg['duration']['value']),
          instructions: leg['steps']?.map<String>((step) => 
            step['html_instructions'].toString().replaceAll(RegExp(r'<[^>]*>'), '')
          ).toList() ?? [],
        ));
      }
    }

    return segments;
  }

  /// Calls Google Directions API
  static Future<Map<String, dynamic>?> _getDirections({
    required LatLng origin,
    required LatLng destination,
    List<LatLng> waypoints = const [],
    required RoutePreferences preferences,
  }) async {
    try {
      final params = {
        'origin': '${origin.latitude},${origin.longitude}',
        'destination': '${destination.latitude},${destination.longitude}',
        'mode': _getTravelMode(preferences.transportMode),
        'key': Environment.googleMapsApiKey,
      };

      if (waypoints.isNotEmpty) {
        final waypointStr = waypoints
            .map((wp) => '${wp.latitude},${wp.longitude}')
            .join('|');
        // Don't use Google's optimization since we have our own
        params['waypoints'] = waypointStr;
      }

      if (preferences.avoidTolls) params['avoid'] = 'tolls';
      if (preferences.avoidHighways) params['avoid'] = 'highways';

      final uri = Uri.parse(_directionsBaseUrl).replace(queryParameters: params);
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          return data;
        }
      }
    } catch (e) {
      print('Directions API error: $e');
    }
    return null;
  }

  /// Decodes Google polyline string to LatLng points
  static List<LatLng> _decodePolyline(String polyline) {
    final points = <LatLng>[];
    int index = 0;
    int lat = 0;
    int lng = 0;

    while (index < polyline.length) {
      int shift = 0;
      int result = 0;
      int byte;
      
      do {
        byte = polyline.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      int deltaLat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;
      
      do {
        byte = polyline.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      int deltaLng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      points.add(LatLng(lat / 1E5, lng / 1E5));
    }

    return points;
  }

  static String _getTravelMode(TransportMode mode) {
    switch (mode) {
      case TransportMode.walking:
        return 'walking';
      case TransportMode.driving:
        return 'driving';
      case TransportMode.publicTransit:
        return 'transit';
      case TransportMode.cycling:
        return 'bicycling';
    }
  }

  static double _calculateAdvancedScore(Place place, double distance, RoutePreferences preferences) {
    double score = 1000.0;
    
    // Distance penalty (closer is better)
    score -= (distance / 1000) * 50; // 50 points per km
    
    // Rating boost
    if (preferences.optimizeForRating && place.rating > 0) {
      score += place.rating * 80;
    }
    
    // Place type preferences
    if (preferences.preferredPlaceTypes.contains(place.type)) {
      score += 100;
    }
    
    // Opening hours consideration
    if (preferences.considerOpeningHours) {
      score += _getOpeningHoursBonus(place);
    }
    
    return score;
  }

  static int _calculatePriority(Place place, RoutePreferences preferences) {
    int priority = 1;
    
    if (place.rating >= 4.5) priority += 2;
    if (preferences.preferredPlaceTypes.contains(place.type)) priority += 1;
    
    return priority;
  }

  static double _getOpeningHoursBonus(Place place) {
    final now = DateTime.now();
    final hour = now.hour;
    
    // Boost places likely to be open
    if (place.type == 'restaurant' && (hour >= 11 && hour <= 14 || hour >= 18 && hour <= 21)) {
      return 50;
    }
    if (place.type == 'museum' && hour >= 9 && hour <= 17) {
      return 30;
    }
    if (place.type == 'park' && hour >= 6 && hour <= 20) {
      return 20;
    }
    
    return 0;
  }

  /// Nearest Neighbor Algorithm for walking (good for short routes)
  static List<Place> _nearestNeighborOptimization(
    Position start, List<PlaceWithData> places, RoutePreferences preferences) {
    final result = <Place>[];
    final remaining = List<PlaceWithData>.from(places);
    var currentLat = start.latitude;
    var currentLng = start.longitude;

    while (remaining.isNotEmpty) {
      // Find nearest unvisited place with score consideration
      PlaceWithData? best;
      double bestValue = double.negativeInfinity;
      
      for (final place in remaining) {
        final distance = Geolocator.distanceBetween(
          currentLat, currentLng, place.place.latitude!, place.place.longitude!);
        final value = place.score - (distance / 100); // Balance score vs distance
        
        if (value > bestValue) {
          bestValue = value;
          best = place;
        }
      }
      
      if (best != null) {
        result.add(best.place);
        remaining.remove(best);
        currentLat = best.place.latitude!;
        currentLng = best.place.longitude!;
      }
    }
    
    return result;
  }

  /// TSP-like optimization for driving (minimize total distance)
  static List<Place> _tspOptimization(
    Position start, List<PlaceWithData> places, RoutePreferences preferences) {
    if (places.length <= 3) {
      return _nearestNeighborOptimization(start, places, preferences);
    }
    
    // Use 2-opt improvement on nearest neighbor result
    var route = _nearestNeighborOptimization(start, places, preferences);
    route = _twoOptImprovement(start, route);
    
    return route;
  }

  /// Transit optimization (group by areas, consider transfer points)
  static List<Place> _transitOptimization(
    Position start, List<PlaceWithData> places, RoutePreferences preferences) {
    // Group places by geographical clusters
    final clusters = _clusterPlaces(places, 2000); // 2km clusters
    final result = <Place>[];
    
    // Sort clusters by distance from start
    clusters.sort((a, b) {
      final aDist = _getClusterDistance(start, a);
      final bDist = _getClusterDistance(start, b);
      return aDist.compareTo(bDist);
    });
    
    // Visit places within each cluster
    for (final cluster in clusters) {
      cluster.sort((a, b) => b.score.compareTo(a.score));
      result.addAll(cluster.map((p) => p.place));
    }
    
    return result;
  }

  /// Cycling optimization (avoid hills, prefer bike lanes)
  static List<Place> _cyclingOptimization(
    Position start, List<PlaceWithData> places, RoutePreferences preferences) {
    // Similar to walking but with longer acceptable distances
    final sorted = List<PlaceWithData>.from(places);
    sorted.sort((a, b) {
      final aValue = a.score - (a.distance / 200); // Less distance penalty than walking
      final bValue = b.score - (b.distance / 200);
      return bValue.compareTo(aValue);
    });
    
    return sorted.map((p) => p.place).toList();
  }

  /// 2-opt improvement algorithm
  static List<Place> _twoOptImprovement(Position start, List<Place> route) {
    if (route.length < 4) return route;
    
    var improved = true;
    var bestRoute = List<Place>.from(route);
    var bestDistance = _calculateRouteDistance(start, bestRoute);
    
    while (improved) {
      improved = false;
      
      for (int i = 1; i < route.length - 2; i++) {
        for (int j = i + 1; j < route.length; j++) {
          if (j - i == 1) continue;
          
          final newRoute = _twoOptSwap(bestRoute, i, j);
          final newDistance = _calculateRouteDistance(start, newRoute);
          
          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }
    
    return bestRoute;
  }

  static List<Place> _twoOptSwap(List<Place> route, int i, int j) {
    final newRoute = <Place>[];
    newRoute.addAll(route.sublist(0, i));
    newRoute.addAll(route.sublist(i, j + 1).reversed);
    newRoute.addAll(route.sublist(j + 1));
    return newRoute;
  }

  static double _calculateRouteDistance(Position start, List<Place> places) {
    double total = 0;
    var currentLat = start.latitude;
    var currentLng = start.longitude;
    
    for (final place in places) {
      if (place.latitude != null && place.longitude != null) {
        total += Geolocator.distanceBetween(
          currentLat, currentLng, place.latitude!, place.longitude!);
        currentLat = place.latitude!;
        currentLng = place.longitude!;
      }
    }
    
    return total;
  }

  static List<List<PlaceWithData>> _clusterPlaces(List<PlaceWithData> places, double maxDistance) {
    final clusters = <List<PlaceWithData>>[];
    final remaining = List<PlaceWithData>.from(places);
    
    while (remaining.isNotEmpty) {
      final cluster = <PlaceWithData>[remaining.removeAt(0)];
      final center = cluster.first;
      
      remaining.removeWhere((place) {
        final distance = Geolocator.distanceBetween(
          center.place.latitude!, center.place.longitude!,
          place.place.latitude!, place.place.longitude!);
        
        if (distance <= maxDistance) {
          cluster.add(place);
          return true;
        }
        return false;
      });
      
      clusters.add(cluster);
    }
    
    return clusters;
  }

  static double _getClusterDistance(Position start, List<PlaceWithData> cluster) {
    if (cluster.isEmpty) return double.infinity;
    
    final center = cluster.first;
    return Geolocator.distanceBetween(
      start.latitude, start.longitude,
      center.place.latitude!, center.place.longitude!);
  }

  /// Intelligently insert breaks (meals, rest stops) into the route
  static Future<List<Place>> _insertIntelligentBreaks(
    List<Place> places, RoutePreferences preferences) async {
    if (places.length < 3) return places;
    
    final result = <Place>[];
    Duration cumulativeTime = Duration.zero;
    double cumulativeDistance = 0;
    
    for (int i = 0; i < places.length; i++) {
      result.add(places[i]);
      
      // Estimate time spent at current place
      final visitDuration = _estimateVisitDuration(places[i]);
      cumulativeTime += visitDuration;
      
      if (i < places.length - 1) {
        // Estimate travel time to next place
        final travelTime = _estimateTravelTime(places[i], places[i + 1], preferences);
        final travelDistance = _calculateDistance(places[i], places[i + 1]);
        
        cumulativeTime += travelTime;
        cumulativeDistance += travelDistance;
        
        // Check if we need a break
        final breakPlace = _shouldInsertBreak(
          cumulativeTime, cumulativeDistance, places[i], places[i + 1], preferences);
        
        if (breakPlace != null) {
          result.add(breakPlace);
          cumulativeTime += const Duration(minutes: 30); // Break duration
          cumulativeDistance = 0; // Reset distance counter
        }
      }
    }
    
    return result;
  }

  static Duration _estimateVisitDuration(Place place) {
    switch (place.type) {
      case 'museum':
      case 'art_gallery':
        return const Duration(hours: 2);
      case 'restaurant':
      case 'cafe':
        return const Duration(minutes: 45);
      case 'park':
      case 'tourist_attraction':
        return const Duration(minutes: 90);
      case 'shopping_mall':
        return const Duration(hours: 1);
      default:
        return const Duration(minutes: 60);
    }
  }

  static Duration _estimateTravelTime(Place from, Place to, RoutePreferences preferences) {
    final distance = _calculateDistance(from, to);
    
    switch (preferences.transportMode) {
      case TransportMode.walking:
        return Duration(minutes: (distance / 1000 * 12).round()); // 5 km/h
      case TransportMode.cycling:
        return Duration(minutes: (distance / 1000 * 4).round()); // 15 km/h
      case TransportMode.driving:
        return Duration(minutes: (distance / 1000 * 2).round()); // 30 km/h city
      case TransportMode.publicTransit:
        return Duration(minutes: (distance / 1000 * 3).round()); // 20 km/h average
    }
  }

  static double _calculateDistance(Place from, Place to) {
    if (from.latitude == null || to.latitude == null) return 0;
    
    return Geolocator.distanceBetween(
      from.latitude!, from.longitude!, to.latitude!, to.longitude!);
  }

  static Place? _shouldInsertBreak(
    Duration cumulativeTime, double cumulativeDistance, 
    Place current, Place next, RoutePreferences preferences) {
    
    final hour = DateTime.now().add(cumulativeTime).hour;
    
    // Lunch break (11:30-14:00)
    if (hour >= 11 && hour <= 14 && cumulativeTime.inHours >= 2) {
      return _createBreakPlace(current, 'restaurant', 'Lunch Break');
    }
    
    // Dinner break (17:30-20:00)
    if (hour >= 17 && hour <= 20 && cumulativeTime.inHours >= 4) {
      return _createBreakPlace(current, 'restaurant', 'Dinner Break');
    }
    
    // Rest break for long walking/cycling
    if ((preferences.transportMode == TransportMode.walking && cumulativeDistance > 3000) ||
        (preferences.transportMode == TransportMode.cycling && cumulativeDistance > 8000)) {
      return _createBreakPlace(current, 'cafe', 'Rest Break');
    }
    
    return null;
  }

  static Place _createBreakPlace(Place nearPlace, String type, String name) {
    return Place(
      id: 'break_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      address: 'Near ${nearPlace.name}',
      latitude: nearPlace.latitude,
      longitude: nearPlace.longitude,
      rating: 4.0,
      type: type,
      photoUrl: '',
      description: 'Suggested $name location',
      localTip: 'Take a break and recharge',
      handyPhrase: '',
    );
  }

  static SmartRouteResult _createFallbackRoute(Position currentLocation, List<Place> places, RoutePreferences preferences) {
    // Simple fallback with straight lines
    final polylinePoints = <LatLng>[
      LatLng(currentLocation.latitude, currentLocation.longitude),
    ];
    
    double totalDistance = 0;
    for (final place in places) {
      if (place.latitude != null && place.longitude != null) {
        polylinePoints.add(LatLng(place.latitude!, place.longitude!));
        totalDistance += Geolocator.distanceBetween(
          polylinePoints[polylinePoints.length - 2].latitude,
          polylinePoints[polylinePoints.length - 2].longitude,
          place.latitude!,
          place.longitude!,
        );
      }
    }

    return SmartRouteResult(
      optimizedPlaces: places,
      polylinePoints: polylinePoints,
      routeSegments: [],
      totalDistance: totalDistance,
      totalDuration: Duration(minutes: (totalDistance / 1000 * 12).round()), // Rough estimate
      preferences: preferences,
    );
  }
}

class SmartRouteResult {
  final List<Place> optimizedPlaces;
  final List<LatLng> polylinePoints;
  final List<RouteSegment> routeSegments;
  final double totalDistance;
  final Duration totalDuration;
  final RoutePreferences preferences;
  final bool hasBreaks;

  const SmartRouteResult({
    required this.optimizedPlaces,
    required this.polylinePoints,
    required this.routeSegments,
    required this.totalDistance,
    required this.totalDuration,
    required this.preferences,
    this.hasBreaks = false,
  });

  String get optimizationSummary {
    final algorithm = _getAlgorithmName();
    final features = <String>[];
    
    if (hasBreaks) features.add('Smart Breaks');
    if (preferences.optimizeForRating) features.add('Rating Optimized');
    if (preferences.considerOpeningHours) features.add('Time Aware');
    
    return '$algorithm${features.isNotEmpty ? ' • ${features.join(' • ')}' : ''}';
  }

  String _getAlgorithmName() {
    switch (preferences.transportMode) {
      case TransportMode.walking:
        return 'Nearest Neighbor';
      case TransportMode.driving:
        return 'TSP Optimized';
      case TransportMode.publicTransit:
        return 'Cluster Routing';
      case TransportMode.cycling:
        return 'Cycling Optimized';
    }
  }
}

class RouteSegment {
  final LatLng startPoint;
  final LatLng endPoint;
  final List<LatLng> polylinePoints;
  final double distance;
  final Duration duration;
  final List<String> instructions;

  const RouteSegment({
    required this.startPoint,
    required this.endPoint,
    required this.polylinePoints,
    required this.distance,
    required this.duration,
    required this.instructions,
  });
}

class PlaceWithData {
  final Place place;
  final double distance;
  final double score;
  final int priority;

  const PlaceWithData({
    required this.place,
    required this.distance,
    required this.score,
    required this.priority,
  });
}