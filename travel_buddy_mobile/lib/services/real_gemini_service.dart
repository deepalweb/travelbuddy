import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/enhanced_activity.dart';
import '../constants/app_constants.dart';

class RealGeminiService {
  static Future<List<EnhancedActivity>> generatePremiumDayPlan({
    required String destination,
    required String interests,
    required String pace,
    required List<String> dietaryPreferences,
    required bool isAccessible,
    String? weather,
  }) async {
    print('🤖 Using REAL Gemini AI for: $destination');
    
    try {
      final prompt = _buildPrompt(
        destination: destination,
        interests: interests,
        pace: pace,
        dietaryPreferences: dietaryPreferences,
        isAccessible: isAccessible,
        weather: weather,
      );
      
      final response = await _callRealGeminiAPI(prompt);
      final activities = _parseResponse(response, destination);
      
      print('✅ Generated ${activities.length} activities with REAL Gemini AI');
      return activities;
      
    } catch (e) {
      print('❌ Real Gemini error: $e');
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
Create a day itinerary for $destination with these requirements:

Interests: $interests
Pace: $pace
Dietary: ${dietaryPreferences.join(', ')}
Accessible: $isAccessible
Weather: ${weather ?? 'sunny'}

Return ONLY valid JSON:
{
  "activities": [
    {
      "name": "Activity Name",
      "type": "landmark",
      "startTime": "09:00",
      "endTime": "11:00", 
      "description": "Brief description",
      "cost": "Free",
      "tips": ["tip1", "tip2"]
    }
  ]
}
''';
  }
  
  static Future<String> _callRealGeminiAPI(String prompt) async {
    print('📡 Calling REAL Gemini API...');
    
    final response = await http.post(
      Uri.parse('${AppConstants.baseUrl}/api/ai/generate-text'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'prompt': prompt}),
    );
    
    print('📡 Response: ${response.statusCode}');
    print('📡 Body: ${response.body}');
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['itinerary'] != null 
          ? json.encode(data['itinerary'])
          : data['text'] ?? response.body;
    }
    
    throw Exception('API failed: ${response.statusCode}');
  }
  
  static List<EnhancedActivity> _parseResponse(String response, String destination) {
    try {
      final jsonData = json.decode(response);
      final activities = <EnhancedActivity>[];
      
      if (jsonData['activities'] != null) {
        final activitiesList = jsonData['activities'] as List;
        
        for (int i = 0; i < activitiesList.length; i++) {
          final data = activitiesList[i];
          activities.add(EnhancedActivity(
            id: 'real_ai_${i + 1}',
            title: data['name'] ?? 'Activity ${i + 1}',
            description: data['description'] ?? 'Real AI generated activity',
            timeSlot: '${data['startTime'] ?? '09:00'}-${data['endTime'] ?? '11:00'}',
            estimatedDuration: Duration(hours: 2),
            type: _mapType(data['type'] ?? 'landmark'),
            location: Location(
              address: '$destination, ${data['name']}',
              latitude: 0.0,
              longitude: 0.0,
            ),
            costInfo: CostInfo(
              entryFee: _parseCost(data['cost'] ?? '0'),
              currency: '\$',
              mealCosts: {},
              transportCost: 3.0,
              paymentMethods: ['Card'],
              hasDiscounts: false,
            ),
            travelInfo: TravelInfo(
              fromPrevious: i == 0 ? 'Start' : 'Previous',
              travelTime: Duration(minutes: i == 0 ? 0 : 15),
              recommendedMode: TransportMode.walk,
              estimatedCost: 0.0,
              routeInstructions: 'Go to ${data['name']}',
              isAccessible: true,
            ),
            images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000'],
            contextInfo: ContextualInfo(
              crowdLevel: 'Moderate',
              bestTimeToVisit: data['startTime'] ?? '09:00',
              weatherTips: ['Check weather'],
              localTips: (data['tips'] as List?)?.cast<String>() ?? ['Enjoy!'],
              safetyAlerts: [],
              isIndoorActivity: data['type'] == 'museum',
            ),
            actionableLinks: [
              ActionableLink(
                title: 'Directions',
                url: 'https://maps.google.com/?q=${data['name']}',
                type: ActionType.map,
              ),
            ],
          ));
        }
      }
      
      return activities.isNotEmpty ? activities : _createFallbackActivities(destination);
    } catch (e) {
      print('Parse error: $e');
      return _createFallbackActivities(destination);
    }
  }
  
  static ActivityType _mapType(String type) {
    switch (type.toLowerCase()) {
      case 'restaurant': return ActivityType.restaurant;
      case 'museum': return ActivityType.museum;
      case 'park': return ActivityType.nature;
      default: return ActivityType.landmark;
    }
  }
  
  static double _parseCost(String cost) {
    final match = RegExp(r'\d+').firstMatch(cost);
    return match != null ? double.parse(match.group(0)!) : 0.0;
  }
  
  static List<EnhancedActivity> _createFallbackActivities(String destination) {
    return [
      EnhancedActivity(
        id: 'fallback_1',
        title: 'Explore $destination',
        description: 'Discover the highlights of $destination',
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