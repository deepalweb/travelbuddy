import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/enhanced_activity.dart';
import '../constants/app_constants.dart';
import 'gemini_trip_service.dart';

class IntegratedTripService {
  static Future<List<EnhancedActivity>> generateIntegratedDayPlan({
    required String destination,
    required String interests,
    required String pace,
    required List<String> dietaryPreferences,
    required bool isAccessible,
    String? weather,
  }) async {
    print('🌐 Using integrated Google Places + AI for: $destination');
    
    try {
      // Try integrated backend first
      final response = await _callIntegratedPlanningAPI({
        'destination': destination,
        'interests': interests,
        'pace': pace,
        'dietary_preferences': dietaryPreferences,
        'is_accessible': isAccessible,
        'weather': weather,
      });
      
      final activities = _parseIntegratedResponse(response, destination);
      
      print('✅ Generated ${activities.length} activities with integrated service');
      return activities;
      
    } catch (e) {
      print('❌ Integrated service error: $e, falling back to Gemini');
      return GeminiTripService.generatePremiumDayPlan(
        destination: destination,
        interests: interests,
        pace: pace,
        dietaryPreferences: dietaryPreferences,
        isAccessible: isAccessible,
        weather: weather,
      );
    }
  }

  static Future<String> _callIntegratedPlanningAPI(Map<String, dynamic> request) async {
    try {
      print('🌐 Calling integrated planning API');
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/plans/generate-day'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(request),
      );
      
      if (response.statusCode == 200) {
        return response.body;
      } else {
        throw Exception('Integrated API failed: ${response.statusCode}');
      }
    } catch (e) {
      print('🔴 Integrated API call failed: $e');
      rethrow;
    }
  }

  static List<EnhancedActivity> _parseIntegratedResponse(String response, String destination) {
    try {
      final data = json.decode(response);
      final activities = <EnhancedActivity>[];
      
      if (data['dayPlan'] != null && data['dayPlan']['activities'] != null) {
        final activitiesList = data['dayPlan']['activities'] as List;
        
        for (int i = 0; i < activitiesList.length; i++) {
          final activityData = activitiesList[i];
          activities.add(_createActivityFromIntegratedData(activityData, i, destination));
        }
      }
      
      return activities.isNotEmpty ? activities : _createFallbackActivities(destination);
    } catch (e) {
      print('❌ Error parsing integrated response: $e');
      return _createFallbackActivities(destination);
    }
  }

  static EnhancedActivity _createActivityFromIntegratedData(Map<String, dynamic> data, int index, String destination) {
    return EnhancedActivity(
      id: data['google_place_id'] ?? 'integrated_${index + 1}',
      title: data['name'] ?? 'Activity ${index + 1}',
      description: data['highlight'] ?? data['practical_tip'] ?? 'Explore this location',
      timeSlot: '${data['start_time'] ?? '09:00'}-${data['end_time'] ?? '11:00'}',
      estimatedDuration: Duration(minutes: data['estimated_visit_duration_min'] ?? 120),
      type: _mapStringToActivityType(data['category'] ?? 'landmark'),
      location: Location(
        address: data['address'] ?? '$destination, ${data['name']}',
        latitude: data['lat']?.toDouble() ?? 0.0,
        longitude: data['lng']?.toDouble() ?? 0.0,
      ),
      costInfo: CostInfo(
        entryFee: data['cost_estimate_usd']?.toDouble() ?? 0.0,
        currency: '\$',
        mealCosts: {},
        transportCost: 0.0,
        paymentMethods: ['Card', 'Cash'],
        hasDiscounts: false,
      ),
      travelInfo: TravelInfo(
        fromPrevious: index == 0 ? 'Starting Point' : 'Previous Location',
        travelTime: Duration(minutes: data['travel_time_min'] ?? 15),
        recommendedMode: _mapStringToTransportMode(data['travel_mode'] ?? 'walking'),
        estimatedCost: 0.0,
        routeInstructions: 'Navigate to ${data['name']}',
        isAccessible: true,
      ),
      images: [data['photo_url'] ?? 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000'],
      contextInfo: ContextualInfo(
        crowdLevel: data['crowd_level'] ?? 'Moderate',
        bestTimeToVisit: data['best_time'] ?? 'Anytime',
        weatherTips: [],
        localTips: [data['practical_tip'] ?? 'Enjoy your visit'],
        safetyAlerts: [],
        isIndoorActivity: data['category'] == 'museum' || data['category'] == 'restaurant',
      ),
      actionableLinks: [
        ActionableLink(
          title: 'Directions',
          url: 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(data['name'] ?? destination)}',
          type: ActionType.map,
        ),
      ],
    );
  }

  static ActivityType _mapStringToActivityType(String type) {
    switch (type.toLowerCase()) {
      case 'restaurant': return ActivityType.restaurant;
      case 'museum': return ActivityType.museum;
      case 'nature': return ActivityType.nature;
      case 'shopping': return ActivityType.shopping;
      case 'entertainment': return ActivityType.entertainment;
      default: return ActivityType.landmark;
    }
  }

  static TransportMode _mapStringToTransportMode(String mode) {
    switch (mode.toLowerCase()) {
      case 'walking': return TransportMode.walk;
      case 'driving': return TransportMode.car;
      case 'public_transport': return TransportMode.publicTransport;
      default: return TransportMode.walk;
    }
  }

  static List<EnhancedActivity> _createFallbackActivities(String destination) {
    return [
      EnhancedActivity(
        id: 'fallback_1',
        title: 'Explore $destination',
        description: 'Discover the main attractions and highlights of $destination',
        timeSlot: '09:00-11:00',
        estimatedDuration: Duration(hours: 2),
        type: ActivityType.landmark,
        location: Location(address: destination, latitude: 0.0, longitude: 0.0),
        costInfo: CostInfo(entryFee: 0.0, currency: '\$', mealCosts: {}, transportCost: 0.0, paymentMethods: [], hasDiscounts: false),
        travelInfo: TravelInfo(fromPrevious: 'Start', travelTime: Duration.zero, recommendedMode: TransportMode.walk, estimatedCost: 0.0, routeInstructions: '', isAccessible: true),
        images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000'],
        contextInfo: ContextualInfo(crowdLevel: 'Moderate', bestTimeToVisit: 'Morning', weatherTips: [], localTips: [], safetyAlerts: [], isIndoorActivity: false),
        actionableLinks: [],
      ),
    ];
  }
}