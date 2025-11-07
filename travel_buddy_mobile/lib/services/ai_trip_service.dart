import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';

class AITripService {
  static Future<Map<String, dynamic>> generateTripPlan({
    required String destination,
    required String duration,
    String? interests,
    String? pace,
    String? budget,
  }) async {
    try {
      print('🤖 Generating AI trip plan for: $destination ($duration)');
      
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/ai/generate-trip-plan'),
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
        final dailyPlans = data['dailyPlans'] as List? ?? [];
        print('✅ AI trip plan from backend: ${dailyPlans.length} days');
        return data;
      } else {
        print('⚠️ Backend failed: ${response.statusCode}, using fallback');
        throw Exception('AI service failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ AI trip service error: $e');
      print('🔄 Using fallback plan for $duration');
      final fallback = _getFallbackPlan(destination, duration);
      final dailyPlans = fallback['dailyPlans'] as List? ?? [];
      print('🔄 Fallback generated: ${dailyPlans.length} days');
      return fallback;
    }
  }

  static Map<String, dynamic> _getFallbackPlan(String destination, String duration) {
    // Extract number of days from duration string
    final dayMatch = RegExp(r'(\d+)').firstMatch(duration);
    final numDays = dayMatch != null ? int.parse(dayMatch.group(1)!) : 1;
    
    final dailyPlans = <Map<String, dynamic>>[];
    
    for (int day = 1; day <= numDays; day++) {
      dailyPlans.add({
        'day': day,
        'title': 'Day $day: ${_getDayTheme(day, destination)}',
        'theme': _getDayDescription(day),
        'activities': _getDayActivities(day, destination)
      });
    }
    
    return {
      'tripTitle': 'Essential $duration in $destination',
      'destination': destination,
      'duration': duration,
      'introduction': 'Discover the highlights of $destination with this curated $duration itinerary.',
      'dailyPlans': dailyPlans,
      'conclusion': 'Enjoy your memorable time in $destination!'
    };
  }
  
  static String _getDayTheme(int day, String destination) {
    final themes = [
      'City Highlights',
      'Cultural Exploration', 
      'Local Experiences',
      'Hidden Gems',
      'Relaxation & Shopping',
      'Adventure Day',
      'Final Discoveries'
    ];
    return themes[(day - 1) % themes.length];
  }
  
  static String _getDayDescription(int day) {
    final descriptions = [
      'Essential Sights & Local Culture',
      'Museums, Art & Heritage',
      'Markets, Food & People',
      'Off the Beaten Path',
      'Leisure & Retail Therapy',
      'Outdoor Activities & Nature',
      'Last-minute Must-sees'
    ];
    return descriptions[(day - 1) % descriptions.length];
  }
  
  static List<Map<String, dynamic>> _getDayActivities(int day, String destination) {
    final baseActivities = [
      // Day 1 activities
      [
        {
          'timeOfDay': 'Morning (09:00-11:00)',
          'activityTitle': 'Historic City Center Exploration',
          'description': 'Explore the main attractions and historic sites. 🚶 Transport: Walking 💰 Cost: Free 🕒 Best Time: Morning',
          'icon': '🏛️',
          'category': 'Sightseeing',
          'effortLevel': 'Easy'
        },
        {
          'timeOfDay': 'Lunch (12:00-13:30)',
          'activityTitle': 'Traditional Local Restaurant',
          'description': 'Experience authentic local cuisine. 🚇 Transport: Short walk 💰 Cost: \$20-30 🕒 Best Time: Lunch hours',
          'icon': '🍽️',
          'category': 'Dining',
          'effortLevel': 'Easy'
        },
        {
          'timeOfDay': 'Afternoon (14:30-17:00)',
          'activityTitle': 'Main Museum Visit',
          'description': 'Discover local history and culture. 🚌 Transport: Public transport 💰 Cost: \$10-15 🕒 Best Time: Afternoon',
          'icon': '🏛️',
          'category': 'Culture',
          'effortLevel': 'Moderate'
        }
      ],
      // Day 2 activities
      [
        {
          'timeOfDay': 'Morning (09:30-12:00)',
          'activityTitle': 'Art Gallery & Cultural District',
          'description': 'Explore local art scene and cultural venues. 🚶 Transport: Walking 💰 Cost: \$5-10 🕒 Best Time: Morning',
          'icon': '🎨',
          'category': 'Culture',
          'effortLevel': 'Easy'
        },
        {
          'timeOfDay': 'Lunch (12:30-14:00)',
          'activityTitle': 'Rooftop Café Experience',
          'description': 'Enjoy city views with local coffee culture. 🚇 Transport: Metro 💰 Cost: \$15-25 🕒 Best Time: Lunch',
          'icon': '☕',
          'category': 'Dining',
          'effortLevel': 'Easy'
        },
        {
          'timeOfDay': 'Afternoon (15:00-18:00)',
          'activityTitle': 'Heritage Walking Tour',
          'description': 'Guided tour of historical neighborhoods. 🚶 Transport: Walking 💰 Cost: \$20-30 🕒 Best Time: Afternoon',
          'icon': '🚶',
          'category': 'Sightseeing',
          'effortLevel': 'Moderate'
        }
      ],
      // Day 3+ activities (cycling through variations)
      [
        {
          'timeOfDay': 'Morning (10:00-12:30)',
          'activityTitle': 'Local Market Experience',
          'description': 'Browse traditional markets and local crafts. 🚌 Transport: Bus 💰 Cost: \$10-20 🕒 Best Time: Morning',
          'icon': '🛍️',
          'category': 'Shopping',
          'effortLevel': 'Easy'
        },
        {
          'timeOfDay': 'Lunch (13:00-14:30)',
          'activityTitle': 'Street Food Adventure',
          'description': 'Sample authentic street food and local specialties. 🚶 Transport: Walking 💰 Cost: \$8-15 🕒 Best Time: Lunch',
          'icon': '🍜',
          'category': 'Dining',
          'effortLevel': 'Easy'
        },
        {
          'timeOfDay': 'Afternoon (15:30-17:30)',
          'activityTitle': 'Scenic Viewpoint Visit',
          'description': 'Enjoy panoramic city views and photo opportunities. 🚗 Transport: Taxi 💰 Cost: \$5-10 🕒 Best Time: Late afternoon',
          'icon': '🌆',
          'category': 'Sightseeing',
          'effortLevel': 'Moderate'
        }
      ]
    ];
    
    // Return activities for the specific day, cycling through available sets
    return baseActivities[(day - 1) % baseActivities.length];
  }
}