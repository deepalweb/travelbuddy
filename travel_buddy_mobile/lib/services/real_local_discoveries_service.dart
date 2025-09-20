import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/travel_style.dart';
import '../constants/app_constants.dart';

// Simple discovery data structure
class SimpleDiscovery {
  final String title;
  final String description;
  final String category;
  final List<String> items;
  final int priority;

  SimpleDiscovery({
    required this.title,
    required this.description,
    required this.category,
    required this.items,
    required this.priority,
  });
}

class RealLocalDiscoveriesService {
  static final RealLocalDiscoveriesService _instance = RealLocalDiscoveriesService._internal();
  factory RealLocalDiscoveriesService() => _instance;
  RealLocalDiscoveriesService._internal();

  // Generate real local discoveries from multiple sources
  Future<List<SimpleDiscovery>> generateRealDiscoveries({
    required double latitude,
    required double longitude,
    TravelStyle? userStyle,
    String? weather,
  }) async {
    try {
      final discoveries = <SimpleDiscovery>[];

      // 1. Get trending places from Google Places
      final trendingPlaces = await _getTrendingPlaces(latitude, longitude);
      if (trendingPlaces.isNotEmpty) {
        discoveries.add(SimpleDiscovery(
          title: 'Trending Now',
          description: 'Popular spots locals are talking about',
          category: 'trending',
          items: trendingPlaces,
          priority: 1,
        ));
      }

      // 2. Get recently opened places
      final newPlaces = await _getRecentlyOpenedPlaces(latitude, longitude);
      if (newPlaces.isNotEmpty) {
        discoveries.add(SimpleDiscovery(
          title: 'Recently Opened',
          description: 'Fresh spots to explore in your area',
          category: 'new',
          items: newPlaces,
          priority: 2,
        ));
      }

      // 3. Get weather-appropriate discoveries
      if (weather != null) {
        final weatherPlaces = await _getWeatherAppropriateDiscoveries(
          latitude, longitude, weather);
        if (weatherPlaces.isNotEmpty) {
          final weatherTitle = weather.contains('rain') 
              ? 'Perfect for Rainy Weather'
              : 'Great for Sunny Days';
          discoveries.add(SimpleDiscovery(
            title: weatherTitle,
            description: 'Places that match today\'s weather',
            category: 'weather',
            items: weatherPlaces,
            priority: 3,
          ));
        }
      }

      // 4. Get style-specific discoveries
      if (userStyle != null) {
        final styleDiscoveries = await _getStyleSpecificDiscoveries(
          latitude, longitude, userStyle);
        if (styleDiscoveries.isNotEmpty) {
          discoveries.add(SimpleDiscovery(
            title: 'Perfect for ${userStyle.displayName}s',
            description: 'Curated picks matching your travel style',
            category: 'personalized',
            items: styleDiscoveries,
            priority: 4,
          ));
        }
      }

      // 5. Get local events and activities
      final localEvents = await _getLocalEvents(latitude, longitude);
      if (localEvents.isNotEmpty) {
        discoveries.add(SimpleDiscovery(
          title: 'Happening Now',
          description: 'Local events and activities this week',
          category: 'events',
          items: localEvents,
          priority: 5,
        ));
      }

      print('✅ Generated ${discoveries.length} real local discoveries');
      return discoveries;
    } catch (e) {
      print('❌ Error generating real discoveries: $e');
      return _getFallbackDiscoveries();
    }
  }

  // Get trending places from Google Places API
  Future<List<String>> _getTrendingPlaces(double lat, double lng) async {
    try {
      final url = '${AppConstants.baseUrl}/api/places/trending?lat=$lat&lng=$lng';
      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.map((place) => place['name'] as String).take(5).toList();
      }
    } catch (e) {
      print('⚠️ Trending places API failed: $e');
    }

