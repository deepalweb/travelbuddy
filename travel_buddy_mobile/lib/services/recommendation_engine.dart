import '../models/place.dart';
import '../models/travel_style.dart';
import '../services/usage_tracking_service.dart';

class RecommendationEngine {
  static final RecommendationEngine _instance = RecommendationEngine._internal();
  factory RecommendationEngine() => _instance;
  RecommendationEngine._internal();

  final UsageTrackingService _usageTracking = UsageTrackingService();

  // Generate personalized place recommendations
  Future<List<Place>> getPersonalizedRecommendations({
    required List<Place> availablePlaces,
    TravelStyle? userStyle,
    String? currentWeather,
    int hour = 12,
  }) async {
    try {
      final userInsights = _usageTracking.getUserInsights();
      final preferences = _analyzeUserPreferences(userInsights);
      
      // Score each place based on multiple factors
      final scoredPlaces = availablePlaces.map((place) {
        final score = _calculatePlaceScore(
          place: place,
          preferences: preferences,
          userStyle: userStyle,
          weather: currentWeather,
          hour: hour,
        );
        return {'place': place, 'score': score};
      }).toList();

      // Sort by score and return top recommendations
      scoredPlaces.sort((a, b) => (b['score'] as double).compareTo(a['score'] as double));
      
      final recommendations = scoredPlaces
          .map((item) => item['place'] as Place)
          .take(10)
          .toList();
          
      print('🤖 Generated ${recommendations.length} personalized recommendations');
      return recommendations;
    } catch (e) {
      print('❌ Recommendation engine error: $e');
      return availablePlaces.take(10).toList();
    }
  }

  // Analyze user preferences from interaction history
  Map<String, double> _analyzeUserPreferences(Map<String, dynamic> insights) {
    final categoryPrefs = insights['categoryPreferences'] as Map<String, int>? ?? {};
    final placeTypePrefs = insights['placeTypePreferences'] as Map<String, int>? ?? {};
    final totalInteractions = insights['totalInteractions'] as int? ?? 1;

    Map<String, double> preferences = {};

    // Convert interaction counts to preference weights
    categoryPrefs.forEach((category, count) {
      preferences[category] = count / totalInteractions;
    });

    placeTypePrefs.forEach((type, count) {
      preferences[type] = count / totalInteractions;
    });

    return preferences;
  }

  // Calculate personalized score for a place
  double _calculatePlaceScore({
    required Place place,
    required Map<String, double> preferences,
    TravelStyle? userStyle,
    String? weather,
    required int hour,
  }) {
    double score = place.rating; // Base score from rating

    // Apply user preference weights
    final placeType = _normalizeType(place.type);
    if (preferences.containsKey(placeType)) {
      score *= (1 + preferences[placeType]! * 2); // Boost preferred types
    }

    // Apply travel style weights
    if (userStyle != null) {
      final styleWeights = userStyle.placeWeights;
      for (final entry in styleWeights.entries) {
        if (place.type.toLowerCase().contains(entry.key)) {
          score *= entry.value;
          break;
        }
      }
    }

    // Apply time-based scoring
    score *= _getTimeScore(place.type, hour);

    // Apply weather-based scoring
    if (weather != null) {
      score *= _getWeatherScore(place.type, weather);
    }

    // Boost highly rated places
    if (place.rating >= 4.5) score *= 1.2;
    if (place.rating >= 4.0) score *= 1.1;

    return score;
  }

  double _getTimeScore(String placeType, int hour) {
    final type = placeType.toLowerCase();
    
    if (hour < 10) { // Early morning
      if (type.contains('cafe') || type.contains('breakfast')) return 1.5;
      if (type.contains('museum')) return 1.3; // Less crowded
      if (type.contains('bar') || type.contains('nightlife')) return 0.3;
    } else if (hour < 14) { // Lunch time
      if (type.contains('restaurant')) return 1.4;
      if (type.contains('attraction')) return 1.2;
    } else if (hour < 18) { // Afternoon
      if (type.contains('attraction') || type.contains('museum')) return 1.3;
      if (type.contains('shopping')) return 1.2;
    } else { // Evening
      if (type.contains('restaurant')) return 1.4;
      if (type.contains('bar') || type.contains('nightlife')) return 1.5;
      if (type.contains('museum')) return 0.8; // Many close early
    }
    
    return 1.0; // Neutral score
  }

  double _getWeatherScore(String placeType, String weather) {
    final type = placeType.toLowerCase();
    final isRainy = weather.toLowerCase().contains('rain');
    final isSunny = weather.toLowerCase().contains('sunny') || weather.toLowerCase().contains('clear');

    if (isRainy) {
      // Boost indoor places when raining
      if (type.contains('museum') || type.contains('mall') || type.contains('cafe')) return 1.3;
      if (type.contains('park') || type.contains('outdoor')) return 0.6;
    } else if (isSunny) {
      // Boost outdoor places when sunny
      if (type.contains('park') || type.contains('outdoor') || type.contains('garden')) return 1.4;
      if (type.contains('rooftop') || type.contains('terrace')) return 1.3;
    }

    return 1.0; // Neutral score
  }

  String _normalizeType(String type) {
    final normalized = type.toLowerCase();
    if (normalized.contains('restaurant') || normalized.contains('food')) return 'restaurants';
    if (normalized.contains('museum') || normalized.contains('gallery')) return 'culture';
    if (normalized.contains('park') || normalized.contains('nature')) return 'nature';
    if (normalized.contains('bar') || normalized.contains('nightlife')) return 'nightlife';
    if (normalized.contains('cafe') || normalized.contains('coffee')) return 'cafes';
    if (normalized.contains('shop') || normalized.contains('mall')) return 'shopping';
    return 'attractions';
  }

  // Generate contextual suggestions for home screen
  Future<List<String>> generateContextualSuggestions({
    required List<Place> nearbyPlaces,
    TravelStyle? userStyle,
    String? weather,
    required int hour,
  }) async {
    final suggestions = <String>[];
    final userInsights = _usageTracking.getUserInsights();
    final topCategory = userInsights['topCategory'] as String?;
    final isActive = userInsights['isActive'] as bool? ?? false;

    // Personalized suggestions based on user behavior
    if (isActive && topCategory != null) {
      suggestions.add('Based on your activity, here are more $topCategory you might love');
    }

    // Find matching places for user style
    if (userStyle != null && nearbyPlaces.isNotEmpty) {
      final matchingPlaces = nearbyPlaces.where((place) => 
        _getPlaceStyleMatch(place, userStyle)).toList();
      
      if (matchingPlaces.isNotEmpty) {
        final topMatch = matchingPlaces.first;
        suggestions.add('${topMatch.name} is perfect for ${userStyle.displayName}s like you!');
      }
    }

    // Weather + time contextual suggestions
    if (weather != null) {
      if (weather.contains('sunny') && hour < 18) {
        suggestions.add('Beautiful weather! Perfect time for outdoor exploration');
      } else if (weather.contains('rain')) {
        suggestions.add('Rainy day calls for cozy indoor experiences');
      }
    }

    return suggestions.take(2).toList();
  }

  bool _getPlaceStyleMatch(Place place, TravelStyle style) {
    final type = place.type.toLowerCase();
    final weights = style.placeWeights;
    
    for (final key in weights.keys) {
      if (type.contains(key) && weights[key]! > 1.0) {
        return true;
      }
    }
    return false;
  }
}