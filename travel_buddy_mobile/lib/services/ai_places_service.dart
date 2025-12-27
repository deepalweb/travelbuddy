import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/place.dart';
import '../config/environment.dart';

class AIPlacesService {
  static final AIPlacesService _instance = AIPlacesService._internal();
  factory AIPlacesService() => _instance;
  AIPlacesService._internal();

  /// Fetch AI-generated places based on location
  Future<List<Place>> fetchAIPlaces({
    required double latitude,
    required double longitude,
    String category = 'tourist attractions',
    int limit = 20,
  }) async {
    try {
      final url = Uri.parse(
        '${Environment.backendUrl}/api/ai-places/nearby?lat=$latitude&lng=$longitude&category=$category&limit=$limit'
      );

      print('🤖 Fetching AI places: $category near $latitude, $longitude');

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        if (data['status'] == 'OK' && data['results'] != null) {
          final List<dynamic> results = data['results'];
          
          final places = results.map((json) => Place.fromJson({
            'place_id': json['place_id'],
            'name': json['name'],
            'formatted_address': json['formatted_address'],
            'geometry': json['geometry'],
            'types': json['types'],
            'rating': json['rating'],
            'user_ratings_total': json['user_ratings_total'],
            'description': json['description'],
            'localTip': json['localTip'],
            'handyPhrase': json['handyPhrase'],
          })).toList();

          print('✅ AI generated ${places.length} places');
          return places;
        }
      }

      print('❌ AI places API returned status: ${response.statusCode}');
      return [];
    } catch (e) {
      print('❌ AI places fetch failed: $e');
      return [];
    }
  }
}
