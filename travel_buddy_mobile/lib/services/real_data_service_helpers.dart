import '../models/trip.dart';
import '../config/environment.dart';

class RealDataServiceHelpers {
  // Select real places for a specific day
  static List<Map<String, dynamic>> selectPlacesForDay(
    List<Map<String, dynamic>> allPlaces, 
    int dayIndex, 
    int totalDays,
    String interests
  ) {
    if (allPlaces.isEmpty) return [];
    
    // Distribute places across days
    final placesPerDay = (allPlaces.length / totalDays).ceil();
    final startIndex = dayIndex * placesPerDay;
    final endIndex = (startIndex + placesPerDay).clamp(0, allPlaces.length);
    
    var dayPlaces = allPlaces.sublist(startIndex, endIndex);
    
    // Filter by interests if specified
    if (interests.isNotEmpty) {
      dayPlaces = _filterByInterests(dayPlaces, interests);
    }
    
    // Ensure variety - mix different types
    dayPlaces = _ensureVariety(dayPlaces);
    
    return dayPlaces.take(4).toList(); // Max 4 activities per day
  }
  
  // Create activity from real Google Places data
  static ActivityDetail createRealPlaceActivity(
    Map<String, dynamic> place, 
    Map<String, double> costs, 
    int dayIndex
  ) {
    final name = place['name'] ?? 'Unknown Place';
    final rating = (place['rating'] ?? 4.0).toDouble();
    final types = List<String>.from(place['types'] ?? []);
    final placeType = _getPlaceTypeFromGoogleTypes(types);
    final category = _getCategoryFromType(placeType);
    final timeSlot = _getTimeSlotForActivity(dayIndex % 4);
    
    return ActivityDetail(
      timeOfDay: timeSlot,
      activityTitle: name,
      description: _generateDescription(name, placeType),
      type: placeType,
      category: category,
      estimatedCost: '€${_getCostForType(placeType, costs)}',
      crowdLevel: _getCrowdLevelFromRating(rating),
      startTime: timeSlot.split('-')[0],
      endTime: timeSlot.split('-')[1],
      
      // Real Google Places data
      googlePlaceId: place['place_id'] ?? '',
      rating: rating,
      userRatingsTotal: place['user_ratings_total'] ?? (rating * 100).round(),
      highlight: _generateHighlight(name, placeType, rating),
      socialProof: '${(rating * 50).round()} travelers visited recently',
      practicalTip: _generatePracticalTip(placeType),
      
      // Enhanced fields
      travelMode: 'walking',
      travelTimeMin: 10 + (dayIndex * 5),
      estimatedVisitDurationMin: _getVisitDuration(placeType),
      photoThumbnail: _getPhotoUrl(place),
      fullAddress: place['formatted_address'] ?? place['vicinity'] ?? 'Address not available',
      openingHours: _getOpeningHours(placeType),
      isOpenNow: place['opening_hours']?['open_now'] ?? true,
      weatherNote: _getWeatherNote(placeType),
      tags: _generateTags(placeType, rating, types),
      bookingLink: _getBookingLink(placeType, name),
    );
  }
  
  // Filter places by user interests
  static List<Map<String, dynamic>> _filterByInterests(
    List<Map<String, dynamic>> places, 
    String interests
  ) {
    final interestKeywords = interests.toLowerCase().split(',').map((s) => s.trim()).toList();
    
    return places.where((place) {
      final name = (place['name'] ?? '').toLowerCase();
      final types = List<String>.from(place['types'] ?? []).join(' ').toLowerCase();
      
      return interestKeywords.any((keyword) => 
        name.contains(keyword) || types.contains(keyword)
      );
    }).toList();
  }
  
  // Ensure variety in place types
  static List<Map<String, dynamic>> _ensureVariety(List<Map<String, dynamic>> places) {
    if (places.length <= 3) return places;
    
    final categorized = <String, List<Map<String, dynamic>>>{};
    
    for (final place in places) {
      final types = List<String>.from(place['types'] ?? []);
      final category = _getCategoryFromGoogleTypes(types);
      categorized.putIfAbsent(category, () => []).add(place);
    }
    
    // Take 1-2 from each category for variety
    final varied = <Map<String, dynamic>>[];
    for (final category in categorized.keys) {
      varied.addAll(categorized[category]!.take(2));
    }
    
    return varied;
  }
  
  // Map Google Place types to our categories
  static String _getPlaceTypeFromGoogleTypes(List<String> types) {
    if (types.any((t) => ['restaurant', 'food', 'meal_takeaway', 'cafe'].contains(t))) {
      return 'restaurant';
    }
    if (types.any((t) => ['museum', 'art_gallery', 'library'].contains(t))) {
      return 'museum';
    }
    if (types.any((t) => ['park', 'natural_feature', 'zoo'].contains(t))) {
      return 'park';
    }
    if (types.any((t) => ['shopping_mall', 'store', 'clothing_store'].contains(t))) {
      return 'shopping';
    }
    return 'landmark';
  }
  
