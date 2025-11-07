import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/place.dart';
import '../config/environment.dart';

class AzureAIPlacesService {
  static final AzureAIPlacesService _instance = AzureAIPlacesService._internal();
  factory AzureAIPlacesService() => _instance;
  AzureAIPlacesService._internal();

  // Cache for generated places
  final Map<String, List<Place>> _cache = {};
  static const int _cacheExpiryMinutes = 60;

  // Generate comprehensive places using Azure OpenAI
  Future<List<Place>> generatePlaces({
    required double latitude,
    required double longitude,
    required String category,
    int limit = 50,
    String userType = 'Solo traveler',
    String vibe = 'Cultural',
    String language = 'English',
  }) async {
    final cacheKey = '${latitude}_${longitude}_${category}_${userType}_${vibe}';
    
    // Check cache first
    if (_cache.containsKey(cacheKey)) {
      print('🎯 Using cached Azure AI places for $category');
      return _cache[cacheKey]!;
    }

    try {
      final prompt = _createPlacesPrompt(
        latitude: latitude,
        longitude: longitude,
        category: category,
        limit: limit,
        userType: userType,
        vibe: vibe,
        language: language,
      );

      final response = await _callAzureOpenAI(prompt);
      final places = _parsePlacesResponse(response, latitude, longitude);
      
      // Cache the results
      _cache[cacheKey] = places;
      
      print('🤖 Generated ${places.length} places with Azure OpenAI');
      return places;
      
    } catch (e) {
      print('❌ Azure OpenAI places generation failed: $e');
      return [];
    }
  }

  // Enrich existing places with AI-generated content
  Future<List<Place>> enrichPlaces(List<Place> places) async {
    if (places.isEmpty) return places;

    try {
      final prompt = _createEnrichmentPrompt(places);
      final response = await _callAzureOpenAI(prompt);
      final enrichedData = _parseEnrichmentResponse(response);
      
      return places.map<Place>((place) {
        final enrichment = enrichedData[place.id];
        if (enrichment != null) {
          return Place(
            id: place.id,
            name: place.name,
            address: place.address,
            latitude: place.latitude,
            longitude: place.longitude,
            rating: place.rating,
            type: enrichment['type'] ?? place.type,
            photoUrl: place.photoUrl,
            description: enrichment['description'] ?? place.description,
            localTip: enrichment['localTip'] ?? place.localTip,
            handyPhrase: enrichment['handyPhrase'] ?? place.handyPhrase,
          );
        }
        return place;
      }).toList();
      
    } catch (e) {
      print('❌ Azure OpenAI enrichment failed: $e');
      return places;
    }
  }

  // Generate travel itinerary from places
  Future<Map<String, dynamic>?> generateItinerary(List<Place> places) async {
    if (places.isEmpty) return null;

    try {
      final prompt = _createItineraryPrompt(places);
      final response = await _callAzureOpenAI(prompt);
      return json.decode(response);
      
    } catch (e) {
      print('❌ Azure OpenAI itinerary generation failed: $e');
      return null;
    }
  }

  // Call backend places endpoint with actual user location and query
  Future<String> _callAzureOpenAI(String prompt, {int retries = 3}) async {
    // Extract location and category from prompt for proper API call
    final latMatch = RegExp(r'coordinates \(([^,]+),').firstMatch(prompt);
    final lngMatch = RegExp(r'coordinates \([^,]+, ([^)]+)\)').firstMatch(prompt);
    final categoryMatch = RegExp(r'category "([^"]+)"').firstMatch(prompt);
    
    final lat = latMatch != null ? double.tryParse(latMatch.group(1)!) ?? 40.7128 : 40.7128;
    final lng = lngMatch != null ? double.tryParse(lngMatch.group(1)!) ?? -74.0060 : -74.0060;
    final category = categoryMatch?.group(1) ?? 'restaurants';
    
    for (int attempt = 0; attempt <= retries; attempt++) {
      try {
        // Use actual user location and category
        final response = await http.get(
          Uri.parse('${Environment.backendUrl}/api/places/search?query=${Uri.encodeComponent(category)}&lat=$lat&lng=$lng'),
          headers: {'Content-Type': 'application/json'},
        ).timeout(const Duration(seconds: 30));

        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          print('✅ Backend places API returned ${data is List ? data.length : 'data'} results for $category at ($lat, $lng)');
          // Convert places data to JSON string for parsing
          return json.encode(data);
        }
        
        // Handle rate limiting
        if (response.statusCode == 429) {
          if (attempt < retries) {
            final retryAfter = int.tryParse(response.headers['retry-after'] ?? '60') ?? 60;
            final waitTime = (retryAfter + (attempt * 10)).clamp(5, 120); // 5-120 seconds
            print('⏳ Rate limited, waiting ${waitTime}s before retry ${attempt + 1}/$retries');
            await Future.delayed(Duration(seconds: waitTime));
            continue;
          }
        }
        
        throw Exception('Azure OpenAI call failed: ${response.statusCode}');
        
      } catch (e) {
        if (attempt == retries) rethrow;
        
        // Exponential backoff for other errors
        final waitTime = (5 * (attempt + 1)).clamp(5, 30);
        print('⏳ Request failed, retrying in ${waitTime}s: $e');
        await Future.delayed(Duration(seconds: waitTime));
      }
    }
    
