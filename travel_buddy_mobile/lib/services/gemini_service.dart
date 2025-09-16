import 'dart:convert';
import 'package:http/http.dart' as http;

class GeminiService {
  static const String _baseUrl = 'https://your-backend-api.com/api/recommendations';

  Future<List<Map<String, String>>> getLocalHotspots(double lat, double lng) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/hotspots?lat=$lat&lng=$lng'),
    );
    
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((item) => Map<String, String>.from(item)).toList();
    }
    return _getFallbackHotspots();
  }

  Future<String> getMoodSuggestion(String mood, double lat, double lng) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/mood?mood=$mood&lat=$lat&lng=$lng'),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['suggestion'];
    }
    return 'Discover something amazing nearby';
  }

  Future<List<Map<String, String>>> getSmartPlannerSuggestions(int hour, double lat, double lng) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/planner?lat=$lat&lng=$lng&hour=$hour'),
    );
    
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((item) => Map<String, String>.from(item)).toList();
    }
    return _getFallbackPlanner();
  }



  List<Map<String, String>> _getFallbackHotspots() {
    return [
      {'name': 'Local Attraction', 'tip': 'Popular with locals', 'visitors': '25'},
    ];
  }

  List<Map<String, String>> _getFallbackPlanner() {
    return [
      {'emoji': '🏛️', 'title': 'Explore Area', 'subtitle': 'Discover local culture', 'duration': '2h'},
    ];
  }
}