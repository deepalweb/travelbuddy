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
    print('🤖 Using integrated Google Places + AI for: $destination');
    
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
      return _generateWithGeminiFallback(destination, interests, pace, dietaryPreferences, isAccessible, weather);
    }
  }

  static Future<List<EnhancedActivity>> _generateWithGeminiFallback(
    String destination,
    String interests,
    String pace,
    List<String> dietaryPreferences,
    bool isAccessible,
    String? weather,
  ) async {
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
      
      return activities;
    } catch (e) {
      print('❌ Gemini fallback error: $e');
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
    final promptStyles = [
      _buildExplorerPrompt(destination, interests, pace, dietaryPreferences, isAccessible, weather),
      _buildLocalPrompt(destination, interests, pace, dietaryPreferences, isAccessible, weather),
      _buildCulturalPrompt(destination, interests, pace, dietaryPreferences, isAccessible, weather),
    ];
    
    return promptStyles[DateTime.now().millisecond % promptStyles.length];
  }
  
  static String _buildExplorerPrompt(String destination, String interests, String pace, List<String> dietaryPreferences, bool isAccessible, String? weather) {
    final startTime = ['08:30', '09:00', '09:30'][DateTime.now().millisecond % 3];
    return '''
You are a local travel expert in $destination. Create a unique day itinerary for an adventurous traveler.

Traveler Profile:
- Destination: $destination
- Interests: $interests
- Pace: $pace
- Dietary: ${dietaryPreferences.join(', ')}
- Accessibility: ${isAccessible ? 'Required' : 'Flexible'}
- Weather: ${weather ?? 'pleasant'}

Create experiences that include:
- Hidden gems locals love
- Authentic dining spots
- Perfect photo opportunities
- Cultural immersion moments

Format:
ACTIVITY: [Specific place with character]
TIME: [$startTime-10:30]
TYPE: [landmark/restaurant/museum/nature/cultural]
DESCRIPTION: [Why this place is special and unique]
COST: [Realistic local pricing]
TIPS: [Insider secret or local hack]
CROWD: [Best times to visit]
WEATHER_NOTE: [Weather considerations]

Make this feel like a friend's recommendation.
''';
  }
  
  static String _buildLocalPrompt(String destination, String interests, String pace, List<String> dietaryPreferences, bool isAccessible, String? weather) {
    final startTime = ['08:30', '09:00', '09:30'][DateTime.now().millisecond % 3];
    return '''
As a $destination local, design a perfect day showing the real $destination.

Visitor wants:
- Interests: $interests
- Energy: $pace
- Food needs: ${dietaryPreferences.join(', ')}
- Accessibility: $isAccessible
- Weather: ${weather ?? 'good'}

Show them:
- Where locals actually go
- Best timing for each place
- Food spots tourists miss
- Cultural insights

Format:
ACTIVITY: [Local name for the place]
TIME: [$startTime-10:00]
TYPE: [category]
DESCRIPTION: [Why locals love this place]
COST: [What locals pay]
TIPS: [Local secret]
CROWD: [Local vs tourist timing]
WEATHER_NOTE: [Local weather wisdom]

Make them feel like an insider.
''';
  }
  
  static String _buildCulturalPrompt(String destination, String interests, String pace, List<String> dietaryPreferences, bool isAccessible, String? weather) {
    final startTime = ['08:30', '09:00', '09:30'][DateTime.now().millisecond % 3];
    return '''
Craft a cultural journey through $destination beyond surface tourism.

Seeker profile:
- Deep interest in: $interests
- Rhythm: $pace
- Dietary: ${dietaryPreferences.join(', ')}
- Accessibility: ${isAccessible ? 'Essential' : 'Flexible'}
- Conditions: ${weather ?? 'favorable'}

Reveal:
- Stories behind places
- Cultural traditions
- Community spaces
- Artistic expressions

Format:
ACTIVITY: [Place with cultural significance]
TIME: [$startTime-11:00]
TYPE: [cultural/spiritual/artistic/traditional]
DESCRIPTION: [Cultural story and connection]
COST: [Fair local pricing]
TIPS: [Cultural etiquette tip]
CROWD: [Respectful timing]
WEATHER_NOTE: [Seasonal considerations]

Create genuine cultural exchange moments.
''';
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

  static Future<String> _callGeminiAPI(String prompt) async {
    try {
      print('🤖 Calling Gemini API fallback');
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/generate-text'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'prompt': prompt,
          'maxTokens': 1000,
          'temperature': 0.7,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['text'] ?? data['response'] ?? response.body;
      } else {
        throw Exception('Gemini API failed: ${response.statusCode}');
      }
    } catch (e) {
      print('🔴 Gemini call failed: $e');
      return _getMockGeminiResponse();
    }
  }
  
  static String _getMockGeminiResponse() {
    final responses = [
      _getMockExplorerResponse(),
      _getMockLocalResponse(), 
      _getMockCulturalResponse(),
    ];
    return responses[DateTime.now().millisecond % responses.length];
  }
  
  static String _getMockExplorerResponse() {
    return '''
ACTIVITY: Dawn Coffee at Artisan Roastery
TIME: 08:30-09:30
TYPE: restaurant
DESCRIPTION: Start where locals fuel up - this hidden roastery serves the city's best single-origin coffee with fresh pastries. The owner sources beans directly from mountain farmers.
COST: \$8-12
TIPS: Try the signature blend with local honey
CROWD: Locals peak at 8 AM, quieter after 9
WEATHER_NOTE: Perfect cozy spot for any weather

ACTIVITY: Secret Garden Gallery Walk
TIME: 10:00-12:00
TYPE: cultural
DESCRIPTION: Discover the artist quarter's hidden courtyards where local painters display their work. Each alley tells a different story through murals and sculptures.
COST: Free (donations appreciated)
TIPS: Chat with artists - they love sharing inspiration
CROWD: Peaceful mornings, busier after lunch
WEATHER_NOTE: Covered walkways protect art and visitors

ACTIVITY: Grandmother's Kitchen Experience
TIME: 13:00-14:30
TYPE: restaurant
DESCRIPTION: Join a local family for traditional cooking in their home kitchen. Learn recipes passed down through generations while sharing stories over lunch.
COST: \$25-35
TIPS: Bring your appetite and curiosity
CROWD: Intimate groups of 4-6 people
WEATHER_NOTE: Indoor experience, perfect anytime
''';
  }
  
  static String _getMockLocalResponse() {
    return '''
ACTIVITY: Morning Market Run with Auntie Sita
TIME: 09:00-10:30
TYPE: cultural
DESCRIPTION: Follow locals to the wholesale market where Auntie Sita has sold fresh produce for 30 years. She'll teach you to pick the best fruits and share neighborhood gossip.
COST: \$5-10 for samples
TIPS: Bring reusable bag and learn basic greetings
CROWD: Bustling with locals, no tourists
WEATHER_NOTE: Covered stalls, rain or shine

ACTIVITY: Uncle Kumar's Spice Workshop
TIME: 11:00-12:30
TYPE: cultural
DESCRIPTION: In his tiny shop, Uncle Kumar blends spices like his grandfather taught him. Watch him create custom masalas and learn medicinal properties of each spice.
COST: \$15 (includes spice packet)
TIPS: Ask about healing properties - he's a walking encyclopedia
CROWD: Usually just you and maybe one other soul
WEATHER_NOTE: Aromatic indoor experience

ACTIVITY: Workers' Lunch at Mama's Kitchen
TIME: 12:45-14:00
TYPE: restaurant
DESCRIPTION: Squeeze into this 8-table eatery where construction workers, clerks, and taxi drivers share delicious, cheap lunch. No menu - ask what's good today.
COST: \$3-6
TIPS: Point and smile - universal language of hunger
CROWD: Packed with working locals 12:30-1:30
WEATHER_NOTE: Fan-cooled, authentic atmosphere
''';
  }
  
  static String _getMockCulturalResponse() {
    return '''
ACTIVITY: Sacred Morning Ritual at River Temple
TIME: 08:30-10:00
TYPE: spiritual
DESCRIPTION: Witness ancient dawn prayers where devotees have gathered for 800 years. The temple priest explains ritual significance and stories carved in stone.
COST: Donation (\$2-5 suggested)
TIPS: Dress modestly and remove shoes before entering
CROWD: Peaceful gathering of faithful locals
WEATHER_NOTE: Mystical in morning mist, golden in sunshine

ACTIVITY: Master Craftsman's Workshop
TIME: 10:30-12:30
TYPE: artistic
DESCRIPTION: Watch Master Chen create intricate wood carvings using 500-year-old techniques. His family served the royal court for 12 generations. Try basic carving.
COST: \$20 (includes small carving)
TIPS: Ask about symbolism - every curve has meaning
CROWD: Intimate setting with serious art lovers
WEATHER_NOTE: Cool workshop perfect for focused creativity

ACTIVITY: Community Feast Preparation
TIME: 13:00-15:00
TYPE: community
DESCRIPTION: Join weekly community kitchen where neighbors cook together for elderly and needy. Learn traditional recipes while understanding how communities care for each other.
COST: \$10 donation
TIPS: Bring apron and open heart
CROWD: Warm community of volunteers from all walks
WEATHER_NOTE: Indoor kitchen with great ventilation
''';
  }
  
  static List<EnhancedActivity> _parseIntegratedResponse(String response, String destination) {
    final activities = <EnhancedActivity>[];
    
    try {
      print('🔍 Parsing integrated response: ${response.substring(0, 200)}...');
      
      final jsonData = json.decode(response);
      if (jsonData['activities'] != null) {
        final activitiesList = jsonData['activities'] as List;
        
        for (int i = 0; i < activitiesList.length; i++) {
          final activityData = activitiesList[i];
          activities.add(_createActivityFromJson(activityData, i, destination));
        }
        
        print('✅ Parsed ${activities.length} activities from integrated response');
        return activities;
      }
    } catch (e) {
      print('❌ Integrated response parsing failed: $e');
      throw Exception('Failed to parse integrated response: $e');
    }
    
    return activities.isNotEmpty ? activities : _createFallbackActivities(destination);
  }
  
  static EnhancedActivity _createActivityFromJson(Map<String, dynamic> data, int index, String destination) {
    return EnhancedActivity(
      id: 'integrated_${index + 1}',
      title: data['name'] ?? 'Activity ${index + 1}',
      description: data['description'] ?? 'Explore this location',
      timeSlot: '${data['startTime'] ?? '09:00'}-${data['endTime'] ?? '11:00'}',
      estimatedDuration: Duration(hours: 2),
      type: _mapStringToActivityType(data['type'] ?? 'landmark'),
      location: Location(
        address: '$destination, ${data['name'] ?? 'Location'}',
        latitude: 0.0,
        longitude: 0.0,
      ),
      costInfo: CostInfo(
        entryFee: _parseCost(data['cost'] ?? 'Free'),
        currency: _detectCurrency(data['cost'] ?? 'Free'),
        mealCosts: data['type'] == 'restaurant' ? {
          'budget': 15.0,
          'mid-range': 25.0,
          'luxury': 45.0,
        } : {},
        transportCost: 3.0,
        paymentMethods: ['Card', 'Cash'],
        hasDiscounts: (data['cost'] ?? '').toLowerCase().contains('free'),
      ),
      travelInfo: TravelInfo(
        fromPrevious: index == 0 ? 'Starting Point' : 'Previous Location',
        travelTime: Duration(minutes: index == 0 ? 0 : 15),
        recommendedMode: TransportMode.walk,
        estimatedCost: index == 0 ? 0.0 : 2.0,
        routeInstructions: 'Navigate to ${data['name']}',
        isAccessible: true,
      ),
      images: _getImageForType(data['type'] ?? 'landmark'),
      contextInfo: ContextualInfo(
        crowdLevel: 'Moderate',
        bestTimeToVisit: '${data['startTime'] ?? '09:00'}-${data['endTime'] ?? '11:00'}',
        weatherTips: ['Check weather conditions'],
        localTips: data['tips'] != null ? List<String>.from(data['tips']) : ['Enjoy your visit'],
        safetyAlerts: [],
        isIndoorActivity: data['type'] == 'museum' || data['type'] == 'restaurant',
      ),
      actionableLinks: [
        ActionableLink(
          title: 'Directions',
          url: 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent('${data['name']} $destination')}',
          type: ActionType.map,
        ),
        if (data['type'] == 'restaurant')
          ActionableLink(
            title: 'Find Restaurants',
            url: 'https://www.tripadvisor.com/restaurants-${Uri.encodeComponent(destination)}',
            type: ActionType.reservation,
          ),
      ],
    );
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
          address: '$destination, $title',
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
            url: 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent('$title $destination')}',
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