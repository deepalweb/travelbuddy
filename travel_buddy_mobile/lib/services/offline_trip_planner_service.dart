import 'dart:math';
import '../models/place.dart';
import '../models/trip.dart';
import '../models/travel_style.dart';

class OfflineTripPlannerService {
  static final OfflineTripPlannerService _instance = OfflineTripPlannerService._internal();
  factory OfflineTripPlannerService() => _instance;
  OfflineTripPlannerService._internal();

  OneDayItinerary generateOfflineItinerary({
    required List<Place> availablePlaces,
    required String destination,
    TravelStyle? travelStyle,
    double? userLat,
    double? userLng,
  }) {
    // Score and sort places
    final scoredPlaces = _scorePlaces(availablePlaces, travelStyle, userLat, userLng);
    
    // Select 5-7 places for the day
    final selectedPlaces = scoredPlaces.take(min(7, scoredPlaces.length)).toList();
    
    // Generate activities with time slots
    final activities = _generateActivities(selectedPlaces);
    
    return OneDayItinerary(
      id: 'offline_${DateTime.now().millisecondsSinceEpoch}',
      title: 'Day Trip to $destination',
      introduction: 'Offline itinerary based on nearby places and your preferences.',
      dailyPlan: activities,
      conclusion: 'Enjoy your trip! This plan was created offline.',
    );
  }

  List<Place> _scorePlaces(
    List<Place> places,
    TravelStyle? style,
    double? userLat,
    double? userLng,
  ) {
    final scored = places.map((place) {
      double score = place.rating * 10; // Base score from rating
      
      // Distance bonus (closer = better)
      if (userLat != null && userLng != null) {
        final distance = _calculateDistance(userLat, userLng, place.latitude, place.longitude);
        if (distance < 5) score += 20;
        else if (distance < 10) score += 10;
        else if (distance < 20) score += 5;
      }
      
      // Travel style bonus
      if (style != null) {
        final type = place.type.toLowerCase();
        final weights = style.placeWeights;
        
        for (final entry in weights.entries) {
          if (type.contains(entry.key)) {
            score *= entry.value;
            break;
          }
        }
      }
      
      return {'place': place, 'score': score};
    }).toList();
    
    scored.sort((a, b) => (b['score'] as double).compareTo(a['score'] as double));
    return scored.map((item) => item['place'] as Place).toList();
  }

  List<ActivityDetail> _generateActivities(List<Place> places) {
    final activities = <ActivityDetail>[];
    final startHour = 9; // 9 AM start
    
    for (int i = 0; i < places.length; i++) {
      final place = places[i];
      final hour = startHour + (i * 2); // 2 hours per activity
      
      activities.add(ActivityDetail(
        timeOfDay: _getTimeOfDay(hour),
        activityTitle: place.name,
        description: place.description.isNotEmpty 
            ? place.description 
            : 'Visit ${place.name}',
        estimatedDuration: '1-2 hours',
        location: place.name,
        notes: 'Rating: ${place.rating}/5',
        icon: _getIconForType(place.type),
        category: place.type,
        startTime: '${hour.toString().padLeft(2, '0')}:00',
        endTime: '${(hour + 2).toString().padLeft(2, '0')}:00',
        duration: 120,
        place: place.name,
        type: place.type,
        estimatedCost: 0,
        rating: place.rating,
        isVisited: false,
      ));
    }
    
    return activities;
  }

  String _getTimeOfDay(int hour) {
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  }

  String _getIconForType(String type) {
    final t = type.toLowerCase();
    if (t.contains('restaurant') || t.contains('food')) return '🍽️';
    if (t.contains('museum') || t.contains('gallery')) return '🏛️';
    if (t.contains('park') || t.contains('garden')) return '🌳';
    if (t.contains('beach')) return '🏖️';
    if (t.contains('temple') || t.contains('church')) return '⛪';
    if (t.contains('market') || t.contains('shop')) return '🛍️';
    return '📍';
  }

  double _calculateDistance(double lat1, double lng1, double lat2, double lng2) {
    const double earthRadius = 6371;
    final double dLat = _degreesToRadians(lat2 - lat1);
    final double dLng = _degreesToRadians(lng2 - lng1);
    
    final double a = 
        sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(lat1)) * cos(_degreesToRadians(lat2)) *
        sin(dLng / 2) * sin(dLng / 2);
    
    final double c = 2 * asin(sqrt(a));
    return earthRadius * c;
  }

  double _degreesToRadians(double degrees) {
    return degrees * (pi / 180);
  }
}
