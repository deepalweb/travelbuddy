
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/travel_companion.dart';
import '../../services/travel_companion_service.dart';
import '../../services/weather_service.dart';
import '../../services/location_service.dart';
import '../../services/backend_connectivity_service.dart';

class HomeViewModel extends ChangeNotifier {
  String _currentTime = '';
  String get currentTime => _currentTime;

  String _currentLocationName = 'Getting location...';
  String get currentLocationName => _currentLocationName;

  List<String> _selectedActionKeys = ['explore', 'plan', 'nearby', 'safety'];
  List<String> get selectedActionKeys => _selectedActionKeys;

  final Set<String> _expandedSections = {};
  Set<String> get expandedSections => _expandedSections;

  final TravelCompanionService _companionService = TravelCompanionService();
  TravelCompanionService get companionService => _companionService;

  TravelMood? _selectedMood;
  TravelMood? get selectedMood => _selectedMood;

  String? _spinResult;
  String? get spinResult => _spinResult;

  List<Map<String, dynamic>>? _realHotspots;
  List<Map<String, dynamic>>? get realHotspots => _realHotspots;

  List<Map<String, String>>? _realPlanner;
  List<Map<String, String>>? get realPlanner => _realPlanner;

  String? _realMoodSuggestion;
  String? get realMoodSuggestion => _realMoodSuggestion;

  List<Map<String, dynamic>>? _nearbyEvents;
  List<Map<String, dynamic>>? get nearbyEvents => _nearbyEvents;

  Map<String, dynamic>? _weatherData;
  Map<String, dynamic>? get weatherData => _weatherData;

  Map<String, dynamic>? _userStats;
  Map<String, dynamic>? get userStats => _userStats;

  bool _isLoadingRealData = false;
  bool get isLoadingRealData => _isLoadingRealData;

  HomeViewModel() {
    _updateTime();
    Timer.periodic(const Duration(seconds: 1), (timer) {
      _updateTime();
    });
    _loadRealData();
  }

  void _updateTime() {
    final now = DateTime.now();
    print('Current time: $now');
    _currentTime = DateFormat('h:mm a').format(now);
    notifyListeners();
  }

