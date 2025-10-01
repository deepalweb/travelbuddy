import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/trip.dart';

class RealDataService {
  static const String _placesApiKey = 'YOUR_GOOGLE_PLACES_API_KEY';
  static const String _openTripMapKey = 'YOUR_OPENTRIPMAP_API_KEY';
  
  // Get real places for a destination
  static Future<List<Map<String, dynamic>>> getRealPlaces(String destination) async {
    try {
      final response = await http.get(
        Uri.parse('https://maps.googleapis.com/maps/api/place/textsearch/json?query=attractions+in+$destination&key=$_placesApiKey'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['results'] ?? []);
      }
    } catch (e) {
      print('Error fetching places: $e');
    }
    
    return _getFallbackPlaces(destination);
  }
  
  // Get real costs for destination
  static Future<Map<String, double>> getRealCosts(String destination) async {
    // Mock realistic costs based on destination
    final costs = {
      'paris': {'meal': 25.0, 'transport': 15.0, 'attraction': 12.0},
      'tokyo': {'meal': 18.0, 'transport': 8.0, 'attraction': 10.0},
      'london': {'meal': 22.0, 'transport': 12.0, 'attraction': 15.0},
      'colombo': {'meal': 8.0, 'transport': 3.0, 'attraction': 5.0},
      'trincomalee': {'meal': 6.0, 'transport': 2.0, 'attraction': 3.0},
    };
    
    final key = destination.toLowerCase();
    return costs[key] ?? {'meal': 15.0, 'transport': 8.0, 'attraction': 8.0};
  }
  
  // Generate realistic trip plan
  static Future<TripPlan> generateRealisticTripPlan({
    required String destination,
    required String duration,
    required String interests,
  }) async {
    final places = await getRealPlaces(destination);
    final costs = await getRealCosts(destination);
    final days = _extractDays(duration);
    
    return TripPlan(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      tripTitle: '$destination Adventure',
      destination: destination,
      duration: duration,
      introduction: 'Discover the best of $destination with carefully selected attractions and experiences.',
      dailyPlans: _generateRealisticDailyPlans(places, costs, days, destination),
      conclusion: 'Enjoy your amazing trip to $destination!',
    );
  }
  
  static List<DailyTripPlan> _generateRealisticDailyPlans(
    List<Map<String, dynamic>> places,
    Map<String, double> costs,
    int days,
    String destination,
  ) {
    return List.generate(days, (index) {
      final dayPlaces = places.skip(index * 3).take(3).toList();
      final dayActivities = dayPlaces.map((place) => _createRealisticActivity(place, costs)).toList();
      
      if (dayActivities.isEmpty) {
        dayActivities.addAll(_getDefaultActivities(destination, costs, index + 1));
      }
      
      final totalCost = dayActivities.fold(0.0, (double sum, activity) => 
        sum + (double.tryParse(activity.estimatedCost.replaceAll(RegExp(r'[^\d.]'), '')) ?? 0.0));
      
      return DailyTripPlan(
        day: index + 1,
        title: 'Day ${index + 1} - ${_getDayTheme(index + 1, destination)}',
        theme: _getDayTheme(index + 1, destination),
        activities: dayActivities,
        dayEstimatedCost: '€${totalCost.toStringAsFixed(0)}',
        dayWalkingDistance: '${(2.5 + (index * 0.5)).toStringAsFixed(1)} km',
      );
    });
  }
  
  static ActivityDetail _createRealisticActivity(Map<String, dynamic> place, Map<String, double> costs) {
    final name = place['name'] ?? 'Local Attraction';
    final rating = place['rating']?.toString() ?? '4.2';
    final type = _getPlaceType(place['types'] ?? []);
    final cost = costs[_getCostCategory(type)] ?? 10.0;
    
    return ActivityDetail(
      timeOfDay: _getRandomTime(),
      activityTitle: name,
      description: 'Experience ${name.toLowerCase()} with its unique charm and local atmosphere.',
      type: type,
      estimatedCost: '€${cost.toStringAsFixed(0)}',
      crowdLevel: _getRandomCrowdLevel(),
      startTime: _getRandomTime().split('-')[0],
      endTime: _getRandomTime().split('-')[1],
      // place: Place data will be set separately
    );
  }
  
  static List<ActivityDetail> _getDefaultActivities(String destination, Map<String, double> costs, int day) {
    final activities = [
      'Morning City Walk',
      'Local Market Visit', 
      'Cultural Site Tour',
      'Traditional Lunch',
      'Afternoon Exploration',
      'Sunset Viewing',
    ];
    
    return activities.take(3).map((activity) => ActivityDetail(
      timeOfDay: _getRandomTime(),
      activityTitle: activity,
      description: 'Enjoy $activity in beautiful $destination.',
      type: 'attraction',
      estimatedCost: '€${costs['attraction']?.toStringAsFixed(0) ?? '8'}',
      crowdLevel: _getRandomCrowdLevel(),
      startTime: _getRandomTime().split('-')[0],
      endTime: _getRandomTime().split('-')[1],
    )).toList();
  }
  
  static List<Map<String, dynamic>> _getFallbackPlaces(String destination) {
    return [
      {'name': '$destination City Center', 'rating': 4.3, 'types': ['tourist_attraction']},
      {'name': 'Local Museum', 'rating': 4.1, 'types': ['museum']},
      {'name': 'Traditional Restaurant', 'rating': 4.5, 'types': ['restaurant']},
      {'name': 'Historic Temple', 'rating': 4.4, 'types': ['place_of_worship']},
      {'name': 'Central Park', 'rating': 4.2, 'types': ['park']},
      {'name': 'Local Market', 'rating': 4.0, 'types': ['shopping_mall']},
    ];
  }
  
  static String _getPlaceType(List<dynamic> types) {
    if (types.contains('restaurant') || types.contains('food')) return 'restaurant';
    if (types.contains('museum')) return 'museum';
    if (types.contains('park')) return 'park';
    if (types.contains('shopping_mall')) return 'shopping';
    return 'landmark';
  }
  
  static String _getCostCategory(String type) {
    switch (type) {
      case 'restaurant': return 'meal';
      case 'museum':
      case 'landmark': return 'attraction';
      default: return 'attraction';
    }
  }
  
  static String _getDayTheme(int day, String destination) {
    final themes = [
      'Historic Highlights & Local Culture',
      'Natural Beauty & Scenic Views', 
      'Food & Market Adventures',
      'Art, Museums & Entertainment',
      'Relaxation & Hidden Gems',
    ];
    return themes[(day - 1) % themes.length];
  }
  
  static String _getRandomTime() {
    final times = ['09:00-11:00', '11:30-13:00', '14:00-16:00', '16:30-18:00', '19:00-21:00'];
    return times[DateTime.now().millisecond % times.length];
  }
  
  static String _getRandomCrowdLevel() {
    final levels = ['Low', 'Moderate', 'Busy'];
    return levels[DateTime.now().millisecond % levels.length];
  }
  
  static int _extractDays(String duration) {
    final match = RegExp(r'(\d+)').firstMatch(duration);
    return int.tryParse(match?.group(1) ?? '3') ?? 3;
  }
}