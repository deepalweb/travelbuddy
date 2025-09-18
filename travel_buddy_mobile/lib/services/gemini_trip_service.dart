import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/enhanced_activity.dart';
import '../constants/app_constants.dart';

class GeminiTripService {
  static Future<List<EnhancedActivity>> generatePremiumDayPlan({
    required String destination,
    required String interests,
    required String pace,
    required List<String> dietaryPreferences,
    required bool isAccessible,
    String? weather,
  }) async {
    print('🤖 Using Gemini AI to generate plan for: $destination');
    
    try {
      final prompt = _buildPrompt(
        destination: destination,
        interests: interests,
        pace: pace,
        dietaryPreferences: dietaryPreferences,
        isAccessible: isAccessible,
        weather: weather,
      );
      
      final response = await _callGeminiAPI(prompt);
      final activities = _parseGeminiResponse(response, destination);
      
      print('✅ Generated ${activities.length} activities with Gemini AI');
      return activities;
      
    } catch (e) {
      print('❌ Gemini error: $e');
      return _createFallbackActivities(destination);
    }
  }
  
  static String _buildPrompt({
    required String destination,
    required String interests,
    required String pace,
    required List<String> dietaryPreferences,
    required bool isAccessible,
    String? weather,
  }) {
    return '''
Create a premium day itinerary for $destination with these requirements:

Destination: $destination
Interests: $interests
Pace: $pace (Relaxed = 3-4 activities, Moderate = 4-5 activities, Fast-Paced = 6+ activities)
Dietary Preferences: ${dietaryPreferences.join(', ')}
Accessibility Required: $isAccessible
Weather: ${weather ?? 'sunny'}

Please create a realistic day plan with:
1. 3-4 activities with specific times (09:00-11:00 format)
2. Mix of attractions, dining, and experiences
3. Realistic travel times between locations
4. Local tips and crowd insights
5. Estimated costs in local currency
6. Weather-appropriate suggestions

Format each activity as:
ACTIVITY: [Name]
TIME: [09:00-11:00]
TYPE: [landmark/restaurant/museum/nature/shopping/entertainment]
DESCRIPTION: [2-3 sentences about the activity]
COST: [Entry fee in local currency]
TIPS: [Local insider tip]
CROWD: [Low/Moderate/High]
WEATHER_NOTE: [If weather affects this activity]

Start with morning activity around 9 AM.
''';
  }
  
