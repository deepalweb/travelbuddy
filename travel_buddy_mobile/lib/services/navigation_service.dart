import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/place.dart';

class NavigationService {
  static StreamSubscription<Position>? _positionStream;
  static Function(Position)? _onLocationUpdate;
  static List<LatLng>? _routePoints;
  static int _currentWaypointIndex = 0;
  
  /// Start real-time navigation
  static Future<void> startNavigation({
    required List<Place> places,
    required List<LatLng> routePoints,
    required Function(Position) onLocationUpdate,
  }) async {
    _routePoints = routePoints;
    _onLocationUpdate = onLocationUpdate;
    _currentWaypointIndex = 0;
    
    // Request location permissions
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    
    if (permission == LocationPermission.whileInUse || 
        permission == LocationPermission.always) {
      
      // Start location tracking
      const locationSettings = LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Update every 10 meters
      );
      
      _positionStream = Geolocator.getPositionStream(
        locationSettings: locationSettings,
      ).listen((Position position) {
        _handleLocationUpdate(position);
      });
    }
  }
  
  /// Handle location updates during navigation
  static void _handleLocationUpdate(Position position) {
    if (_onLocationUpdate != null) {
      _onLocationUpdate!(position);
    }
    
    // Check if user reached next waypoint
    _checkWaypointProgress(position);
  }
  
  /// Check if user has reached the next waypoint
  static void _checkWaypointProgress(Position position) {
    if (_routePoints == null || _currentWaypointIndex >= _routePoints!.length) {
      return;
    }
    
    final currentWaypoint = _routePoints![_currentWaypointIndex];
    final distance = Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      currentWaypoint.latitude,
      currentWaypoint.longitude,
    );
    
    // If within 50 meters of waypoint, move to next
    if (distance < 50) {
      _currentWaypointIndex++;
      
      if (_currentWaypointIndex >= _routePoints!.length) {
        // Navigation complete
        stopNavigation();
      }
    }
  }
  
  /// Get navigation instructions
  static String getNavigationInstruction(Position currentPosition) {
    if (_routePoints == null || _currentWaypointIndex >= _routePoints!.length) {
      return 'Navigation complete';
    }
    
    final nextWaypoint = _routePoints![_currentWaypointIndex];
    final distance = Geolocator.distanceBetween(
      currentPosition.latitude,
      currentPosition.longitude,
      nextWaypoint.latitude,
      nextWaypoint.longitude,
    );
    
    if (distance < 100) {
      return 'Approaching destination (${distance.round()}m)';
    } else if (distance < 500) {
      return 'Continue straight (${distance.round()}m)';
    } else {
      return 'Follow route (${(distance / 1000).toStringAsFixed(1)}km)';
    }
  }
  
  /// Stop navigation
  static void stopNavigation() {
    _positionStream?.cancel();
    _positionStream = null;
    _onLocationUpdate = null;
    _routePoints = null;
    _currentWaypointIndex = 0;
  }
  
  /// Check if navigation is active
  static bool get isNavigating => _positionStream != null;
}