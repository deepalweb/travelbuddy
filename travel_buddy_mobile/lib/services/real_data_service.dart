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
      tripTitle: '$destination ${duration} Adventure',
      destination: destination,
      duration: duration,
      introduction: 'Discover the best of $destination with carefully selected attractions and experiences.',
      dailyPlans: _generateStructuredDailyPlans(places, costs, days, destination),
      conclusion: 'Enjoy your amazing trip to $destination!',
      totalEstimatedCost: '€${(costs['meal']! + costs['attraction']! + costs['transport']!) * days}',
      estimatedWalkingDistance: '${(2.5 * days).toStringAsFixed(1)} km',
    );
  }
  
  static List<DailyTripPlan> _generateStructuredDailyPlans(
    List<Map<String, dynamic>> places,
    Map<String, double> costs,
    int days,
    String destination,
  ) {
    final startDate = DateTime.now().add(Duration(days: 7));
    
    return List.generate(days, (index) {
      final dayPlaces = places.skip(index * 3).take(3).toList();
      final dayActivities = dayPlaces.map((place) => _createStructuredActivity(place, costs, index)).toList();
      
      if (dayActivities.isEmpty) {
        dayActivities.addAll(_getStructuredDefaultActivities(destination, costs, index + 1));
      }
      
      final totalCost = dayActivities.fold(0.0, (double sum, activity) => 
        sum + (double.tryParse(activity.estimatedCost.replaceAll(RegExp(r'[^\d.]'), '')) ?? 0.0));
      
      final dayDate = startDate.add(Duration(days: index));
      final dayName = _getDayName(dayDate.weekday);
      
      return DailyTripPlan(
        day: index + 1,
        title: '${_getDayTheme(index + 1, destination)}',
        theme: _getDayTheme(index + 1, destination),
        date: '$dayName, ${_formatDate(dayDate)}',
        summary: _getDaySummary(index + 1, destination, dayActivities.length),
        activities: dayActivities,
        dayEstimatedCost: '€${totalCost.toStringAsFixed(0)}',
        dayWalkingDistance: '${(2.5 + (index * 0.5)).toStringAsFixed(1)} km',
        totalWalkingTime: '${(35 + (index * 10))} min',
        totalTravelTime: '${(20 + (index * 15))} min',
        dailyRecap: 'Explored ${dayActivities.length} locations with ${_getRecapDetails(dayActivities)}',
      );
    });
  }
  
  static ActivityDetail _createStructuredActivity(Map<String, dynamic> place, Map<String, double> costs, int dayIndex) {
    final name = place['name'] ?? 'Local Attraction';
    final rating = (place['rating'] as num?)?.toDouble() ?? 4.2;
    final type = _getPlaceType(place['types'] ?? []);
    final cost = costs[_getCostCategory(type)] ?? 10.0;
    final timeSlot = _getTimeSlot(dayIndex % 4);
    final category = _getCategoryName(type);
    
    return ActivityDetail(
      timeOfDay: timeSlot,
      activityTitle: name,
      description: 'Experience ${name.toLowerCase()} with its unique charm and local atmosphere.',
      type: type,
      category: category,
      estimatedCost: '€${cost.toStringAsFixed(0)}',
      crowdLevel: _getCrowdLevel(rating),
      startTime: timeSlot.split('-')[0],
      endTime: timeSlot.split('-')[1],
      // Enhanced structured fields
      googlePlaceId: place['place_id'] ?? 'mock_${DateTime.now().millisecond}',
      rating: rating,
      userRatingsTotal: (place['user_ratings_total'] as int?) ?? (rating * 100).round(),
      highlight: _getHighlight(name, type),
      socialProof: '${(rating * 50).round()} travelers visited today',
      practicalTip: _getPracticalTip(type),
      travelMode: 'walking',
      travelTimeMin: 10 + (dayIndex * 5),
      estimatedVisitDurationMin: _getVisitDuration(type),
      photoThumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000',
      fullAddress: '${name}, ${place['vicinity'] ?? 'City Center'}',
      openingHours: _getOpeningHours(type),
      isOpenNow: true,
      weatherNote: _getWeatherNote(type),
      tags: _getTags(type, rating),
      bookingLink: type == 'restaurant' ? 'https://opentable.com' : null,
    );
  }
  
  static List<ActivityDetail> _getStructuredDefaultActivities(String destination, Map<String, double> costs, int day) {
    final activities = [
      {'name': 'Morning City Walk', 'type': 'landmark', 'rating': 4.3},
      {'name': 'Local Market Visit', 'type': 'shopping', 'rating': 4.1}, 
      {'name': 'Cultural Site Tour', 'type': 'museum', 'rating': 4.5},
      {'name': 'Traditional Lunch', 'type': 'restaurant', 'rating': 4.4},
    ];
    
    return activities.take(3).asMap().entries.map((entry) {
      final index = entry.key;
      final activity = entry.value;
      final timeSlot = _getTimeSlot(index);
      final type = activity['type'] as String;
      final rating = activity['rating'] as double;
      
      return ActivityDetail(
        timeOfDay: timeSlot,
        activityTitle: activity['name'] as String,
        description: 'Enjoy ${activity['name']} in beautiful $destination.',
        type: type,
        category: _getCategoryName(type),
        estimatedCost: '€${costs[_getCostCategory(type)]?.toStringAsFixed(0) ?? '8'}',
        crowdLevel: _getCrowdLevel(rating),
        startTime: timeSlot.split('-')[0],
        endTime: timeSlot.split('-')[1],
        // Enhanced fields
        googlePlaceId: 'default_${day}_${index}',
        rating: rating,
        userRatingsTotal: (rating * 80).round(),
        highlight: _getHighlight(activity['name'] as String, type),
        socialProof: '${(rating * 40).round()} travelers visited today',
        practicalTip: _getPracticalTip(type),
        travelMode: 'walking',
        travelTimeMin: 5 + (index * 5),
        estimatedVisitDurationMin: _getVisitDuration(type),
        photoThumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000',
        fullAddress: '${activity['name']}, $destination',
        openingHours: _getOpeningHours(type),
        isOpenNow: true,
        weatherNote: _getWeatherNote(type),
        tags: _getTags(type, rating),
        bookingLink: type == 'restaurant' ? 'https://opentable.com' : null,
      );
    }).toList();
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
  
  // Helper methods for structured format
  static String _getTimeSlot(int index) {
    final slots = ['08:30-09:30', '10:00-12:00', '12:30-13:30', '14:00-16:00', '18:00-20:00'];
    return slots[index % slots.length];
  }
  
  static String _getCategoryName(String type) {
    switch (type) {
      case 'restaurant': return 'Food & Drink';
      case 'museum': return 'Culture & Museums';
      case 'park': return 'Outdoor & Nature';
      case 'shopping': return 'Shopping & Markets';
      default: return 'Landmarks & Attractions';
    }
  }
  
  static String _getCrowdLevel(double rating) {
    if (rating >= 4.5) return 'High';
    if (rating >= 4.0) return 'Moderate';
    return 'Low';
  }
  
  static String _getHighlight(String name, String type) {
    switch (type) {
      case 'restaurant': return 'Authentic local cuisine with great atmosphere';
      case 'museum': return 'Rich cultural experience with guided tours';
      case 'park': return 'Beautiful outdoor space perfect for relaxation';
      default: return 'Must-see iconic attraction with photo opportunities';
    }
  }
  
  static String _getPracticalTip(String type) {
    switch (type) {
      case 'restaurant': return 'Reserve table in advance, cash preferred';
      case 'museum': return 'Buy skip-the-line tickets online';
      case 'park': return 'Best visited in early morning or late afternoon';
      default: return 'Arrive early to avoid crowds';
    }
  }
  
  static int _getVisitDuration(String type) {
    switch (type) {
      case 'restaurant': return 60;
      case 'museum': return 120;
      case 'park': return 90;
      default: return 75;
    }
  }
  
  static String _getOpeningHours(String type) {
    switch (type) {
      case 'restaurant': return '12:00-22:00';
      case 'museum': return '09:00-17:00';
      case 'park': return '06:00-20:00';
      default: return '09:00-18:00';
    }
  }
  
  static String _getWeatherNote(String type) {
    switch (type) {
      case 'park': return 'Better on sunny days';
      case 'museum': return 'Perfect for rainy weather';
      default: return 'Weather independent';
    }
  }
  
  static List<String> _getTags(String type, double rating) {
    final tags = <String>[];
    if (rating >= 4.3) tags.add('Highly rated');
    if (type == 'restaurant') tags.add('Local cuisine');
    if (type == 'museum') tags.add('Cultural');
    if (type == 'park') tags.add('Family-friendly');
    tags.add('Wheelchair accessible');
    return tags;
  }
  
  static String _getDayName(int weekday) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[weekday - 1];
  }
  
  static String _formatDate(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
  
  static String _getDaySummary(int day, String destination, int activityCount) {
    final summaries = [
      'Relaxed exploration of $destination\'s highlights with $activityCount key experiences',
      'Cultural immersion day featuring local attractions and authentic dining',
      'Perfect mix of sightseeing and leisure activities in $destination',
      'Adventure-packed day discovering hidden gems and popular spots',
    ];
    return summaries[(day - 1) % summaries.length];
  }
  
  static String _getRecapDetails(List<ActivityDetail> activities) {
    final types = activities.map((a) => a.category).toSet();
    return 'mix of ${types.join(", ")} experiences';
  }
}