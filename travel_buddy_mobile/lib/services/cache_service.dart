import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/place_model.dart';
import '../config/environment.dart';

class CacheService {
  static final CacheService _instance = CacheService._internal();
  factory CacheService() => _instance;
  CacheService._internal();

  static const String _placesPrefix = 'places_';
  static const String _placePrefix = 'place_';
  static const String _timestampPrefix = 'timestamp_';

  // Cache search results
  Future<void> cachePlaces(String query, List<Place> places) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = _placesPrefix + query.toLowerCase().replaceAll(' ', '_');
      final timestampKey = _timestampPrefix + key;
      
      final placesJson = places.map((p) => p.toJson()).toList();
      await prefs.setString(key, json.encode(placesJson));
      await prefs.setInt(timestampKey, DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      print('Cache save error: $e');
    }
  }

  // Get cached search results
  Future<List<Place>> getCachedPlaces(String query) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = _placesPrefix + query.toLowerCase().replaceAll(' ', '_');
      final timestampKey = _timestampPrefix + key;
      
      // Check if cache exists and is not expired
      final timestamp = prefs.getInt(timestampKey);
      if (timestamp == null) return [];
      
      final cacheAge = DateTime.now().millisecondsSinceEpoch - timestamp;
      final maxAge = Environment.cacheExpiryHours * 60 * 60 * 1000;
      
      if (cacheAge > maxAge) {
        // Cache expired, remove it
        await prefs.remove(key);
        await prefs.remove(timestampKey);
        return [];
      }
      
      final cachedData = prefs.getString(key);
      if (cachedData == null) return [];
      
      final placesJson = json.decode(cachedData) as List;
      return placesJson.map((p) => Place.fromJson(p)).toList();
    } catch (e) {
      print('Cache read error: $e');
      return [];
    }
  }

  // Cache individual place details
  Future<void> cachePlace(Place place) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = _placePrefix + place.id;
      final timestampKey = _timestampPrefix + key;
      
      await prefs.setString(key, json.encode(place.toJson()));
      await prefs.setInt(timestampKey, DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      print('Place cache save error: $e');
    }
  }

  // Get cached place details
  Future<Place?> getCachedPlace(String placeId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = _placePrefix + placeId;
      final timestampKey = _timestampPrefix + key;
      
      // Check if cache exists and is not expired
      final timestamp = prefs.getInt(timestampKey);
      if (timestamp == null) return null;
      
      final cacheAge = DateTime.now().millisecondsSinceEpoch - timestamp;
      final maxAge = Environment.cacheExpiryHours * 60 * 60 * 1000;
      
      if (cacheAge > maxAge) {
        await prefs.remove(key);
        await prefs.remove(timestampKey);
        return null;
      }
      
      final cachedData = prefs.getString(key);
      if (cachedData == null) return null;
      
      return Place.fromJson(json.decode(cachedData));
    } catch (e) {
      print('Place cache read error: $e');
      return null;
    }
  }

  // Clear all cache
  Future<void> clearCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      for (final key in keys) {
        if (key.startsWith(_placesPrefix) || 
            key.startsWith(_placePrefix) || 
            key.startsWith(_timestampPrefix)) {
          await prefs.remove(key);
        }
      }
    } catch (e) {
      print('Cache clear error: $e');
    }
  }

  // Get cache statistics
  Future<Map<String, int>> getCacheStats() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      int searchCaches = 0;
      int placeCaches = 0;
      
      for (final key in keys) {
        if (key.startsWith(_placesPrefix)) searchCaches++;
        if (key.startsWith(_placePrefix)) placeCaches++;
      }
      
      return {
        'searchCaches': searchCaches,
        'placeCaches': placeCaches,
      };
    } catch (e) {
      return {'searchCaches': 0, 'placeCaches': 0};
    }
  }
}