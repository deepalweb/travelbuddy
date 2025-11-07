import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/enhanced_activity.dart';

class DirectGeminiService {
  // API keys removed - using backend endpoints instead
  
  static Future<List<EnhancedActivity>> generatePremiumDayPlan({
    required String destination,
    required String interests,
    required String pace,
    required List<String> dietaryPreferences,
    required bool isAccessible,
    String? weather,
  }) async {
    print('🚀 Using Direct Gemini + Places API for: $destination');
    
    try {
      // Step 1: Get real places from Google Places API
      final places = await _getPlacesFromGoogle(destination);
      print('📍 Found ${places.length} places from Google');
      
      // Step 2: Generate itinerary with Gemini AI using real places
      final activities = await _generateWithGemini(
        destination: destination,
        interests: interests,
        pace: pace,
        places: places,
        dietaryPreferences: dietaryPreferences,
        isAccessible: isAccessible,
        weather: weather,
      );
      
      print('✅ Generated ${activities.length} activities with Direct API');
      return activities;
      
    } catch (e) {
      print('❌ Direct API error: $e');
      return _createFallbackActivities(destination);
    }
  }
  
  static Future<List<Map<String, dynamic>>> _getPlacesFromGoogle(String destination) async {
    try {
      // Search for places in the destination
      final url = '${Environment.backendUrl}/api/places/search?q=tourist attractions restaurants museums $destination';
      
      final response = await http.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          return (data['results'] as List).take(10).map((place) => {
            'name': place['name'],
            'address': place['formatted_address'] ?? place['vicinity'] ?? '',
            'rating': place['rating'] ?? 4.0,
            'types': place['types'] ?? ['establishment'],
            'place_id': place['place_id'],
          }).toList();
        }
      }
    } catch (e) {
      print('Places API error: $e');
    }
    
    return [];
  }
  
  static Future<List<EnhancedActivity>> _generateWithGemini({
    required String destination,
    required String interests,
    required String pace,
    required List<Map<String, dynamic>> places,
    required List<String> dietaryPreferences,
    required bool isAccessible,
    String? weather,
  }) async {
    
    final placesText = places.take(8).map((p) => 
      '${p['name']} (${p['rating']}/5, ${p['address']})'
    ).join('\n');
    
    final prompt = '''
You are an EXPERT TRAVEL CONCIERGE creating a TIME-EFFICIENT 1-DAY PLAN for $destination.

TRAVELER SITUATION: Limited time (6-8 hours), unfamiliar location, needs maximum value.

REAL PLACES AVAILABLE:
$placesText

TRAVELER REQUIREMENTS:
- Interests: $interests
- Pace: $pace
- Time Available: 6-8 hours total
- Dietary: ${dietaryPreferences.join(', ')}
- Accessibility: ${isAccessible ? 'Required' : 'Standard'}
- Weather: ${weather ?? 'sunny'}

CREATE EXACTLY 4 ACTIVITIES (TIME-EFFICIENT BALANCE):

🏛️ MORNING (9:00-11:00): 1 MAIN LANDMARK (must-see highlight)
🍽️ LUNCH (12:00-13:30): 1 AUTHENTIC FOOD EXPERIENCE (local cuisine)
🎨 AFTERNOON (14:00-16:00): 1 CULTURAL EXPERIENCE (museum/art/history)
🌅 EVENING (16:30-18:30): 1 LEISURE ACTIVITY (scenic/relaxation)

FOR EACH ACTIVITY PROVIDE:

⏰ TIME EFFICIENCY:
- Exact duration (realistic, not rushed)
- Buffer time between activities
- Total time commitment

💰 COST TRANSPARENCY:
- Entry fee in local currency + USD
- Transport cost to get there
- Food/drink costs if applicable
- Total activity cost

🚌 TRANSPORT CLARITY:
- Exact transport method ("Metro Line 2, 3 stops")
- Cost and time ("€2.50, 12 minutes")
- Walking distance if applicable
- Day pass recommendations

🌦️ WEATHER ADAPTABILITY:
- Indoor backup if outdoor activity
- Covered routes if walking required
- Alternative timing for weather

Return ONLY valid JSON:
{
  "activities": [
    {
      "name": "Exact place name from list",
      "type": "landmark|restaurant|museum|leisure",
      "startTime": "09:00",
      "endTime": "11:00",
      "duration": "2 hours",
      "description": "What to see/do (2 sentences max)",
      "whyMustSee": "Why this is the #1 priority for limited time",
      "entryCost": "€15",
      "entryCostUSD": "\$16",
      "transportFromPrevious": "Metro Line 2, 3 stops, €2.50, 12 mins",
      "transportCost": "€2.50",
      "transportCostUSD": "\$2.70",
      "totalActivityCost": "€17.50 (\$19)",
      "timeToNext": "15 min walk",
      "crowdStrategy": "Arrive at 9am before tour groups",
      "weatherBackup": "Indoor sections available if raining",
      "quickTips": [
        "Skip the audio guide to save time",
        "Best photo spot is the east entrance"
      ]
    }
  ],
  "dayEfficiency": {
    "totalDuration": "7.5 hours",
    "totalWalkingTime": "35 minutes",
    "totalTransportTime": "45 minutes",
    "bufferTime": "30 minutes between activities",
    "recommendedStartTime": "9:00 AM",
    "recommendedEndTime": "6:30 PM"
  },
  "costBreakdown": {
    "totalBudgetLocal": "€65-80",
    "totalBudgetUSD": "\$70-85",
    "entranceFees": "€35 (\$38)",
    "foodAndDrinks": "€20-30 (\$22-32)",
    "transport": "€10-15 (\$11-16)",
    "dayPassRecommendation": "Buy €12 day pass - covers all transport"
  },
  "quickAdaptations": {
    "ifRaining": "Move museum to morning, landmark to afternoon",
    "ifCrowded": "Start with cultural site, landmark after 3pm",
    "ifTired": "Skip evening activity, extend lunch experience",
    "ifRushed": "Combine lunch + cultural site, skip leisure activity"
  },
  "essentialInfo": {
    "mustBring": ["Comfortable shoes", "Portable charger", "Small cash"],
    "timeHacks": ["Book tickets online", "Use contactless payment", "Download offline maps"],
    "emergencyContacts": ["Police: 112", "Tourist info: +local number"]
  }
}
''';

    try {
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/ai/generate'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'contents': [{'parts': [{'text': prompt}]}]
        }),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final text = data['candidates']?[0]?['content']?['parts']?[0]?['text'] ?? '';
        
        print('🤖 Gemini response: ${text.substring(0, 200)}...');
        
        return _parseGeminiResponse(text, destination, places);
      }
    } catch (e) {
      print('Gemini API error: $e');
    }
    
    return _createActivitiesFromPlaces(places, destination);
  }
  
  static List<EnhancedActivity> _parseGeminiResponse(
    String response, 
    String destination,
    List<Map<String, dynamic>> places
  ) {
    try {
      // Extract JSON from response
      final jsonMatch = response.contains('{') ? 
        response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1) : '';
      
      if (jsonMatch.isNotEmpty) {
        final data = json.decode(jsonMatch);
        if (data['activities'] != null) {
          final activities = <EnhancedActivity>[];
          
          for (int i = 0; i < (data['activities'] as List).length; i++) {
            final activity = data['activities'][i];
            final matchedPlace = places.firstWhere(
              (p) => p['name'].toLowerCase().contains(activity['name'].toLowerCase()) ||
                     activity['name'].toLowerCase().contains(p['name'].toLowerCase()),
              orElse: () => places.isNotEmpty ? places[i % places.length] : {},
            );
            
            activities.add(_createActivityFromData(activity, matchedPlace, i, destination));
          }
          
          return activities;
        }
      }
    } catch (e) {
      print('Parse error: $e');
    }
    
    return _createActivitiesFromPlaces(places, destination);
  }
  
  static EnhancedActivity _createActivityFromData(
    Map<String, dynamic> activity,
    Map<String, dynamic> place,
    int index,
    String destination
  ) {
    final localCost = activity['localCost'] ?? '250 CZK';
    final usdCost = activity['usdCost'] ?? '\$11';
    final entryCost = _parseCost(usdCost);
    
    return EnhancedActivity(
      id: 'concierge_${index + 1}',
      title: activity['name'] ?? place['name'] ?? 'Local Experience ${index + 1}',
      description: '${activity['description'] ?? 'Authentic local experience in $destination'}'  
          '\n\n💰 Cost: $localCost ($usdCost)'
          '\n🚌 Transport: ${activity['transportFromPrevious'] ?? 'Walking distance'}'
          '${activity['whatToOrder'] != null ? '\n🍴 Order: ${activity['whatToOrder']}' : ''}'
          '\n\n💡 Why locals love it: ${activity['whyLocalsLoveIt'] ?? 'Popular with residents'}',
      timeSlot: '${activity['startTime'] ?? '09:00'}-${activity['endTime'] ?? '11:00'}',
      estimatedDuration: _parseDuration(activity['duration'] ?? '2 hours'),
      type: _mapType(activity['type'] ?? 'landmark'),
      location: Location(
        address: place['address'] ?? destination,
        latitude: 0.0,
        longitude: 0.0,
      ),
      costInfo: CostInfo(
        entryFee: entryCost,
        currency: _extractCurrency(localCost),
        mealCosts: activity['whatToOrder'] != null ? {
          'local-dish': entryCost,
          'tourist-menu': entryCost * 1.5,
          'street-food': entryCost * 0.6,
        } : {},
        transportCost: _parseTransportCost(activity['transportFromPrevious'] ?? ''),
        paymentMethods: ['Card', 'Cash', 'Contactless'],
        hasDiscounts: localCost.toLowerCase().contains('free'),
      ),
      travelInfo: TravelInfo(
        fromPrevious: index == 0 ? 'Starting Point' : 'Previous Location',
        travelTime: _parseTransportTime(activity['transportFromPrevious'] ?? '15 min'),
        recommendedMode: _getTransportModeFromDescription(activity['transportFromPrevious'] ?? 'walk'),
        estimatedCost: _parseTransportCost(activity['transportFromPrevious'] ?? ''),
        routeInstructions: activity['transportFromPrevious'] ?? 'Navigate to ${activity['name']}',
        isAccessible: true,
      ),
      images: _getImageForActivity(activity['type'] ?? 'landmark'),
      contextInfo: ContextualInfo(
        crowdLevel: activity['crowdLevel'] ?? 'Moderate',
        bestTimeToVisit: activity['bestStrategy'] ?? 'Flexible timing',
        weatherTips: [activity['weatherBackup'] ?? 'Check weather conditions'],
        localTips: [
          ...(activity['localSecrets'] as List?)?.cast<String>() ?? [],
          ...(activity['culturalTips'] as List?)?.cast<String>() ?? [],
          ...(activity['keyPhrases'] as List?)?.cast<String>() ?? [],
        ],
        safetyAlerts: (activity['safetyWarnings'] as List?)?.cast<String>() ?? [],
        isIndoorActivity: _isIndoorActivity(activity['type'] ?? 'landmark'),
      ),
      actionableLinks: [
        ActionableLink(
          title: 'Get Directions',
          url: 'https://maps.google.com/?q=${Uri.encodeComponent(place['name'] ?? activity['name'])}',
          type: ActionType.map,
        ),
        if (activity['type'] == 'restaurant')
          ActionableLink(
            title: 'Learn Key Phrases',
            url: 'https://translate.google.com/?sl=en&tl=cs&text=${Uri.encodeComponent('One beer please')}',
            type: ActionType.reservation,
          ),
        if (activity['touristTraps'] != null)
          ActionableLink(
            title: 'Avoid Tourist Traps',
            url: 'https://maps.google.com/?q=${Uri.encodeComponent('local restaurants near ${activity['name']}')}',
            type: ActionType.tickets,
          ),
      ],
    );
  }
  
  static List<EnhancedActivity> _createActivitiesFromPlaces(
    List<Map<String, dynamic>> places,
    String destination
  ) {
    final activities = <EnhancedActivity>[];
    final timeSlots = ['09:00-11:00', '12:30-14:00', '15:30-17:00'];
    
    for (int i = 0; i < places.length && i < 3; i++) {
      final place = places[i];
      activities.add(EnhancedActivity(
        id: 'place_${i + 1}',
        title: place['name'] ?? 'Activity ${i + 1}',
        description: 'Visit ${place['name']} in $destination',
        timeSlot: timeSlots[i % timeSlots.length],
        estimatedDuration: Duration(hours: 2),
        type: _mapType('landmark'),
        location: Location(
          address: place['address'] ?? destination,
          latitude: 0.0,
          longitude: 0.0,
        ),
        costInfo: CostInfo(
          entryFee: 10.0,
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
          routeInstructions: 'Go to ${place['name']}',
          isAccessible: true,
        ),
        images: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000'],
        contextInfo: ContextualInfo(
          crowdLevel: 'Moderate',
          bestTimeToVisit: timeSlots[i % timeSlots.length].split('-')[0],
          weatherTips: ['Check weather'],
          localTips: ['Rated ${place['rating']}/5'],
          safetyAlerts: [],
          isIndoorActivity: false,
        ),
        actionableLinks: [
          ActionableLink(
            title: 'Directions',
            url: 'https://maps.google.com/?q=${Uri.encodeComponent(place['name'])}',
            type: ActionType.map,
          ),
        ],
      ));
    }
    
    return activities;
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
    return match != null ? double.parse(match.group(0)!) : 10.0;
  }
  
  static Duration _parseDuration(String duration) {
    final hourMatch = RegExp(r'(\d+)\s*h').firstMatch(duration);
    final minMatch = RegExp(r'(\d+)\s*m').firstMatch(duration);
    
    int hours = hourMatch != null ? int.parse(hourMatch.group(1)!) : 0;
    int minutes = minMatch != null ? int.parse(minMatch.group(1)!) : 0;
    
    if (hours == 0 && minutes == 0) {
      final numMatch = RegExp(r'(\d+)').firstMatch(duration);
      hours = numMatch != null ? int.parse(numMatch.group(1)!) : 2;
    }
    
    return Duration(hours: hours, minutes: minutes);
  }
  
  static Duration _parseTravelTime(String travel) {
    final minMatch = RegExp(r'(\d+)\s*min').firstMatch(travel);
    return Duration(minutes: minMatch != null ? int.parse(minMatch.group(1)!) : 15);
  }
  
  static TransportMode _getTransportMode(String travel) {
    if (travel.toLowerCase().contains('walk')) return TransportMode.walk;
    if (travel.toLowerCase().contains('metro') || travel.toLowerCase().contains('train')) return TransportMode.metro;
    if (travel.toLowerCase().contains('bus')) return TransportMode.bus;
    if (travel.toLowerCase().contains('taxi')) return TransportMode.taxi;
    return TransportMode.walk;
  }
  
  static List<String> _getImageForActivity(String type) {
    switch (type.toLowerCase()) {
      case 'restaurant':
        return ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5'];
      case 'museum':
        return ['https://images.unsplash.com/photo-1566127992631-137a642a90f4'];
      case 'nature':
        return ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e'];
      case 'shopping':
        return ['https://images.unsplash.com/photo-1441986300917-64674bd600d8'];
      case 'entertainment':
        return ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819'];
      default:
        return ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000'];
    }
  }
  
  static bool _isIndoorActivity(String type) {
    return ['museum', 'restaurant', 'shopping', 'entertainment'].contains(type.toLowerCase());
  }
  
  static String _extractCurrency(String cost) {
    if (cost.contains('CZK')) return 'CZK';
    if (cost.contains('EUR') || cost.contains('€')) return 'EUR';
    if (cost.contains('GBP') || cost.contains('£')) return 'GBP';
    if (cost.contains('JPY') || cost.contains('¥')) return 'JPY';
    return 'USD';
  }
  
  static double _parseTransportCost(String transport) {
    final match = RegExp(r'(\d+)\s*(CZK|EUR|USD|GBP)').firstMatch(transport);
    if (match != null) {
      final amount = double.parse(match.group(1)!);
      final currency = match.group(2)!;
      // Convert to USD approximation
      switch (currency) {
        case 'CZK': return amount * 0.044; // 1 CZK ≈ 0.044 USD
        case 'EUR': return amount * 1.1;   // 1 EUR ≈ 1.1 USD
        case 'GBP': return amount * 1.25;  // 1 GBP ≈ 1.25 USD
        default: return amount;
      }
    }
    return 2.0;
  }
  
  static Duration _parseTransportTime(String transport) {
    final minMatch = RegExp(r'(\d+)\s*min').firstMatch(transport);
    return Duration(minutes: minMatch != null ? int.parse(minMatch.group(1)!) : 15);
  }
  
  static TransportMode _getTransportModeFromDescription(String transport) {
    final lower = transport.toLowerCase();
    if (lower.contains('tram') || lower.contains('metro') || lower.contains('train')) return TransportMode.metro;
    if (lower.contains('bus')) return TransportMode.bus;
    if (lower.contains('taxi') || lower.contains('uber')) return TransportMode.taxi;
    if (lower.contains('bike')) return TransportMode.bike;
    return TransportMode.walk;
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