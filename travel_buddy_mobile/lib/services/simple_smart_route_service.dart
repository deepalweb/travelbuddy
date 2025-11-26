import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/place.dart';
import '../models/route_models.dart';
import '../config/environment.dart';

class SimpleSmartRouteService {
  
  /// Creates optimized route with real roads
  static Future<SimpleRouteResult> createRoute({
    required Position currentLocation,
    required List<Place> places,
    TransportMode mode = TransportMode.walking,
  }) async {
    try {
      // 1. Order places by distance (nearest first)
      final orderedPlaces = _orderPlacesByDistance(currentLocation, places);
      
      // 2. Get real road directions
      final directions = await _getDirections(
        currentLocation: currentLocation,
        places: orderedPlaces,
        mode: mode,
      );
      
      if (directions != null) {
        return SimpleRouteResult(
          places: orderedPlaces,
          polylinePoints: directions.polylinePoints,
          totalDistance: directions.totalDistance,
          totalDuration: directions.totalDuration,
          transportMode: mode,
          steps: directions.steps,
        );
      }
    } catch (e) {
      print('Route error: $e');
    }
    
    // Fallback to simple route
    return _createSimpleRoute(currentLocation, places, mode);
  }
  
  /// Order places by distance from current location
  static List<Place> _orderPlacesByDistance(Position currentLocation, List<Place> places) {
    final placesWithDistance = places.where((p) => p.latitude != null && p.longitude != null).map((place) {
      final distance = Geolocator.distanceBetween(
        currentLocation.latitude,
        currentLocation.longitude,
        place.latitude!,
        place.longitude!,
      );
      return _PlaceDistance(place, distance);
    }).toList();
    
    placesWithDistance.sort((a, b) => a.distance.compareTo(b.distance));
    return placesWithDistance.map((pd) => pd.place).toList();
  }
  