  static Future<String> _callGeminiAPI(String prompt) async {
    try {
      print('🤖 Calling real Gemini API with prompt: ${prompt.substring(0, 100)}...');
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/generate-text'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'prompt': prompt,
          'maxTokens': 1000,
          'temperature': 0.7,
        }),
      );
      
      print('📡 Gemini API response status: ${response.statusCode}');
      print('📡 Gemini API response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final aiText = data['itinerary'] != null 
            ? json.encode(data['itinerary']) 
            : data['text'] ?? data['response'] ?? response.body;
        
        print('✅ Got AI response: ${aiText.substring(0, 200)}...');
        return aiText;
      } else {
        print('🔴 Gemini API error: ${response.statusCode} - ${response.body}');
        throw Exception('Gemini API failed: ${response.statusCode}');
      }
    } catch (e) {
      print('🔴 Gemini call failed: $e');
      print('🎭 Using fallback mock response');
      return _getMockGeminiResponse();
    }
  }
  
  static String _getMockGeminiResponse() {
    return '''
ACTIVITY: Historic City Center
TIME: 09:00-11:00
TYPE: landmark
DESCRIPTION: Explore the historic downtown area with beautiful architecture and local shops. Perfect for morning walks and photography.
COST: Free
TIPS: Best lighting for photos is between 9-10 AM
CROWD: Low
WEATHER_NOTE: Great for sunny weather, covered walkways available

ACTIVITY: Local Market & Lunch
TIME: 12:00-14:00
TYPE: restaurant
DESCRIPTION: Visit the bustling local market and enjoy authentic cuisine at nearby restaurants. Try regional specialties.
COST: \$15-25
TIPS: Ask locals for their favorite stalls
CROWD: Moderate
WEATHER_NOTE: Mostly covered areas

ACTIVITY: Cultural Museum
TIME: 15:00-17:00
TYPE: museum
DESCRIPTION: Discover local history and culture at the main museum. Interactive exhibits and guided tours available.
COST: \$12
TIPS: Free entry on first Sunday of month
CROWD: Low
WEATHER_NOTE: Perfect indoor activity for any weather

ACTIVITY: Sunset Viewpoint
TIME: 18:00-19:30
TYPE: nature
DESCRIPTION: End the day at the best viewpoint in the city. Popular spot for sunset photos and evening relaxation.
COST: Free
TIPS: Arrive 30 minutes before sunset
CROWD: High
WEATHER_NOTE: Weather dependent - check forecast
''';
  }
  
  static List<EnhancedActivity> _parseGeminiResponse(String response, String destination) {
    final activities = <EnhancedActivity>[];
    
    try {
      print('🔍 Parsing Gemini response: ${response.substring(0, 200)}...');
      
      // Try to parse as JSON first (new format)
      final jsonData = json.decode(response);
      if (jsonData['activities'] != null) {
        final activitiesList = jsonData['activities'] as List;
        
        for (int i = 0; i < activitiesList.length; i++) {
          final activityData = activitiesList[i];
          activities.add(_createActivityFromJson(activityData, i, destination));
        }
        
        print('✅ Parsed ${activities.length} activities from JSON');
        return activities;
      }
    } catch (e) {
      print('⚠️ JSON parsing failed, trying text parsing: $e');
    }
    
    // Fallback to text parsing (old format)
    final sections = response.split('ACTIVITY:').where((s) => s.trim().isNotEmpty).toList();
    
    for (int i = 0; i < sections.length; i++) {
      try {
        final section = sections[i];
        final activity = _parseActivitySection(section, i, destination);
        if (activity != null) {
          activities.add(activity);
        }
      } catch (e) {
        print('⚠️ Error parsing activity $i: $e');
      }
    }
    
    return activities.isNotEmpty ? activities : _createFallbackActivities(destination);
  }
  
  static EnhancedActivity? _parseActivitySection(String section, int index, String destination) {
    try {
      final lines = section.split('\n').map((l) => l.trim()).where((l) => l.isNotEmpty).toList();
      
      String title = 'Activity ${index + 1}';
      String timeSlot = '09:00-11:00';
      String type = 'landmark';
      String description = 'Explore this location';
      String cost = '0';
      String tips = 'Enjoy your visit';
      String crowd = 'Moderate';
      
      for (final line in lines) {
        if (line.startsWith('TIME:')) {
          timeSlot = line.substring(5).trim();
        } else if (line.startsWith('TYPE:')) {
          type = line.substring(5).trim();
        } else if (line.startsWith('DESCRIPTION:')) {
          description = line.substring(12).trim();
        } else if (line.startsWith('COST:')) {
          cost = line.substring(5).trim();
        } else if (line.startsWith('TIPS:')) {
          tips = line.substring(5).trim();
        } else if (line.startsWith('CROWD:')) {
          crowd = line.substring(6).trim();
        } else if (!line.contains(':') && title == 'Activity ${index + 1}') {
          title = line;
        }
      }
      
      return EnhancedActivity(
        id: 'gemini_${index + 1}',
        title: title,
        description: description,
        timeSlot: timeSlot,
        estimatedDuration: Duration(hours: 2),
        type: _mapStringToActivityType(type),
        location: Location(
          address: '$destination, ${title}',
          latitude: 0.0,
          longitude: 0.0,
        ),
        costInfo: CostInfo(
          entryFee: _parseCost(cost),
          currency: _detectCurrency(cost),
          mealCosts: type == 'restaurant' ? {
            'budget': 15.0,
            'mid-range': 25.0,
            'luxury': 45.0,
          } : {},
          transportCost: 3.0,
          paymentMethods: ['Card', 'Cash'],
          hasDiscounts: cost.toLowerCase().contains('free'),
        ),
        travelInfo: TravelInfo(
          fromPrevious: index == 0 ? 'Starting Point' : 'Previous Location',
          travelTime: Duration(minutes: index == 0 ? 0 : 15),
          recommendedMode: TransportMode.walk,
          estimatedCost: index == 0 ? 0.0 : 2.0,
          routeInstructions: 'Navigate to $title',
          isAccessible: true,
        ),
        images: _getImageForType(type),
        contextInfo: ContextualInfo(
          crowdLevel: crowd,
          bestTimeToVisit: timeSlot,
          weatherTips: ['Check weather conditions'],
          localTips: [tips],
          safetyAlerts: [],
          isIndoorActivity: type == 'museum' || type == 'restaurant',
        ),
        actionableLinks: [
          ActionableLink(
            title: 'Directions',
            url: 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(title + ' ' + destination)}',
            type: ActionType.map,
          ),
          if (type == 'restaurant')
            ActionableLink(
              title: 'Find Restaurants',
              url: 'https://www.tripadvisor.com/restaurants-${Uri.encodeComponent(destination)}',
              type: ActionType.reservation,
            ),
        ],
      );
    } catch (e) {
      print('❌ Error parsing activity section: $e');
      return null;
    }
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
  
  static double _parseCost(String cost) {
    final numbers = RegExp(r'\d+').allMatches(cost);
    if (numbers.isNotEmpty) {
      return double.tryParse(numbers.first.group(0)!) ?? 0.0;
    }
    return cost.toLowerCase().contains('free') ? 0.0 : 10.0;
  }
  
  static String _detectCurrency(String cost) {
    if (cost.contains('\$')) return '\$';
    if (cost.contains('€')) return '€';
    if (cost.contains('£')) return '£';
    if (cost.contains('¥')) return '¥';
    return '\$';
  }
  
  static List<String> _getImageForType(String type) {
    switch (type.toLowerCase()) {
      case 'restaurant':
        return ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5'];
      case 'museum':
        return ['https://images.unsplash.com/photo-1566127992631-137a642a90f4'];
      case 'nature':
        return ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e'];
      case 'shopping':
        return ['https://images.unsplash.com/photo-1441986300917-64674bd600d8'];
      default:
        return ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000'];
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