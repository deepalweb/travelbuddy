import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/place.dart';
import '../providers/app_provider.dart';

enum RouteStatus { notStarted, active, paused, completed }
enum PlaceStatus { pending, approaching, visited }

class RouteTrackingService extends ChangeNotifier {
  static final RouteTrackingService _instance = RouteTrackingService._internal();
  factory RouteTrackingService() => _instance;
  RouteTrackingService._internal();

  // Tracking state
  RouteStatus _status = RouteStatus.notStarted;
  List<Place> _places = [];
  Map<String, PlaceStatus> _placeStatuses = {};
  Position? _currentLocation;
  int _currentTargetIndex = 0;
  StreamSubscription<Position>? _locationSubscription;
  DateTime? _routeStartTime;
  List<Position> _routePath = [];

  // Geofencing settings
  static const double _arrivalRadius = 100.0; // meters
  static const int _minStayDuration = 120; // seconds
  Map<String, DateTime?> _arrivalTimes = {};

  // Getters
  RouteStatus get status => _status;
  List<Place> get places => _places;
  Map<String, PlaceStatus> get placeStatuses => _placeStatuses;
  Position? get currentLocation => _currentLocation;
  Place? get currentTarget => _currentTargetIndex < _places.length ? _places[_currentTargetIndex] : null;
  int get completedCount => _placeStatuses.values.where((s) => s == PlaceStatus.visited).length;
  double get progressPercentage => _places.isEmpty ? 0 : (completedCount / _places.length) * 100;
  Duration? get routeDuration => _routeStartTime != null ? DateTime.now().difference(_routeStartTime!) : null;

  /// Initialize route with places
  void initializeRoute(List<Place> places) {
    _places = places;
    _placeStatuses = {for (var place in places) place.id: PlaceStatus.pending};
    _currentTargetIndex = 0;
    _status = RouteStatus.notStarted;
    _arrivalTimes.clear();
    _routePath.clear();
    notifyListeners();
  }

