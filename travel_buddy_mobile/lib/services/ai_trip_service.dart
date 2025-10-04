import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';

class AITripService {
  static Future<Map<String, dynamic>> generateTripPlan({
    required String destination,
    required String duration,
    String? interests,
    String? pace,
    String? budget,
  }) async {
    try {
      print('🤖 Generating AI trip plan for: $destination');
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/generate-trip-plan'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'destination': destination,
          'duration': duration,
          'interests': interests ?? 'general sightseeing',
          'pace': pace ?? 'Moderate',
          'travelStyles': [interests ?? 'Cultural'],
          'budget': budget ?? 'Mid-Range',
        }),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ AI trip plan generated successfully');
        return data;
      } else {
        throw Exception('AI service failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ AI trip service error: $e');
      // Return fallback plan
      return _getFallbackPlan(destination, duration);
    }
  }

  static Map<String, dynamic> _getFallbackPlan(String destination, String duration) {
    return {
      'tripTitle': 'Essential $duration in $destination',
      'destination': destination,
      'duration': duration,
      'introduction': 'Discover the highlights of $destination with this curated itinerary.',
      'dailyPlans': [
        {
          'day': 1,
          'title': 'Day 1: City Highlights',
          'theme': 'Essential Sights & Local Culture',
          'activities': [
            {
              'timeOfDay': 'Morning (09:00-11:00)',
              'activityTitle': 'Historic City Center',
              'description': 'Explore the main attractions and historic sites. 🚶 Transport: Walking 💰 Cost: Free 🕒 Best Time: Morning',
              'icon': '🏛️',
              'category': 'Sightseeing',
              'effortLevel': 'Easy'
            },
            {
              'timeOfDay': 'Lunch (12:00-13:30)',
              'activityTitle': 'Local Restaurant',
              'description': 'Experience authentic local cuisine. 🚇 Transport: Short walk 💰 Cost: \$20-30 🕒 Best Time: Lunch hours',
              'icon': '🍽️',
              'category': 'Dining',
              'effortLevel': 'Easy'
            }
          ]
        }
      ],
      'conclusion': 'Enjoy your memorable time in $destination!'
    };
  }
}