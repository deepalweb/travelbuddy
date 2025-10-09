import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/trip.dart';

class AzureOpenAIService {
  static const String baseUrl = 'http://localhost:3000'; // Update with your backend URL
  
  static Future<String> generateRichIntroduction(TripPlan tripPlan) async {
    try {
      // Extract places from activities
      final places = <String>[];
      for (final day in tripPlan.dailyPlans) {
        for (final activity in day.activities) {
          if (activity.activityTitle.isNotEmpty) {
            places.add(activity.activityTitle);
          }
        }
      }
      
      final response = await http.post(
        Uri.parse('$baseUrl/api/ai/enhance-introduction'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'destination': tripPlan.destination,
          'duration': tripPlan.duration,
          'places': places,
          'currentIntroduction': tripPlan.introduction,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['enhancedIntroduction'] ?? tripPlan.introduction;
      }
    } catch (e) {
      print('Error generating rich introduction: $e');
    }
    
    // Fallback to enhanced local introduction
    return _generateLocalEnhancedIntroduction(tripPlan);
  }
  
  static String _generateLocalEnhancedIntroduction(TripPlan tripPlan) {
    final destination = tripPlan.destination;
    final duration = tripPlan.duration;
    final totalActivities = tripPlan.dailyPlans
        .fold<int>(0, (sum, day) => sum + day.activities.length);
    
    // Extract unique activity types
    final activityTypes = <String>{};
    for (final day in tripPlan.dailyPlans) {
      for (final activity in day.activities) {
        if (activity.activityTitle.contains('Visit')) {
          activityTypes.add('sightseeing');
        } else if (activity.activityTitle.contains('Restaurant') || 
                   activity.activityTitle.contains('Cafe')) {
          activityTypes.add('dining');
        } else if (activity.activityTitle.contains('Museum')) {
          activityTypes.add('cultural');
        } else if (activity.activityTitle.contains('Park')) {
          activityTypes.add('nature');
        }
      }
    }
    
    String intro = "🌟 **Discover $destination** 🌟\n\n";
    intro += "Embark on an unforgettable $duration journey through $destination, ";
    intro += "carefully crafted with $totalActivities handpicked experiences. ";
    
    if (activityTypes.contains('cultural')) {
      intro += "Immerse yourself in rich cultural heritage, ";
    }
    if (activityTypes.contains('sightseeing')) {
      intro += "explore iconic landmarks, ";
    }
    if (activityTypes.contains('dining')) {
      intro += "savor authentic local cuisine, ";
    }
    if (activityTypes.contains('nature')) {
      intro += "connect with nature's beauty, ";
    }
    
    intro += "and create memories that will last a lifetime.\n\n";
    intro += "💡 **What makes this trip special:**\n";
    intro += "• Perfectly timed activities to avoid crowds\n";
    intro += "• Local insider tips and hidden gems\n";
    intro += "• Balanced mix of must-see attractions and authentic experiences\n";
    intro += "• Flexible itinerary with time to explore at your own pace\n\n";
    intro += "Get ready to fall in love with $destination! 🎒✨";
    
    return intro;
  }
}