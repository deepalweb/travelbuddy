import 'dart:async';
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../models/enhanced_activity.dart' hide ActivityType;
import '../models/enhanced_activity.dart' as EA;

class LocationAlertService {
  // API key removed - using backend endpoint instead
  static StreamSubscription<Position>? _locationSubscription;
  static List<EnhancedActivity> _currentPlan = [];
  static Function(String, List<Map<String, dynamic>>)? _onNearbyPlacesFound;
  static Function(String)? _onDestinationReached;
  
  // Start monitoring location for active plan
  static Future<void> startLocationMonitoring({
    required List<EnhancedActivity> dayPlan,
    required Function(String, List<Map<String, dynamic>>) onNearbyPlacesFound,
    required Function(String) onDestinationReached,
  }) async {
    _currentPlan = dayPlan;
    _onNearbyPlacesFound = onNearbyPlacesFound;
    _onDestinationReached = onDestinationReached;
    
    print('🎯 Starting location monitoring for ${dayPlan.length} activities');
    
    // Check location permissions
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      print('❌ Location services disabled');
      return;
    }
    
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        print('❌ Location permissions denied');
        return;
      }
    }
    
    // Start location stream
    _locationSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 50, // Update every 50 meters
      ),
    ).listen(_onLocationUpdate);
    
    print('✅ Location monitoring started');
  }
  
  static void _onLocationUpdate(Position position) {
    print('📍 Location update: ${position.latitude}, ${position.longitude}');
    
    // Check if near any planned destinations
    _checkNearDestinations(position);
    
    // Find nearby places while traveling
    _findNearbyPlaces(position);
  }
  
  static void _checkNearDestinations(Position position) {
    for (final activity in _currentPlan) {
      final distance = _calculateDistance(
        position.latitude,
        position.longitude,
        activity.location.latitude,
        activity.location.longitude,
      );
      
      // Alert when within 200m of destination
      if (distance <= 0.2) {
        print('🎯 Arrived at: ${activity.title}');
        _onDestinationReached?.call(activity.title);
        break;
      }
      
      // Alert when approaching (500m away)
      if (distance <= 0.5 && distance > 0.2) {
        print('🚶 Approaching: ${activity.title} (${(distance * 1000).round()}m away)');
        _onDestinationReached?.call('Approaching ${activity.title}');
        break;
      }
    }
  }
  
  static Future<void> _findNearbyPlaces(Position position) async {
    try {
      // Find interesting places within 300m while traveling
      final nearbyPlaces = await _searchNearbyPlaces(
        position.latitude,
        position.longitude,
        radius: 300,
      );
      
      if (nearbyPlaces.isNotEmpty) {
        print('🔍 Found ${nearbyPlaces.length} nearby places');
        
        // Filter out places already in plan
        final newPlaces = nearbyPlaces.where((place) {
          return !_currentPlan.any((activity) => 
            activity.title.toLowerCase().contains(place['name'].toLowerCase())
          );
        }).toList();
        
        if (newPlaces.isNotEmpty) {
          _onNearbyPlacesFound?.call('Nearby discoveries', newPlaces);
        }
      }
    } catch (e) {
      print('❌ Error finding nearby places: $e');
    }
  }
  
  static Future<List<Map<String, dynamic>>> _searchNearbyPlaces(
    double lat,
    double lng, {
    int radius = 300,
  }) async {
    final url = '${Environment.backendUrl}/api/places/nearby'
        '?lat=$lat&lng=$lng'
        '&radius=$radius'
        '&type=tourist_attraction|restaurant|museum|park';
    
    final response = await http.get(Uri.parse(url));
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['status'] == 'OK') {
        return (data['results'] as List).take(5).map((place) => {
          'name': place['name'],
          'address': place['vicinity'] ?? '',
          'rating': place['rating'] ?? 4.0,
          'types': place['types'] ?? [],
          'distance': _calculateDistance(lat, lng, 
            place['geometry']['location']['lat'], 
            place['geometry']['location']['lng']
          ) * 1000, // meters
          'place_id': place['place_id'],
        }).toList();
      }
    }
    
    return [];
  }
  
  // Add discovered place to current plan
  static EnhancedActivity createQuickActivity(
    Map<String, dynamic> place,
    String timeSlot,
  ) {
    return EnhancedActivity(
      id: 'discovered_${DateTime.now().millisecondsSinceEpoch}',
      title: place['name'],
      description: 'Discovered nearby: ${place['name']}. Quick stop while traveling to your next destination.',
      timeSlot: timeSlot,
      estimatedDuration: Duration(minutes: 30),
      type: _getActivityTypeFromPlace(place['types']),
      location: Location(
        address: place['address'],
        latitude: 0.0,
        longitude: 0.0,
      ),
      costInfo: CostInfo(
        entryFee: 0.0,
        currency: '\$',
        mealCosts: {},
        transportCost: 0.0,
        paymentMethods: ['Card'],
        hasDiscounts: true,
      ),
      travelInfo: TravelInfo(
        fromPrevious: 'Current Location',
        travelTime: Duration(minutes: 5),
        recommendedMode: TransportMode.walk,
        estimatedCost: 0.0,
        routeInstructions: 'Quick detour to ${place['name']}',
        isAccessible: true,
      ),
      images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000'],
      contextInfo: ContextualInfo(
        crowdLevel: 'Unknown',
        bestTimeToVisit: 'Now (discovered nearby)',
        weatherTips: ['Quick stop, weather flexible'],
        localTips: [
          'Discovered while traveling',
          'Rated ${place['rating']}/5 by visitors',
          'Quick ${(place['distance'] as double).round()}m detour'
        ],
        safetyAlerts: [],
        isIndoorActivity: false,
      ),
      actionableLinks: [
        ActionableLink(
          title: 'Quick Directions',
          url: 'https://maps.google.com/?q=${Uri.encodeComponent(place['name'])}',
          type: ActionType.map,
        ),
        ActionableLink(
          title: 'Add to Plan',
          url: 'internal://add-to-plan',
          type: ActionType.tickets,
        ),
      ],
    );
  }
  
  static EA.ActivityType _getActivityTypeFromPlace(List<dynamic> types) {
    for (final type in types) {
      switch (type.toString()) {
        case 'restaurant':
        case 'food':
          return EA.ActivityType.restaurant;
        case 'museum':
          return EA.ActivityType.museum;
        case 'park':
          return EA.ActivityType.nature;
        case 'shopping_mall':
          return EA.ActivityType.shopping;
        case 'night_club':
        case 'bar':
          return EA.ActivityType.entertainment;
        default:
          continue;
      }
    }
    return EA.ActivityType.landmark;
  }
  
  static double _calculateDistance(double lat1, double lng1, double lat2, double lng2) {
    return Geolocator.distanceBetween(lat1, lng1, lat2, lng2) / 1000; // km
  }
  
  static void stopLocationMonitoring() {
    _locationSubscription?.cancel();
    _locationSubscription = null;
    _currentPlan.clear();
    print('🛑 Location monitoring stopped');
  }
}