import '../models/place.dart';
import '../utils/place_ranker.dart';
import 'package:geolocator/geolocator.dart';

extension AppProviderHelpers on dynamic {
  Future<List<Place>> getNearbyNowPlaces(
    List<Place> allPlaces,
    double userLat,
    double userLng,
    String? weather,
  ) async {
    final now = DateTime.now();
    final hour = now.hour;
    final isRainy = weather?.toLowerCase().contains('rain') ?? false;

    return allPlaces.where((place) {
      // Filter: Open now
      if (place.isOpenNow != true) return false;

      // Filter: High rating
      if (place.rating < 4.0) return false;

      // Filter: Weather suitable
      final placeType = place.type.toLowerCase();
      if (isRainy && !placeType.contains('museum') && !placeType.contains('mall') && !placeType.contains('cinema')) {
        return false;
      }

      // Filter: Close distance (< 2km)
      final distance = Geolocator.distanceBetween(userLat, userLng, place.latitude ?? 0, place.longitude ?? 0) / 1000;
      if (distance > 2.0) return false;

      return true;
    }).take(10).toList();
  }

  Future<List<Place>> getPersonalizedPlaces(
    List<Place> allPlaces,
    Map<String, dynamic>? userInsights,
    String? userTravelStyle,
  ) async {
    if (allPlaces.isEmpty) return [];

    final topCategory = userInsights?['topCategory'] as String?;
    final favoriteTypes = <String>[];

    // Map travel style to place types
    if (userTravelStyle != null) {
      switch (userTravelStyle.toLowerCase()) {
        case 'foodie':
          favoriteTypes.addAll(['restaurant', 'cafe', 'food']);
          break;
        case 'culture':
          favoriteTypes.addAll(['museum', 'gallery', 'temple', 'church']);
          break;
        case 'nature':
          favoriteTypes.addAll(['park', 'garden', 'beach', 'nature']);
          break;
        case 'nightowl':
          favoriteTypes.addAll(['bar', 'nightclub', 'pub']);
          break;
      }
    }

    // Filter by user preferences
    final filtered = allPlaces.where((place) {
      final placeType = place.type.toLowerCase();
      
      // Match travel style
      if (favoriteTypes.any((type) => placeType.contains(type))) return true;
      
      // Match top category
      if (topCategory != null && placeType.contains(topCategory.toLowerCase())) return true;
      
      // High rated places
      if (place.rating >= 4.5) return true;
      
      return false;
    }).toList();

    return filtered.take(10).toList();
  }
}
