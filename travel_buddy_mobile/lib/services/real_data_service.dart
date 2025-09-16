import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';

class RealDataService {
  // All Google API calls now go through Azure backend

  // Get real local hotspots using backend
  static Future<List<Map<String, dynamic>>> getRealLocalHotspots(double lat, double lng) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/recommendations/hotspots?lat=$lat&lng=$lng'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      print('Error fetching real hotspots: $e');
      return [];
    }
  }

  // Get nearby events
  static Future<List<Map<String, dynamic>>> getNearbyEvents(double lat, double lng) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/events/nearby?lat=$lat&lng=$lng'),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (e) {
      print('Error fetching nearby events: $e');
      return [];
    }
  }

  // Get current weather
  static Future<Map<String, dynamic>> getCurrentWeather(double lat, double lng) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/weather/current?lat=$lat&lng=$lng'),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {};
    } catch (e) {
      print('Error fetching weather: $e');
      return {};
    }
  }

  // Get user stats
  static Future<Map<String, dynamic>> getUserStats(String mongoId) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/users/$mongoId/stats'),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return {};
    } catch (e) {
      print('Error fetching user stats: $e');
      return {};
    }
  }

  // Get mood-based suggestions using backend
  static Future<String> getRealMoodSuggestion(String mood, double lat, double lng) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/recommendations/mood?mood=$mood&lat=$lat&lng=$lng'),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['suggestion'] ?? _getFallbackMoodSuggestion(mood);
      }
      
      return _getFallbackMoodSuggestion(mood);
    } catch (e) {
      return _getFallbackMoodSuggestion(mood);
    }
  }

  // Get real daily planner suggestions
  static Future<List<Map<String, String>>> getRealDailyPlanner(int hour, double lat, double lng) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/recommendations/planner?lat=$lat&lng=$lng&hour=$hour'),
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => Map<String, String>.from(item)).toList();
      }
      
      // Fallback to Google Places based on time
      return await _getTimeBasedPlaces(hour, lat, lng);
    } catch (e) {
      return _getFallbackPlanner(hour);
    }
  }

  // Removed - now handled by backend

  static Future<List<Map<String, String>>> _getTimeBasedPlaces(int hour, double lat, double lng) async {
    // This is now handled by the backend planner endpoint
    return _getFallbackPlanner(hour);
  }

  // Helper methods removed - now handled by Azure backend

  static String _getFallbackMoodSuggestion(String mood) {
    switch (mood.toLowerCase()) {
      case 'adventure':
        return 'Explore nearby hiking trails and outdoor activities';
      case 'relaxing':
        return 'Find a peaceful park or café for some downtime';
      case 'cultural':
        return 'Visit local museums, galleries, or historical sites';
      case 'foodie':
        return 'Try highly-rated local restaurants and cafés';
      default:
        return 'Discover something amazing nearby';
    }
  }

  static List<Map<String, String>> _getFallbackPlanner(int hour) {
    if (hour >= 9 && hour < 12) {
      return [
        {'emoji': '☕', 'title': 'Morning Coffee', 'subtitle': 'Find a local café', 'duration': '1h'},
        {'emoji': '🚶', 'title': 'Morning Walk', 'subtitle': 'Explore the area', 'duration': '30min'},
      ];
    } else if (hour >= 12 && hour < 17) {
      return [
        {'emoji': '🍽️', 'title': 'Lunch Break', 'subtitle': 'Try local cuisine', 'duration': '1h'},
        {'emoji': '🏛️', 'title': 'Sightseeing', 'subtitle': 'Visit attractions', 'duration': '2h'},
      ];
    } else {
      return [
        {'emoji': '🌅', 'title': 'Evening Activity', 'subtitle': 'Enjoy the sunset', 'duration': '1h'},
        {'emoji': '🍽️', 'title': 'Dinner', 'subtitle': 'Local restaurant', 'duration': '1.5h'},
      ];
    }
  }
}