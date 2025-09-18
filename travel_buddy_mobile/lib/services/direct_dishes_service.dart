import 'dart:convert';
import 'package:http/http.dart' as http;

class DirectDishesService {
  static const String _geminiApiKey = 'AIzaSyBTAYqrMpZYcVjzFTW9V9RH-IWDacEzXRo';
  static const String _placesApiKey = 'AIzaSyA89E6gkU7-nUMYk9JPt6xxYHVV4Yevtio';
  
  static Future<List<Map<String, dynamic>>> getLocalDishes({
    required double lat,
    required double lng,
    int limit = 10,
  }) async {
    print('🍽️ Getting local dishes for: $lat, $lng');
    
    try {
      // Step 1: Get restaurants from Google Places
      final restaurants = await _getRestaurantsFromGoogle(lat, lng);
      print('🏪 Found ${restaurants.length} restaurants');
      
      // Step 2: Generate dishes with Gemini AI
      final dishes = await _generateDishesWithGemini(lat, lng, restaurants, limit);
      
      print('✅ Generated ${dishes.length} local dishes');
      return dishes;
      
    } catch (e) {
      print('❌ Direct dishes error: $e');
      return _createFallbackDishes(lat, lng, limit);
    }
  }
  
  static Future<List<Map<String, dynamic>>> _getRestaurantsFromGoogle(double lat, double lng) async {
    try {
      final url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
          '?location=$lat,$lng'
          '&radius=2000'
          '&type=restaurant'
          '&key=$_placesApiKey';
      
      final response = await http.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          return (data['results'] as List).take(8).map((place) => {
            'name': place['name'],
            'address': place['vicinity'] ?? '',
            'rating': place['rating'] ?? 4.0,
            'types': place['types'] ?? ['restaurant'],
            'place_id': place['place_id'],
          }).toList();
        }
      }
    } catch (e) {
      print('Places API error: $e');
    }
    
    return [];
  }
  
  static Future<List<Map<String, dynamic>>> _generateDishesWithGemini(
    double lat, 
    double lng, 
    List<Map<String, dynamic>> restaurants,
    int limit
  ) async {
    
    final restaurantText = restaurants.take(5).map((r) => 
      '${r['name']} (${r['rating']}/5, ${r['address']})'
    ).join('\n');
    
    final prompt = '''
Based on location coordinates $lat, $lng and these local restaurants:

$restaurantText

Generate $limit popular local dishes from this area. For each dish provide:

1. Name of the dish
2. Brief description (1-2 sentences)
3. Cuisine type
4. Price range in local currency
5. Restaurant name where it's found
6. Dietary tags if applicable

Return ONLY valid JSON array:
[
  {
    "name": "Dish Name",
    "description": "Description of the dish",
    "cuisine": "Cuisine Type",
    "priceRange": "mid-range",
    "averagePrice": "\$12-15",
    "restaurantName": "Restaurant Name",
    "restaurantAddress": "Address",
    "restaurantId": "place_id",
    "imageUrl": "",
    "rating": 4.2,
    "dietaryTags": ["tag1", "tag2"],
    "culturalNote": "Cultural significance"
  }
]
''';

    try {
      final response = await http.post(
        Uri.parse('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$_geminiApiKey'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'contents': [{'parts': [{'text': prompt}]}]
        }),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final text = data['candidates']?[0]?['content']?['parts']?[0]?['text'] ?? '';
        
        print('🤖 Gemini dishes response: ${text.substring(0, 200)}...');
        
        return _parseGeminiDishesResponse(text, restaurants);
      }
    } catch (e) {
      print('Gemini dishes API error: $e');
    }
    
    return _createDishesFromRestaurants(restaurants);
  }
  
  static List<Map<String, dynamic>> _parseGeminiDishesResponse(
    String response, 
    List<Map<String, dynamic>> restaurants
  ) {
    try {
      // Extract JSON from response
      final jsonMatch = response.contains('[') ? 
        response.substring(response.indexOf('['), response.lastIndexOf(']') + 1) : '';
      
      if (jsonMatch.isNotEmpty) {
        final List<dynamic> aiDishes = json.decode(jsonMatch);
        
        return aiDishes.map((dish) {
          // Match with real restaurant if possible
          final matchedRestaurant = restaurants.firstWhere(
            (r) => r['name'].toLowerCase().contains(dish['restaurantName']?.toLowerCase() ?? '') ||
                   dish['restaurantName']?.toLowerCase()?.contains(r['name'].toLowerCase()) == true,
            orElse: () => restaurants.isNotEmpty ? restaurants.first : {},
          );
          
          return {
            'id': DateTime.now().millisecondsSinceEpoch.toString() + '_${aiDishes.indexOf(dish)}',
            'name': dish['name'] ?? 'Local Dish',
            'description': dish['description'] ?? 'Delicious local specialty',
            'priceRange': dish['priceRange'] ?? 'mid-range',
            'averagePrice': dish['averagePrice'] ?? '\$10-15',
            'cuisine': dish['cuisine'] ?? 'Local',
            'restaurantName': dish['restaurantName'] ?? matchedRestaurant['name'] ?? 'Local Restaurant',
            'restaurantAddress': dish['restaurantAddress'] ?? matchedRestaurant['address'] ?? 'Local Area',
            'restaurantId': matchedRestaurant['place_id'] ?? 'local_${DateTime.now().millisecondsSinceEpoch}',
            'imageUrl': dish['imageUrl'] ?? '',
            'rating': dish['rating'] ?? (matchedRestaurant['rating'] ?? 4.0),
            'dietaryTags': dish['dietaryTags'] ?? [],
            'culturalNote': dish['culturalNote'] ?? 'A local favorite',
          };
        }).toList();
      }
    } catch (e) {
      print('Parse dishes error: $e');
    }
    
    return _createDishesFromRestaurants(restaurants);
  }
  
  static List<Map<String, dynamic>> _createDishesFromRestaurants(
    List<Map<String, dynamic>> restaurants
  ) {
    final dishes = <Map<String, dynamic>>[];
    final dishNames = ['Local Special', 'Chef\'s Recommendation', 'Traditional Dish', 'House Specialty', 'Regional Favorite'];
    
    for (int i = 0; i < restaurants.length && i < 5; i++) {
      final restaurant = restaurants[i];
      dishes.add({
        'id': 'fallback_${i + 1}',
        'name': dishNames[i % dishNames.length],
        'description': 'Popular dish at ${restaurant['name']}',
        'priceRange': 'mid-range',
        'averagePrice': '\$12-18',
        'cuisine': 'Local',
        'restaurantName': restaurant['name'],
        'restaurantAddress': restaurant['address'],
        'restaurantId': restaurant['place_id'],
        'imageUrl': '',
        'rating': restaurant['rating'] ?? 4.0,
        'dietaryTags': [],
        'culturalNote': 'Recommended by locals',
      });
    }
    
    return dishes;
  }
  
  static List<Map<String, dynamic>> _createFallbackDishes(double lat, double lng, int limit) {
    return List.generate(limit, (index) => {
      'id': 'fallback_${index + 1}',
      'name': 'Local Dish ${index + 1}',
      'description': 'Traditional local cuisine from this area',
      'priceRange': 'mid-range',
      'averagePrice': '\$10-15',
      'cuisine': 'Local',
      'restaurantName': 'Local Restaurant',
      'restaurantAddress': 'Nearby location',
      'restaurantId': 'local_${index + 1}',
      'imageUrl': '',
      'rating': 4.0 + (index % 10) * 0.1,
      'dietaryTags': [],
      'culturalNote': 'A regional specialty',
    });
  }
}