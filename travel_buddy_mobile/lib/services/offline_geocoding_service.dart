import 'dart:convert';
import 'dart:math';
import 'package:flutter/services.dart';

class OfflineGeocodingService {
  static final OfflineGeocodingService _instance = OfflineGeocodingService._internal();
  factory OfflineGeocodingService() => _instance;
  OfflineGeocodingService._internal();

  List<Map<String, dynamic>>? _cities;

  Future<void> initialize() async {
    try {
      final jsonString = await rootBundle.loadString('assets/offline_cities.json');
      final data = json.decode(jsonString);
      _cities = List<Map<String, dynamic>>.from(data['cities']);
      print('✅ Loaded ${_cities!.length} cities for offline geocoding');
    } catch (e) {
      print('❌ Failed to load offline cities: $e');
      _cities = [];
    }
  }

  String getLocationName(double lat, double lng) {
    if (_cities == null || _cities!.isEmpty) {
      return 'Current Location';
    }

    // Find nearest city within 50km
    double minDistance = double.infinity;
    Map<String, dynamic>? nearestCity;

    for (final city in _cities!) {
      final distance = _calculateDistance(
        lat, lng,
        city['lat'], city['lng'],
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    if (nearestCity != null && minDistance < 50) {
      return '${nearestCity['name']}, ${nearestCity['country']}';
    }

    // Fallback to country only if within 200km
    if (nearestCity != null && minDistance < 200) {
      return nearestCity['country'];
    }

    return 'Current Location';
  }

  double _calculateDistance(double lat1, double lng1, double lat2, double lng2) {
    const double earthRadius = 6371; // km
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
