import 'dart:math';
import 'package:geolocator/geolocator.dart';
import '../models/place.dart';

class PlaceRanker {
  static double calculatePlaceScore(
    Place place,
    double userLat,
    double userLng, {
    String? weather,
    bool considerOpeningHours = true,
  }) {
    double score = 0;

    // Rating (50%)
    score += (place.rating / 5.0) * 50;

    // Distance (25%)
    final distanceKm = _calculateDistance(userLat, userLng, place.latitude ?? 0, place.longitude ?? 0);
    final distanceScore = max(0, (1 - distanceKm / 10));
    score += distanceScore * 25;

    // Weather suitability (15%)
    if (weather != null) {
      final isRainy = weather.toLowerCase().contains('rain');
      final isSunny = weather.toLowerCase().contains('sunny') || weather.toLowerCase().contains('clear');
      final placeType = place.type.toLowerCase();

      if (isRainy && (placeType.contains('museum') || placeType.contains('mall') || placeType.contains('cinema'))) {
        score += 15;
      } else if (isSunny && (placeType.contains('park') || placeType.contains('beach') || placeType.contains('outdoor'))) {
        score += 15;
      }
    }

    // Opening hours (10%)
    if (considerOpeningHours && place.isOpenNow == true) {
      score += 10;
    }

    return score;
  }

  static List<Place> rankPlaces(
    List<Place> places,
    double userLat,
    double userLng, {
    String? weather,
    bool considerOpeningHours = true,
  }) {
    final rankedPlaces = places.map((place) {
      return {
        'place': place,
        'score': calculatePlaceScore(place, userLat, userLng, weather: weather, considerOpeningHours: considerOpeningHours),
      };
    }).toList();

    rankedPlaces.sort((a, b) => (b['score'] as double).compareTo(a['score'] as double));

    return rankedPlaces.map((item) => item['place'] as Place).toList();
  }

  static double _calculateDistance(double lat1, double lng1, double lat2, double lng2) {
    return Geolocator.distanceBetween(lat1, lng1, lat2, lng2) / 1000; // km
  }
}