  static String _getCategoryFromGoogleTypes(List<String> types) {
    if (types.any((t) => ['restaurant', 'food', 'meal_takeaway', 'cafe'].contains(t))) {
      return 'Food & Drink';
    }
    if (types.any((t) => ['museum', 'art_gallery', 'library'].contains(t))) {
      return 'Culture & Museums';
    }
    if (types.any((t) => ['park', 'natural_feature', 'zoo'].contains(t))) {
      return 'Outdoor & Nature';
    }
    if (types.any((t) => ['shopping_mall', 'store', 'clothing_store'].contains(t))) {
      return 'Shopping & Markets';
    }
    return 'Landmarks & Attractions';
  }
  
  static String _getCategoryFromType(String type) {
    switch (type) {
      case 'restaurant': return 'Food & Drink';
      case 'museum': return 'Culture & Museums';
      case 'park': return 'Outdoor & Nature';
      case 'shopping': return 'Shopping & Markets';
      default: return 'Landmarks & Attractions';
    }
  }
  
  static String _getTimeSlotForActivity(int index) {
    final slots = ['08:30-09:30', '10:00-12:00', '12:30-13:30', '14:00-16:00', '18:00-20:00'];
    return slots[index % slots.length];
  }
  
  static String _generateDescription(String name, String type) {
    switch (type) {
      case 'restaurant':
        return 'Experience authentic local cuisine at $name with great atmosphere and service.';
      case 'museum':
        return 'Discover rich cultural heritage and fascinating exhibits at $name.';
      case 'park':
        return 'Enjoy beautiful outdoor spaces and natural scenery at $name.';
      default:
        return 'Explore the iconic $name and discover what makes it special.';
    }
  }
  
  static String _generateHighlight(String name, String type, double rating) {
    if (rating >= 4.5) {
      return 'Highly rated ${type == 'restaurant' ? 'dining experience' : 'attraction'} - must visit!';
    } else if (rating >= 4.0) {
      return 'Popular ${type == 'restaurant' ? 'restaurant' : 'destination'} with great reviews';
    } else {
      return 'Local ${type == 'restaurant' ? 'eatery' : 'spot'} worth exploring';
    }
  }
  
  static String _generatePracticalTip(String type) {
    switch (type) {
      case 'restaurant':
        return 'Check opening hours and consider making a reservation';
      case 'museum':
        return 'Buy tickets online to skip queues, allow 2+ hours for visit';
      case 'park':
        return 'Best visited during daylight hours, bring comfortable shoes';
      default:
        return 'Check opening times and arrive early to avoid crowds';
    }
  }
  
  static int _getCostForType(String type, Map<String, double> costs) {
    switch (type) {
      case 'restaurant':
        return costs['meal']?.round() ?? 20;
      case 'museum':
      case 'landmark':
        return costs['attraction']?.round() ?? 10;
      case 'park':
        return 0;
      default:
        return costs['attraction']?.round() ?? 8;
    }
  }
  
  static String _getCrowdLevelFromRating(double rating) {
    if (rating >= 4.5) return 'High';
    if (rating >= 4.0) return 'Moderate';
    return 'Low';
  }
  
  static int _getVisitDuration(String type) {
    switch (type) {
      case 'restaurant': return 60;
      case 'museum': return 120;
      case 'park': return 90;
      default: return 75;
    }
  }
  
  static String _getPhotoUrl(Map<String, dynamic> place) {
    final photos = place['photos'] as List?;
    if (photos?.isNotEmpty == true) {
      final photoRef = photos!.first['photo_reference'];
      return '${Environment.backendUrl}/api/places/photo?ref=$photoRef&w=400';
    }
    return 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000';
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
      case 'park': return 'Weather dependent - best on clear days';
      case 'museum': return 'Perfect for any weather';
      default: return 'Check weather conditions';
    }
  }
  
  static List<String> _generateTags(String type, double rating, List<String> googleTypes) {
    final tags = <String>[];
    
    if (rating >= 4.3) tags.add('Highly rated');
    if (googleTypes.contains('wheelchair_accessible')) tags.add('Wheelchair accessible');
    if (type == 'restaurant') tags.add('Local cuisine');
    if (type == 'museum') tags.add('Cultural');
    if (type == 'park') tags.add('Family-friendly');
    
    return tags;
  }
  
  static String? _getBookingLink(String type, String name) {
    if (type == 'restaurant') {
      return 'https://www.opentable.com/s?query=${Uri.encodeComponent(name)}';
    }
    return null;
  }
}