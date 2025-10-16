import 'dart:math' as math;
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../models/place.dart';

class RoutePlanningService {
  /// Calculates distance between two points in meters
  static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
  }

  /// Plans optimal route starting from current location to farthest place
  /// Returns places arranged from nearest to farthest
  static Future<List<Place>> planOptimalRoute({
    required Position currentLocation,
    required List<Place> places,
  }) async {
    if (places.isEmpty) return [];

    // Resolve coordinates for places that don't have them
    final resolvedPlaces = await _resolveCoordinates(places);

    // Calculate distances and sort by nearest to farthest
    final placesWithDistance = resolvedPlaces.map((place) {
      final distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        place.latitude ?? 0.0,
        place.longitude ?? 0.0,
      );
      return {
        'place': place,
        'distance': distance,
        'distanceKm': (distance / 1000).toStringAsFixed(1),
      };
    }).toList();

    // Sort by distance (nearest first)
    placesWithDistance.sort((a, b) => 
      (a['distance'] as double).compareTo(b['distance'] as double));

    // Return sorted places with updated descriptions including distance
    return placesWithDistance.map((item) {
      final place = item['place'] as Place;
      final distanceKm = item['distanceKm'] as String;
      
      return Place(
        id: place.id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        rating: place.rating,
        type: place.type,
        photoUrl: place.photoUrl,
        description: '${place.description.split(' • ').first} • ${distanceKm}km away',
        localTip: place.localTip,
        handyPhrase: place.handyPhrase,
        phoneNumber: place.phoneNumber,
        website: place.website,
      );
    }).toList();
  }

  /// Generates route waypoints for Google Maps
  static List<Map<String, double>> generateRouteWaypoints({
    required Position currentLocation,
    required List<Place> sortedPlaces,
  }) {
    final waypoints = <Map<String, double>>[];
    
    // Add current location as starting point
    waypoints.add({
      'latitude': currentLocation.latitude,
      'longitude': currentLocation.longitude,
    });

    // Add all places in order
    for (final place in sortedPlaces) {
      if (place.latitude != null && place.longitude != null) {
        waypoints.add({
          'latitude': place.latitude!,
          'longitude': place.longitude!,
        });
      }
    }

    return waypoints;
  }

  /// Calculates total route distance
  static double calculateTotalRouteDistance({
    required Position currentLocation,
    required List<Place> sortedPlaces,
  }) {
    final placesWithCoords = sortedPlaces.where((p) => p.latitude != null && p.longitude != null).toList();
    if (placesWithCoords.isEmpty) return 0.0;

    double totalDistance = 0.0;
    double lastLat = currentLocation.latitude;
    double lastLon = currentLocation.longitude;

    for (final place in placesWithCoords) {
      totalDistance += calculateDistance(lastLat, lastLon, place.latitude!, place.longitude!);
      lastLat = place.latitude!;
      lastLon = place.longitude!;
    }

    return totalDistance;
  }

  /// Estimates total travel time (assuming average speed of 30 km/h)
  static Duration estimateTravelTime({
    required Position currentLocation,
    required List<Place> sortedPlaces,
  }) {
    final totalDistanceKm = calculateTotalRouteDistance(
      currentLocation: currentLocation,
      sortedPlaces: sortedPlaces,
    ) / 1000;

    // Assume average speed of 30 km/h (including stops)
    final hours = totalDistanceKm / 30;
    // Add 30 minutes per place for visit time
    final visitTime = sortedPlaces.length * 30;
    return Duration(minutes: (hours * 60).round() + visitTime);
  }

  /// Resolves coordinates for places that don't have them using geocoding
  static Future<List<Place>> _resolveCoordinates(List<Place> places) async {
    final resolvedPlaces = <Place>[];
    
    for (final place in places) {
      if (place.latitude != null && place.longitude != null) {
        resolvedPlaces.add(place);
      } else if (place.address.isNotEmpty) {
        try {
          final locations = await locationFromAddress(place.address);
          if (locations.isNotEmpty) {
            final location = locations.first;
            resolvedPlaces.add(Place(
              id: place.id,
              name: place.name,
              address: place.address,
              latitude: location.latitude,
              longitude: location.longitude,
              rating: place.rating,
              type: place.type,
              photoUrl: place.photoUrl,
              description: place.description,
              localTip: place.localTip,
              handyPhrase: place.handyPhrase,
              phoneNumber: place.phoneNumber,
              website: place.website,
            ));
          } else {
            resolvedPlaces.add(place);
          }
        } catch (e) {
          resolvedPlaces.add(place);
        }
      } else {
        resolvedPlaces.add(place);
      }
    }
    
    return resolvedPlaces;
  }
}