  String getTimeBasedGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return '☀️ Good Morning,';
    if (hour < 17) return '🌤️ Good Afternoon,';
    if (hour < 21) return '🌆 Good Evening,';
    return '🌙 Good Night,';
  }

  LinearGradient getTimeBasedGradient() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 8) {
      // Sunrise
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFFF9A8B), Color(0xFFFECFEF), Color(0xFFFECFEF)],
      );
    } else if (hour >= 8 && hour < 17) {
      // Day
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF4FC3F7), Color(0xFF29B6F6), Color(0xFF03A9F4)],
      );
    } else if (hour >= 17 && hour < 20) {
      // Sunset
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFFFF7043), Color(0xFFFF5722), Color(0xFFE64A19)],
      );
    } else {
      // Night
      return const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF1A237E), Color(0xFF283593), Color(0xFF3949AB)],
      );
    }
  }

  String getSmartSuggestionIcon() {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 8) return '🌅';
    if (hour >= 8 && hour < 12) return '☕';
    if (hour >= 12 && hour < 17) return '🏛️';
    if (hour >= 17 && hour < 20) return '🌆';
    return '🌙';
  }

  String getSmartSuggestion() {
    if (_realPlanner != null && _realPlanner!.isNotEmpty) {
      final suggestion = _realPlanner!.first;
      return '${suggestion['title']} - ${suggestion['subtitle']}';
    }
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 8) return 'Perfect time for sunrise photography';
    if (hour >= 8 && hour < 12) return 'Great morning for café exploration';
    if (hour >= 12 && hour < 17) return 'Ideal time for sightseeing';
    if (hour >= 17 && hour < 20) return 'Golden hour for scenic views';
    return 'Perfect evening for local experiences';
  }

  void _loadRealData() async {
    _isLoadingRealData = true;
    notifyListeners();

    // Simulate network delay
    await Future.delayed(const Duration(seconds: 2));

    _realHotspots = [
      {'emoji': '🔥', 'name': 'Local Market', 'tip': 'Bustling with local crafts and food', 'visitors': '1.2k'},
      {'emoji': '🏞️', 'name': 'Hidden Waterfall', 'tip': 'A serene spot for a morning hike', 'visitors': '300+'},
    ];

    _realPlanner = [
      {'emoji': '☕', 'title': 'Morning Coffee', 'subtitle': 'at The Daily Grind', 'duration': '1h'},
      {'emoji': '🚶', 'title': 'City Walk', 'subtitle': 'through the historic district', 'duration': '2h'},
    ];

    _realMoodSuggestion = 'Try the new art exhibition at the city gallery.';

    _nearbyEvents = [
      {'name': 'Live Music Night', 'location': 'The Jazz Bar', 'time': '8 PM'},
      {'name': 'Food Festival', 'location': 'Central Park', 'time': 'All Day'},
    ];

    // Load real location and weather data
    try {
      final locationService = LocationService();
      final position = await locationService.getCurrentLocation();
      
      if (position != null) {
        _currentLocationName = 'Lat: ${position.latitude.toStringAsFixed(2)}, Lng: ${position.longitude.toStringAsFixed(2)}';
        
        final weatherService = WeatherService();
        final weatherInfo = await weatherService.getCurrentWeather(
          latitude: position.latitude,
          longitude: position.longitude,
        );
        _weatherData = {
          'temp': '${weatherInfo.temperature.round()}°C',
          'condition': weatherInfo.condition,
          'emoji': weatherInfo.emoji,
          'description': weatherInfo.description,
        };
        print('✅ Weather loaded: ${weatherInfo.temperature}°C, ${weatherInfo.condition}');
        print('🌤️ Weather source: ${weatherInfo.description.contains('mock') ? 'MOCK' : 'REAL'}');
        
        // Load real user stats from backend
        await _loadUserStats();
      } else {
        throw Exception('Location not available');
      }
    } catch (e) {
      print('Location/Weather loading failed: $e');
      _currentLocationName = 'Location unavailable';
      _weatherData = {'temp': 'Weather unavailable', 'condition': 'Unknown'};
      _userStats = {'trips': 0, 'places': 0, 'badges': 0};
    }

    _isLoadingRealData = false;
    notifyListeners();
  }

  void onMoodSelected(TravelMood mood) {
    _selectedMood = mood;
    notifyListeners();
  }

  void toggleSectionExpansion(String sectionTitle) {
    if (_expandedSections.contains(sectionTitle)) {
      _expandedSections.remove(sectionTitle);
    } else {
      _expandedSections.add(sectionTitle);
    }
    notifyListeners();
  }

  bool isExpanded(String sectionTitle) {
    return _expandedSections.contains(sectionTitle);
  }

  void setSelectedActionKeys(List<String> keys) {
    _selectedActionKeys = keys;
    notifyListeners();
  }
  
  String _getWeatherEmoji(String condition) {
    final normalized = condition.toLowerCase();
    if (normalized.contains('clear') || normalized.contains('sun')) return '☀️';
    if (normalized.contains('cloud')) return '☁️';
    if (normalized.contains('rain') || normalized.contains('drizzle')) return '🌧️';
    if (normalized.contains('snow')) return '❄️';
    if (normalized.contains('storm') || normalized.contains('thunder')) return '⛈️';
    return '🌤️';
  }
  
  Future<void> _loadUserStats() async {
    try {
      final backendService = BackendConnectivityService();
      
      // Test backend connectivity first
      final isConnected = await backendService.testConnection();
      if (!isConnected) {
        print('⚠️ Backend not available, using fallback data');
        _userStats = {'trips': 0, 'places': 0, 'badges': 0};
        return;
      }
      
      // TODO: Get actual user ID from auth service
      final userId = 'current_user_id';
      
      // Load real user stats from backend
      final stats = await backendService.getUserStats(userId);
      if (stats != null) {
        _userStats = {
          'trips': stats['totalTrips'] ?? 0,
          'places': stats['totalFavorites'] ?? 0, 
          'badges': stats['badgesEarned']?.length ?? 0,
          'favorites': stats['totalFavorites'] ?? 0,
          'posts': stats['totalPosts'] ?? 0
        };
        print('✅ Real user stats loaded: $_userStats');
      } else {
        _userStats = {'trips': 0, 'places': 0, 'badges': 0};
      }
    } catch (e) {
      print('❌ Failed to load user stats: $e');
      _userStats = {'trips': 0, 'places': 0, 'badges': 0};
    }
  }
}