  /// Get directions from Azure backend
  static Future<_DirectionsResult?> _getDirections({
    required Position currentLocation,
    required List<Place> places,
    required TransportMode mode,
  }) async {
    if (places.isEmpty) return null;
    
    try {
      final origin = '${currentLocation.latitude},${currentLocation.longitude}';
      final destination = '${places.last.latitude},${places.last.longitude}';
      
      String waypoints = '';
      if (places.length > 1) {
        final waypointList = places.sublist(0, places.length - 1)
            .map((p) => '${p.latitude},${p.longitude}')
            .join('|');
        waypoints = waypointList;
      }
      
      // Use Azure backend for directions
      final requestBody = {
        'origin': origin,
        'destination': destination,
        'mode': _getModeString(mode),
        if (waypoints.isNotEmpty) 'waypoints': waypoints,
      };
      
      final azureUrl = '${Environment.backendUrl}/api/routes/directions';
      print('🔄 Requesting Azure directions: $azureUrl');
      
      final response = await http.post(
        Uri.parse(azureUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestBody),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Azure Directions response: ${data['status']}');
        
        if (data['status'] == 'OK' && data['routes'] != null && data['routes'].isNotEmpty) {
          final route = data['routes'][0];
          final polylinePoints = _decodePolyline(route['overview_polyline']['points']);
          
          double totalDistance = 0;
          Duration totalDuration = Duration.zero;
          
          for (final leg in route['legs']) {
            totalDistance += (leg['distance']['value'] as num).toDouble();
            totalDuration += Duration(seconds: leg['duration']['value']);
          }
          
          // Extract turn-by-turn steps
          final steps = <RouteStep>[];
          for (final leg in route['legs']) {
            for (final step in leg['steps']) {
              steps.add(RouteStep(
                instruction: step['html_instructions'].toString().replaceAll(RegExp(r'<[^>]*>'), ''),
                distance: step['distance']['text'],
                duration: step['duration']['text'],
                maneuver: step['maneuver'] ?? 'straight',
              ));
            }
          }
          
          print('✅ Azure Directions success: ${polylinePoints.length} points, ${steps.length} steps, ${(totalDistance/1000).toStringAsFixed(1)}km');
          
          return _DirectionsResult(
            polylinePoints: polylinePoints,
            totalDistance: totalDistance,
            totalDuration: totalDuration,
            steps: steps,
          );
        } else {
          print('⚠️ Azure Directions error: ${data['status']} - ${data['error_message'] ?? 'Unknown error'}');
        }
      } else {
        print('❌ Azure HTTP error: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Azure Directions API error: $e');
    }
    
    return null;
  }
  
  /// Decode Google polyline to LatLng points
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
  
  static String _getModeString(TransportMode mode) {
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
  
  /// Create simple fallback route with curved paths
  static SimpleRouteResult _createSimpleRoute(Position currentLocation, List<Place> places, TransportMode mode) {
    final orderedPlaces = _orderPlacesByDistance(currentLocation, places);
    
    final polylinePoints = <LatLng>[
      LatLng(currentLocation.latitude, currentLocation.longitude),
    ];
    
    double totalDistance = 0;
    
    for (final place in orderedPlaces) {
      if (place.latitude != null && place.longitude != null) {
        // Add intermediate points for smoother route visualization
        if (polylinePoints.isNotEmpty) {
          final lastPoint = polylinePoints.last;
          final intermediatePoints = _generateIntermediatePoints(
            lastPoint,
            LatLng(place.latitude!, place.longitude!),
          );
          polylinePoints.addAll(intermediatePoints);
        }
        
        polylinePoints.add(LatLng(place.latitude!, place.longitude!));
        
        if (polylinePoints.length > 1) {
          totalDistance += Geolocator.distanceBetween(
            polylinePoints[polylinePoints.length - 2].latitude,
            polylinePoints[polylinePoints.length - 2].longitude,
            place.latitude!,
            place.longitude!,
          );
        }
      }
    }
    
    // Estimate duration based on transport mode
    Duration totalDuration;
    switch (mode) {
      case TransportMode.walking:
        totalDuration = Duration(minutes: (totalDistance / 1000 * 12).round());
        break;
      case TransportMode.cycling:
        totalDuration = Duration(minutes: (totalDistance / 1000 * 4).round());
        break;
      case TransportMode.driving:
        totalDuration = Duration(minutes: (totalDistance / 1000 * 2).round());
        break;
      case TransportMode.publicTransit:
        totalDuration = Duration(minutes: (totalDistance / 1000 * 3).round());
        break;
    }
    
    print('Using fallback route: ${polylinePoints.length} points, ${(totalDistance/1000).toStringAsFixed(1)}km');
    
    return SimpleRouteResult(
      places: orderedPlaces,
      polylinePoints: polylinePoints,
      totalDistance: totalDistance,
      totalDuration: totalDuration,
      transportMode: mode,
    );
  }
  
  /// Generate intermediate points for smoother route lines
  static List<LatLng> _generateIntermediatePoints(LatLng start, LatLng end) {
    final points = <LatLng>[];
    const steps = 3; // Number of intermediate points
    
    for (int i = 1; i <= steps; i++) {
      final ratio = i / (steps + 1);
      final lat = start.latitude + (end.latitude - start.latitude) * ratio;
      final lng = start.longitude + (end.longitude - start.longitude) * ratio;
      points.add(LatLng(lat, lng));
    }
    
    return points;
  }
}

class SimpleRouteResult {
  final List<Place> places;
  final List<LatLng> polylinePoints;
  final double totalDistance;
  final Duration totalDuration;
  final TransportMode transportMode;
  final List<RouteStep> steps;

  const SimpleRouteResult({
    required this.places,
    required this.polylinePoints,
    required this.totalDistance,
    required this.totalDuration,
    required this.transportMode,
    this.steps = const [],
  });
  
  String get distanceText => '${(totalDistance / 1000).toStringAsFixed(1)} km';
  
  String get durationText {
    final hours = totalDuration.inHours;
    final minutes = totalDuration.inMinutes % 60;
    return hours > 0 ? '${hours}h ${minutes}m' : '${minutes}m';
  }
}

class _PlaceDistance {
  final Place place;
  final double distance;
  
  const _PlaceDistance(this.place, this.distance);
}

class _DirectionsResult {
  final List<LatLng> polylinePoints;
  final double totalDistance;
  final Duration totalDuration;
  final List<RouteStep> steps;
  
  const _DirectionsResult({
    required this.polylinePoints,
    required this.totalDistance,
    required this.totalDuration,
    this.steps = const [],
  });
}

class RouteStep {
  final String instruction;
  final String distance;
  final String duration;
  final String maneuver;
  
  const RouteStep({
    required this.instruction,
    required this.distance,
    required this.duration,
    required this.maneuver,
  });
}