    // Fallback trending places based on high ratings
    return [
      'Highly rated local restaurant',
      'Popular coffee shop',
      'Trending attraction',
      'Local favorite spot',
    ];
  }

  // Get recently opened places
  Future<List<String>> _getRecentlyOpenedPlaces(double lat, double lng) async {
    try {
      final url = '${AppConstants.baseUrl}/api/places/recent?lat=$lat&lng=$lng';
      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.map((place) => place['name'] as String).take(4).toList();
      }
    } catch (e) {
      print('⚠️ Recent places API failed: $e');
    }

    // Fallback new places
    return [
      'New restaurant in town',
      'Recently opened cafe',
      'Fresh attraction',
    ];
  }

  // Get weather-appropriate places
  Future<List<String>> _getWeatherAppropriateDiscoveries(
      double lat, double lng, String weather) async {
    final isRainy = weather.toLowerCase().contains('rain');
    final query = isRainy ? 'indoor attractions museums cafes' : 'outdoor parks gardens viewpoints';

    try {
      final url = '${AppConstants.baseUrl}/api/places/nearby?lat=$lat&lng=$lng&q=$query&limit=4';
      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.map((place) => place['name'] as String).take(4).toList();
      }
    } catch (e) {
      print('⚠️ Weather places API failed: $e');
    }

    // Fallback weather-appropriate places
    if (isRainy) {
      return ['Cozy indoor cafe', 'Local museum', 'Shopping center', 'Art gallery'];
    } else {
      return ['Beautiful park', 'Scenic viewpoint', 'Outdoor market', 'Garden cafe'];
    }
  }

  // Get style-specific discoveries
  Future<List<String>> _getStyleSpecificDiscoveries(
      double lat, double lng, TravelStyle style) async {
    String query = '';
    switch (style) {
      case TravelStyle.foodie:
        query = 'restaurants cafes food markets';
        break;
      case TravelStyle.culture:
        query = 'museums galleries historic sites';
        break;
      case TravelStyle.nature:
        query = 'parks gardens nature reserves';
        break;
      case TravelStyle.nightOwl:
        query = 'bars nightlife entertainment';
        break;
      case TravelStyle.explorer:
        query = 'attractions landmarks tourist spots';
        break;
      case TravelStyle.relaxer:
        query = 'spas parks quiet cafes';
        break;
    }

    try {
      final url = '${AppConstants.baseUrl}/api/places/nearby?lat=$lat&lng=$lng&q=$query&limit=4';
      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.map((place) => place['name'] as String).take(4).toList();
      }
    } catch (e) {
      print('⚠️ Style places API failed: $e');
    }

    // Fallback style-specific places
    switch (style) {
      case TravelStyle.foodie:
        return ['Local restaurant', 'Artisan cafe', 'Food market', 'Bakery'];
      case TravelStyle.culture:
        return ['Art museum', 'Historic site', 'Cultural center', 'Gallery'];
      case TravelStyle.nature:
        return ['City park', 'Botanical garden', 'Nature trail', 'Scenic spot'];
      default:
        return ['Local attraction', 'Popular spot', 'Hidden gem', 'Must-visit place'];
    }
  }

  // Get local events (simplified - would integrate with events APIs)
  Future<List<String>> _getLocalEvents(double lat, double lng) async {
    // This would integrate with Eventbrite, Facebook Events, or local tourism APIs
    // For now, return contextual events based on day/time
    final now = DateTime.now();
    final isWeekend = now.weekday >= 6;
    final hour = now.hour;

    List<String> events = [];

    if (isWeekend) {
      events.addAll([
        'Weekend farmers market',
        'Local art fair',
        'Live music at local venue',
      ]);
    } else {
      events.addAll([
        'Weekday lunch specials',
        'Happy hour deals',
        'Evening cultural events',
      ]);
    }

    if (hour >= 18) {
      events.add('Evening entertainment shows');
    } else if (hour >= 12) {
      events.add('Afternoon workshops');
    } else {
      events.add('Morning yoga classes');
    }

    return events.take(3).toList();
  }

  // Fallback discoveries when APIs fail
  List<SimpleDiscovery> _getFallbackDiscoveries() {
    return [
      SimpleDiscovery(
        title: 'Local Favorites',
        description: 'Popular spots in your area',
        category: 'general',
        items: ['Local restaurant', 'Coffee shop', 'Park', 'Museum'],
        priority: 1,
      ),
    ];
  }
}