    throw Exception('Azure OpenAI call failed after $retries retries');
  }

  // Create places generation prompt
  String _createPlacesPrompt({
    required double latitude,
    required double longitude,
    required String category,
    required int limit,
    required String userType,
    required String vibe,
    required String language,
  }) {
    return '''
You are an expert local travel guide AI. Generate $limit realistic and diverse places near coordinates ($latitude, $longitude) for category "$category".

User Profile:
- Type: $userType
- Preferred Vibe: $vibe
- Language: $language

Generate a JSON array of places with this exact structure:
[
  {
    "place_id": "unique_generated_id",
    "name": "Place Name",
    "formatted_address": "Complete realistic address",
    "geometry": {
      "location": {
        "lat": ${latitude + (0.01 * (0.5 - 0.5))},
        "lng": ${longitude + (0.01 * (0.5 - 0.5))}
      }
    },
    "rating": 4.2,
    "user_ratings_total": 150,
    "price_level": 2,
    "types": ["${category.toLowerCase()}", "establishment"],
    "business_status": "OPERATIONAL",
    "description": "Engaging 2-3 sentence description",
    "localTip": "Practical local tip",
    "handyPhrase": "Useful phrase in $language",
    "type": "User-friendly category name",
    "opening_hours": {
      "open_now": true,
      "weekday_text": ["Monday: 9:00 AM – 6:00 PM"]
    }
  }
]

Requirements:
- Vary coordinates within 0.01 degree radius
- Realistic ratings (3.5-4.8)
- Diverse price levels (1-4)
- Authentic local names and addresses
- Practical tips and phrases
- Mix of popular and hidden gems

Return ONLY the JSON array, no other text.
''';
  }

  // Create enrichment prompt for existing places
  String _createEnrichmentPrompt(List<Place> places) {
    final placeData = places.map((p) => '''
- ID: ${p.id}
- Name: ${p.name}
- Address: ${p.address}
- Type: ${p.type}
''').join('\n');

    return '''
You are a creative travel content writer. Enrich these places with engaging content:

$placeData

Generate a JSON object where each key is the place ID and value contains:
{
  "place_id_here": {
    "description": "Engaging 2-3 sentence description",
    "localTip": "Practical local tip",
    "handyPhrase": "Useful common phrase",
    "type": "User-friendly category"
  }
}

Return ONLY the JSON object, no other text.
''';
  }

  // Create itinerary prompt
  String _createItineraryPrompt(List<Place> places) {
    final placeDetails = places.map((p) => 
      '- ${p.name} (${p.type}) - ID: ${p.id} - ${p.description}'
    ).join('\n');

    return '''
Create a 1-day itinerary using these places:

$placeDetails

Generate JSON with this structure:
{
  "title": "Engaging day title",
  "introduction": "Brief intro paragraph",
  "dailyPlan": [
    {
      "day": 1,
      "theme": "Day theme",
      "activities": [
        {
          "placeId": "place_id_from_input",
          "placeName": "Place name",
          "activityDescription": "What to do here",
          "estimatedTime": "9:00 AM - 11:00 AM",
          "notes": "Optional tips"
        }
      ]
    }
  ],
  "conclusion": "Wrap-up paragraph"
}

Return ONLY the JSON object, no other text.
''';
  }

  // Parse places response from Gemini
  List<Place> _parsePlacesResponse(String response, double lat, double lng) {
    try {
      final List<dynamic> data = json.decode(response);
      return data.map<Place>((json) => Place.fromJson({
        ...Map<String, dynamic>.from(json),
        'ai_generated': true,
        'source': 'azure_openai',
      })).toList();
    } catch (e) {
      print('❌ Failed to parse Gemini places response: $e');
      return [];
    }
  }

  // Parse enrichment response
  Map<String, Map<String, dynamic>> _parseEnrichmentResponse(String response) {
    try {
      final Map<String, dynamic> data = json.decode(response);
      return data.map((key, value) => 
        MapEntry(key, Map<String, dynamic>.from(value))
      );
    } catch (e) {
      print('❌ Failed to parse enrichment response: $e');
      return {};
    }
  }

  // Clear cache
  void clearCache() {
    _cache.clear();
  }
}