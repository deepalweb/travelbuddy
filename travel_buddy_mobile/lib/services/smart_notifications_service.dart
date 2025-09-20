import '../services/notification_service.dart';
import '../services/weather_service.dart';
import '../models/place.dart';
import '../models/travel_style.dart';

class SmartNotificationsService {
  static final SmartNotificationsService _instance = SmartNotificationsService._internal();
  factory SmartNotificationsService() => _instance;
  SmartNotificationsService._internal();

  final NotificationService _notificationService = NotificationService();
  final WeatherService _weatherService = WeatherService();

  // Send weather-based recommendations
  Future<void> sendWeatherBasedNotification({
    required double latitude,
    required double longitude,
    TravelStyle? userStyle,
  }) async {
    try {
      final weather = await _weatherService.getCurrentWeather(
        latitude: latitude,
        longitude: longitude,
      );

      String title = '';
      String body = '';

      final condition = weather.condition.toLowerCase();
      final hour = DateTime.now().hour;

      if (condition.contains('sunny') || condition.contains('clear')) {
        if (hour >= 18) {
          title = '🌅 Perfect Evening Weather!';
          body = 'It\'s sunny outside - great for outdoor dining and rooftop bars!';
        } else if (hour >= 12) {
          title = '☀️ Beautiful Afternoon!';
          body = 'Perfect weather for exploring outdoor attractions and parks!';
        } else {
          title = '🌤️ Lovely Morning!';
          body = 'Great weather for a morning walk and outdoor cafes!';
        }
      } else if (condition.contains('rain')) {
        title = '🌧️ Rainy Day Activities';
        body = 'Perfect weather for museums, indoor cafes, and shopping!';
      } else if (condition.contains('cloud')) {
        title = '⛅ Great Day for Exploring';
        body = 'Perfect weather for photography and city walks!';
      }

      // Personalize based on travel style
      if (userStyle != null) {
        body = _personalizeNotification(body, userStyle, condition);
      }

      if (title.isNotEmpty && body.isNotEmpty) {
        await _notificationService.showLocalNotification(title, body);
        print('📱 Sent weather notification: $title');
      }
    } catch (e) {
      print('❌ Failed to send weather notification: $e');
    }
  }

  // Send nearby place recommendations
  Future<void> sendNearbyPlaceNotification({
    required List<Place> nearbyPlaces,
    TravelStyle? userStyle,
  }) async {
    if (nearbyPlaces.isEmpty) return;

    try {
      final topPlace = nearbyPlaces.first;
      final hour = DateTime.now().hour;

      String title = '';
      String body = '';

      if (hour >= 18) {
        title = '🍽️ Dinner Time!';
        body = 'Check out ${topPlace.name} - highly rated nearby restaurant!';
      } else if (hour >= 12) {
        title = '🗺️ Explore Nearby';
        body = '${topPlace.name} is just ${_extractDistance(topPlace)} away!';
      } else {
        title = '☕ Morning Discovery';
        body = 'Start your day at ${topPlace.name} - perfect morning spot!';
      }

      // Filter by travel style
      if (userStyle != null) {
        final stylePlace = _findPlaceForStyle(nearbyPlaces, userStyle);
        if (stylePlace != null) {
          title = '${userStyle.emoji} Perfect for ${userStyle.displayName}s!';
          body = '${stylePlace.name} matches your travel style perfectly!';
        }
      }

      await _notificationService.showLocalNotification(title, body);
      print('📱 Sent nearby place notification: $title');
    } catch (e) {
      print('❌ Failed to send nearby notification: $e');
    }
  }

  // Send time-based suggestions
  Future<void> sendTimeBasedSuggestion({
    TravelStyle? userStyle,
    String? currentLocation,
  }) async {
    try {
      final hour = DateTime.now().hour;
      final isWeekend = DateTime.now().weekday >= 6;

      String title = '';
      String body = '';

      if (hour == 9 && !isWeekend) {
        title = '☕ Good Morning!';
        body = 'Perfect time to find a great coffee shop and start your day!';
      } else if (hour == 12) {
        title = '🍽️ Lunch Time!';
        body = 'Discover amazing local restaurants for your lunch break!';
      } else if (hour == 18 && isWeekend) {
        title = '🌆 Weekend Evening!';
        body = 'Time to explore nightlife and evening entertainment!';
      } else if (hour == 10 && isWeekend) {
        title = '🗺️ Weekend Adventure!';
        body = 'Perfect time to explore attractions and outdoor activities!';
      }

      // Personalize for travel style
      if (userStyle != null && title.isNotEmpty) {
        body = _personalizeForStyle(body, userStyle);
      }

      if (title.isNotEmpty && body.isNotEmpty) {
        await _notificationService.showLocalNotification(title, body);
        print('📱 Sent time-based notification: $title');
      }
    } catch (e) {
      print('❌ Failed to send time-based notification: $e');
    }
  }

  String _personalizeNotification(String body, TravelStyle style, String weather) {
    switch (style) {
      case TravelStyle.foodie:
        if (weather.contains('sunny')) {
          return 'Perfect weather for outdoor dining and food markets!';
        } else if (weather.contains('rain')) {
          return 'Great weather for cozy restaurants and indoor food halls!';
        }
        break;
      case TravelStyle.nature:
        if (weather.contains('sunny')) {
          return 'Beautiful weather for parks, gardens, and nature walks!';
        } else if (weather.contains('rain')) {
          return 'Perfect for indoor gardens and conservatories!';
        }
        break;
      case TravelStyle.culture:
        return 'Great weather for museums, galleries, and cultural sites!';
      case TravelStyle.nightOwl:
        return 'Perfect evening weather for bars and nightlife!';
      default:
        break;
    }
    return body;
  }

  String _personalizeForStyle(String body, TravelStyle style) {
    switch (style) {
      case TravelStyle.foodie:
        return body.replaceAll('explore', 'discover amazing food spots and');
      case TravelStyle.culture:
        return body.replaceAll('explore', 'visit museums and cultural sites');
      case TravelStyle.nature:
        return body.replaceAll('explore', 'enjoy parks and outdoor spaces');
      case TravelStyle.nightOwl:
        return body.replaceAll('explore', 'check out nightlife and entertainment');
      default:
        return body;
    }
  }

  Place? _findPlaceForStyle(List<Place> places, TravelStyle style) {
    for (final place in places) {
      final type = place.type.toLowerCase();
      switch (style) {
        case TravelStyle.foodie:
          if (type.contains('restaurant') || type.contains('cafe')) return place;
          break;
        case TravelStyle.culture:
          if (type.contains('museum') || type.contains('gallery')) return place;
          break;
        case TravelStyle.nature:
          if (type.contains('park') || type.contains('nature')) return place;
          break;
        case TravelStyle.nightOwl:
          if (type.contains('bar') || type.contains('nightlife')) return place;
          break;
        default:
          break;
      }
    }
    return null;
  }

  String _extractDistance(Place place) {
    if (place.description.contains('km away')) {
      return place.description.split('•').last.trim();
    }
    return 'nearby';
  }
}