  /// Start route tracking
  Future<bool> startRoute() async {
    if (_places.isEmpty) return false;

    try {
      // Check location permissions
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        final requested = await Geolocator.requestPermission();
        if (requested == LocationPermission.denied) return false;
      }

      // Start location tracking
      _locationSubscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10, // Update every 10 meters
        ),
      ).listen(_onLocationUpdate);

      _status = RouteStatus.active;
      _routeStartTime = DateTime.now();
      _updateCurrentTarget();
      notifyListeners();
      return true;
    } catch (e) {
      print('Error starting route: $e');
      return false;
    }
  }

  /// Stop route tracking
  void stopRoute() {
    _locationSubscription?.cancel();
    _status = RouteStatus.notStarted;
    _routeStartTime = null;
    notifyListeners();
  }

  /// Pause route tracking
  void pauseRoute() {
    _locationSubscription?.pause();
    _status = RouteStatus.paused;
    notifyListeners();
  }

  /// Resume route tracking
  void resumeRoute() {
    _locationSubscription?.resume();
    _status = RouteStatus.active;
    notifyListeners();
  }

  /// Handle location updates
  void _onLocationUpdate(Position position) {
    _currentLocation = position;
    _routePath.add(position);
    
    // Check if user has arrived at any place
    _checkPlaceArrivals(position);
    
    // Update current target
    _updateCurrentTarget();
    
    notifyListeners();
  }

  /// Check if user has arrived at any unvisited places
  void _checkPlaceArrivals(Position userLocation) {
    for (int i = 0; i < _places.length; i++) {
      final place = _places[i];
      final status = _placeStatuses[place.id];
      
      if (status == PlaceStatus.visited) continue;
      if (place.latitude == null || place.longitude == null) continue;

      final distance = Geolocator.distanceBetween(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude!,
        place.longitude!,
      );

      if (distance <= _arrivalRadius) {
        // User is within arrival radius
        if (_arrivalTimes[place.id] == null) {
          _arrivalTimes[place.id] = DateTime.now();
          _placeStatuses[place.id] = PlaceStatus.approaching;
        } else {
          // Check if user has stayed long enough
          final stayDuration = DateTime.now().difference(_arrivalTimes[place.id]!);
          if (stayDuration.inSeconds >= _minStayDuration) {
            _markPlaceAsVisited(place.id);
          }
        }
      } else {
        // User left the area before completing visit
        if (_arrivalTimes[place.id] != null && status == PlaceStatus.approaching) {
          _arrivalTimes[place.id] = null;
          _placeStatuses[place.id] = PlaceStatus.pending;
        }
      }
    }
  }

  /// Mark place as visited
  void _markPlaceAsVisited(String placeId) {
    _markPlaceAsVisitedWithSync(placeId);
  }

  /// Save place visit status to database
  Future<void> _savePlaceVisitToDatabase(String placeId) async {
    try {
      // Find matching place
      final place = _places.firstWhere((p) => p.id == placeId);
      
      // Save route tracking data
      await _saveRouteTrackingData({
        'placeId': placeId,
        'placeName': place.name,
        'visitedAt': DateTime.now().toIso8601String(),
        'location': {
          'latitude': _currentLocation?.latitude,
          'longitude': _currentLocation?.longitude,
        },
        'routeStatus': _status.name,
      });
      
      print('✅ Saved place visit to database: ${place.name}');
    } catch (e) {
      print('❌ Failed to save place visit: $e');
    }
  }

  /// Save route completion to database
  Future<void> _saveRouteCompletionToDatabase() async {
    try {
      final stats = getRouteStats();
      await _saveRouteTrackingData({
        'routeCompleted': true,
        'completedAt': DateTime.now().toIso8601String(),
        'totalDistance': stats['totalDistance'],
        'duration': stats['duration']?.inMinutes,
        'visitedPlaces': stats['visitedPlaces'],
        'routePath': _routePath.map((p) => {
          'lat': p.latitude,
          'lng': p.longitude,
          'timestamp': DateTime.now().toIso8601String(),
        }).toList(),
      });
      
      print('✅ Saved route completion to database');
    } catch (e) {
      print('❌ Failed to save route completion: $e');
    }
  }

  /// Generic method to save route tracking data
  Future<void> _saveRouteTrackingData(Map<String, dynamic> data) async {
    // TODO: Implement actual database saving
    // This should integrate with your existing storage service
    print('💾 Route tracking data to save: $data');
  }

  /// Sync route tracking with trip plan (NEW)
  String? _currentTripPlanId;
  AppProvider? _appProvider;

  /// Initialize with trip plan context
  void initializeWithTripPlan(List<Place> places, String tripPlanId, AppProvider appProvider) {
    _currentTripPlanId = tripPlanId;
    _appProvider = appProvider;
    initializeRoute(places);
  }

  /// Enhanced mark place as visited with trip plan sync
  void _markPlaceAsVisitedWithSync(String placeId) async {
    _placeStatuses[placeId] = PlaceStatus.visited;
    _arrivalTimes[placeId] = null;
    
    // Save to database
    await _savePlaceVisitToDatabase(placeId);
    
    // NEW: Sync with trip plan
    await _syncWithTripPlan(placeId);
    
    // Check if route is completed
    if (completedCount == _places.length) {
      _status = RouteStatus.completed;
      _locationSubscription?.cancel();
      await _saveRouteCompletionToDatabase();
    }
    
    notifyListeners();
  }

  /// Sync place visit with trip plan
  Future<void> _syncWithTripPlan(String placeId) async {
    if (_currentTripPlanId == null || _appProvider == null) return;
    
    try {
      // Find matching place in trip plan
      final place = _places.firstWhere((p) => p.id == placeId);
      
      // Find matching activity in trip plan by name
      final tripPlan = _appProvider!.tripPlans.firstWhere(
        (tp) => tp.id == _currentTripPlanId,
        orElse: () => throw 'Trip plan not found',
      );
      
      // Search for matching activity
      for (int dayIndex = 0; dayIndex < tripPlan.dailyPlans.length; dayIndex++) {
        for (int activityIndex = 0; activityIndex < tripPlan.dailyPlans[dayIndex].activities.length; activityIndex++) {
          final activity = tripPlan.dailyPlans[dayIndex].activities[activityIndex];
          
          // Match by name or location
          if (activity.activityTitle.contains(place.name) || 
              place.name.contains(activity.activityTitle) ||
              (activity.fullAddress?.contains(place.address) == true)) {
            
            // Update trip plan activity status
            await _appProvider!.updateActivityVisitedStatus(
              _currentTripPlanId!,
              dayIndex,
              activityIndex,
              true,
            );
            
            print('✅ Synced route tracking → trip plan: ${place.name}');
            return;
          }
        }
      }
      
      print('⚠️ No matching activity found in trip plan for: ${place.name}');
    } catch (e) {
      print('❌ Failed to sync with trip plan: $e');
    }
  }



  /// Manually mark place as visited
  void markPlaceVisited(String placeId) {
    _markPlaceAsVisited(placeId);
  }

  /// Load existing visit status from trip plan
  void loadVisitStatusFromTripPlan() {
    if (_currentTripPlanId == null || _appProvider == null) return;
    
    try {
      final tripPlan = _appProvider!.tripPlans.firstWhere(
        (tp) => tp.id == _currentTripPlanId,
      );
      
      // Update route tracking status based on trip plan
      for (final place in _places) {
        for (final day in tripPlan.dailyPlans) {
          for (final activity in day.activities) {
            if (activity.activityTitle.contains(place.name) && activity.isVisited) {
              _placeStatuses[place.id] = PlaceStatus.visited;
              print('📋 Loaded visit status from trip plan: ${place.name}');
            }
          }
        }
      }
      
      notifyListeners();
    } catch (e) {
      print('❌ Failed to load visit status from trip plan: $e');
    }
  }

  /// Load route tracking data from database (NEW)
  Future<void> loadRouteDataFromDatabase(String tripPlanId) async {
    try {
      // Load saved route tracking data
      final routeData = await _loadRouteTrackingFromDatabase(tripPlanId);
      
      if (routeData != null) {
        // Restore route status
        _status = RouteStatus.values.firstWhere(
          (s) => s.name == routeData['status'],
          orElse: () => RouteStatus.notStarted,
        );
        
        // Restore place visit statuses
        final visitedPlaces = routeData['visitedPlaces'] as List<String>? ?? [];
        for (final placeId in visitedPlaces) {
          _placeStatuses[placeId] = PlaceStatus.visited;
        }
        
        // Restore route statistics
        if (routeData['routeStartTime'] != null) {
          _routeStartTime = DateTime.parse(routeData['routeStartTime']);
        }
        
        print('🔄 Restored route data from database: ${visitedPlaces.length} places visited');
        notifyListeners();
      }
    } catch (e) {
      print('❌ Failed to load route data from database: $e');
    }
  }

  /// Load route tracking data from database
  Future<Map<String, dynamic>?> _loadRouteTrackingFromDatabase(String tripPlanId) async {
    // TODO: Implement actual database loading
    // This should integrate with your existing storage service
    print('📖 Loading route tracking data for trip: $tripPlanId');
    return null; // Placeholder
  }

  /// Save current route state to database
  Future<void> saveRouteStateToDatabase() async {
    if (_currentTripPlanId == null) return;
    
    try {
      final routeState = {
        'tripPlanId': _currentTripPlanId,
        'status': _status.name,
        'visitedPlaces': _placeStatuses.entries
            .where((e) => e.value == PlaceStatus.visited)
            .map((e) => e.key)
            .toList(),
        'routeStartTime': _routeStartTime?.toIso8601String(),
        'lastUpdated': DateTime.now().toIso8601String(),
      };
      
      await _saveRouteTrackingData(routeState);
      print('💾 Saved route state to database');
    } catch (e) {
      print('❌ Failed to save route state: $e');
    }
  }

  /// Update current target to next unvisited place
  void _updateCurrentTarget() {
    for (int i = 0; i < _places.length; i++) {
      if (_placeStatuses[_places[i].id] != PlaceStatus.visited) {
        _currentTargetIndex = i;
        return;
      }
    }
    _currentTargetIndex = _places.length; // All completed
  }

  /// Get distance to current target
  double? getDistanceToCurrentTarget() {
    if (currentTarget == null || _currentLocation == null) return null;
    if (currentTarget!.latitude == null || currentTarget!.longitude == null) return null;

    return Geolocator.distanceBetween(
      _currentLocation!.latitude,
      _currentLocation!.longitude,
      currentTarget!.latitude!,
      currentTarget!.longitude!,
    );
  }

  /// Get ETA to current target (assuming 5 km/h walking speed)
  Duration? getETAToCurrentTarget() {
    final distance = getDistanceToCurrentTarget();
    if (distance == null) return null;
    
    const walkingSpeedKmh = 5.0;
    final hours = (distance / 1000) / walkingSpeedKmh;
    return Duration(minutes: (hours * 60).round());
  }

  /// Get route statistics
  Map<String, dynamic> getRouteStats() {
    double totalDistance = 0;
    if (_routePath.length > 1) {
      for (int i = 1; i < _routePath.length; i++) {
        totalDistance += Geolocator.distanceBetween(
          _routePath[i - 1].latitude,
          _routePath[i - 1].longitude,
          _routePath[i].latitude,
          _routePath[i].longitude,
        );
      }
    }

    return {
      'totalDistance': totalDistance,
      'visitedPlaces': completedCount,
      'totalPlaces': _places.length,
      'duration': routeDuration,
      'progress': progressPercentage,
    };
  }

  /// Reset tracking service
  void reset() {
    stopRoute();
    _places.clear();
    _placeStatuses.clear();
    _currentTargetIndex = 0;
    _arrivalTimes.clear();
    _routePath.clear();
    _currentLocation = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _locationSubscription?.cancel();
    super.dispose();
  }
}