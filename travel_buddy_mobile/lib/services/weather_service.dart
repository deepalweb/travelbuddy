import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/weather.dart' as models;
import '../constants/app_constants.dart';

class WeatherInfo {
  final double temperature;
  final double feelsLike;
  final int humidity;
  final double windSpeed;
  final String condition;
  final String emoji;
  final String description;
  final String iconUrl;
  final List<String> suggestions;
  final DateTime timestamp;
  final double precipitation;
  final WeatherForecast forecast;

  WeatherInfo({
    required this.temperature,
    required this.feelsLike,
    required this.humidity,
    required this.windSpeed,
    required this.condition,
    required this.emoji,
    required this.description,
    required this.iconUrl,
    required this.suggestions,
    required this.timestamp,
    required this.precipitation,
    required this.forecast,
  });

  String get displayText => '${temperature.round()}°C $emoji $condition';

  Map<String, dynamic> toJson() => {
    'temperature': temperature,
    'feelsLike': feelsLike,
    'humidity': humidity,
    'windSpeed': windSpeed,
    'condition': condition,
    'emoji': emoji,
    'description': description,
    'iconUrl': iconUrl,
    'suggestions': suggestions,
    'timestamp': timestamp.toIso8601String(),
    'precipitation': precipitation,
    'forecast': forecast.toJson(),
  };

  // Convert to model WeatherInfo
  models.WeatherInfo toModelWeatherInfo() {
    return models.WeatherInfo(
      displayText: displayText,
      temperature: temperature,
      condition: condition,
      humidity: humidity.toDouble(),
      windSpeed: windSpeed,
      description: description,
    );
  }

  factory WeatherInfo.fromJson(Map<String, dynamic> json) => WeatherInfo(
    temperature: json['temperature'],
    feelsLike: json['feelsLike'],
    humidity: json['humidity'],
    windSpeed: json['windSpeed'],
    condition: json['condition'],
    emoji: json['emoji'],
    description: json['description'],
    iconUrl: json['iconUrl'],
    suggestions: List<String>.from(json['suggestions']),
    timestamp: DateTime.parse(json['timestamp']),
    precipitation: json['precipitation'],
    forecast: WeatherForecast.fromJson(json['forecast']),
  );
}

class WeatherForecast {
  final List<DailyForecast> daily;
  final List<HourlyForecast> hourly;

  WeatherForecast({
    required this.daily,
    required this.hourly,
  });

  Map<String, dynamic> toJson() => {
    'daily': daily.map((d) => d.toJson()).toList(),
    'hourly': hourly.map((h) => h.toJson()).toList(),
  };

  factory WeatherForecast.fromJson(Map<String, dynamic> json) => WeatherForecast(
    daily: List<DailyForecast>.from(
      json['daily'].map((x) => DailyForecast.fromJson(x))),
    hourly: List<HourlyForecast>.from(
      json['hourly'].map((x) => HourlyForecast.fromJson(x))),
  );
}

class DailyForecast {
  final DateTime date;
  final double tempMax;
  final double tempMin;
  final String condition;
  final String iconUrl;
  final double precipitation;
  final String emoji;

  DailyForecast({
    required this.date,
    required this.tempMax,
    required this.tempMin,
    required this.condition,
    required this.iconUrl,
    required this.precipitation,
    required this.emoji,
  });

  Map<String, dynamic> toJson() => {
    'date': date.toIso8601String(),
    'tempMax': tempMax,
    'tempMin': tempMin,
    'condition': condition,
    'iconUrl': iconUrl,
    'precipitation': precipitation,
    'emoji': emoji,
  };

  factory DailyForecast.fromJson(Map<String, dynamic> json) => DailyForecast(
    date: DateTime.parse(json['date']),
    tempMax: json['tempMax'],
    tempMin: json['tempMin'],
    condition: json['condition'],
    iconUrl: json['iconUrl'],
    precipitation: json['precipitation'],
    emoji: json['emoji'],
  );
}

class HourlyForecast {
  final DateTime time;
  final double temperature;
  final String condition;
  final String iconUrl;
  final String emoji;
  final double precipitation;

  HourlyForecast({
    required this.time,
    required this.temperature,
    required this.condition,
    required this.iconUrl,
    required this.emoji,
    required this.precipitation,
  });

  Map<String, dynamic> toJson() => {
    'time': time.toIso8601String(),
    'temperature': temperature,
    'condition': condition,
    'iconUrl': iconUrl,
    'emoji': emoji,
    'precipitation': precipitation,
  };

  factory HourlyForecast.fromJson(Map<String, dynamic> json) => HourlyForecast(
    time: DateTime.parse(json['time']),
    temperature: json['temperature'],
    condition: json['condition'],
    iconUrl: json['iconUrl'],
    emoji: json['emoji'],
    precipitation: json['precipitation'],
  );
}

class WeatherService {
  static final WeatherService _instance = WeatherService._internal();
  factory WeatherService() => _instance;
  WeatherService._internal();

  Future<WeatherInfo> getCurrentWeather({
    required double latitude,
    required double longitude,
  }) async {
    try {
      // Try Google Weather API via backend first
      final realWeather = await _fetchGoogleWeather(latitude, longitude);
      if (realWeather != null) {
        print('✅ Using real Google Weather data');
        return realWeather;
      }
    } catch (e) {
      print('⚠️ Google Weather API failed: $e');
    }
    
    // Fallback to mock data
    print('🎭 Using mock weather data');
    return _getMockWeatherInfo();
  }
  
  Future<WeatherInfo?> _fetchGoogleWeather(double latitude, double longitude) async {
    try {
      final url = '${AppConstants.baseUrl}/api/weather/current?lat=$latitude&lng=$longitude';
      print('🌤️ Fetching weather: $url');
      
      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return _parseGoogleWeatherResponse(data);
      } else {
        print('❌ Weather API error: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Weather fetch error: $e');
    }
    return null;
  }
  
  WeatherInfo _parseGoogleWeatherResponse(Map<String, dynamic> data) {
    final current = data['current'] ?? {};
    final temp = (current['temperature'] ?? 22.0).toDouble();
    final condition = current['condition'] ?? 'clear';
    final humidity = (current['humidity'] ?? 65).toInt();
    final windSpeed = (current['windSpeed'] ?? 3.5).toDouble();
    final description = current['description'] ?? 'Current weather conditions';
    
    return WeatherInfo(
      temperature: temp,
      feelsLike: (current['feelsLike'] ?? temp + 1.5).toDouble(),
      humidity: humidity,
      windSpeed: windSpeed,
      condition: _normalizeCondition(condition),
      emoji: _getWeatherEmoji(condition),
      description: description,
      iconUrl: current['iconUrl'] ?? '',
      suggestions: _getWeatherBasedSuggestions(condition),
      timestamp: DateTime.now(),
      precipitation: (current['precipitation'] ?? 0.0).toDouble(),
      forecast: _parseForecast(data['forecast'] ?? {}),
    );
  }
  
  String _normalizeCondition(String condition) {
    final normalized = condition.toLowerCase();
    if (normalized.contains('rain') || normalized.contains('drizzle')) return 'rainy';
    if (normalized.contains('snow')) return 'snow';
    if (normalized.contains('cloud')) return 'cloudy';
    if (normalized.contains('clear') || normalized.contains('sunny')) return 'sunny';
    if (normalized.contains('storm') || normalized.contains('thunder')) return 'stormy';
    return 'clear';
  }
  
  String _getWeatherEmoji(String condition) {
    final normalized = _normalizeCondition(condition);
    switch (normalized) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      case 'snow': return '❄️';
      case 'stormy': return '⛈️';
      default: return '🌤️';
    }
  }
  
  WeatherForecast _parseForecast(Map<String, dynamic> forecastData) {
    try {
      final dailyData = forecastData['daily'] as List? ?? [];
      final hourlyData = forecastData['hourly'] as List? ?? [];
      
      return WeatherForecast(
        daily: dailyData.map((d) => _parseDailyForecast(d)).toList(),
        hourly: hourlyData.map((h) => _parseHourlyForecast(h)).toList(),
      );
    } catch (e) {
      print('⚠️ Forecast parsing error: $e');
      return WeatherForecast(daily: _getMockDailyForecast(), hourly: _getMockHourlyForecast());
    }
  }
  
  DailyForecast _parseDailyForecast(Map<String, dynamic> data) {
    return DailyForecast(
      date: DateTime.tryParse(data['date'] ?? '') ?? DateTime.now(),
      tempMax: (data['tempMax'] ?? 25.0).toDouble(),
      tempMin: (data['tempMin'] ?? 15.0).toDouble(),
      condition: _normalizeCondition(data['condition'] ?? 'clear'),
      iconUrl: data['iconUrl'] ?? '',
      precipitation: (data['precipitation'] ?? 0.0).toDouble(),
      emoji: _getWeatherEmoji(data['condition'] ?? 'clear'),
    );
  }
  
  HourlyForecast _parseHourlyForecast(Map<String, dynamic> data) {
    return HourlyForecast(
      time: DateTime.tryParse(data['time'] ?? '') ?? DateTime.now(),
      temperature: (data['temperature'] ?? 22.0).toDouble(),
      condition: _normalizeCondition(data['condition'] ?? 'clear'),
      iconUrl: data['iconUrl'] ?? '',
      emoji: _getWeatherEmoji(data['condition'] ?? 'clear'),
      precipitation: (data['precipitation'] ?? 0.0).toDouble(),
    );
  }
  
  WeatherInfo _getMockWeatherInfo() {
    return WeatherInfo(
      temperature: 22.0,
      feelsLike: 23.5,
      humidity: 65,
      windSpeed: 3.5,
      condition: 'sunny',
      emoji: '☀️',
      description: 'Perfect weather for outdoor activities',
      iconUrl: 'https://example.com/weather/sunny.png',
      suggestions: _getWeatherBasedSuggestions('sunny'),
      timestamp: DateTime.now(),
      precipitation: 0.0,
      forecast: WeatherForecast(
        daily: _getMockDailyForecast(),
        hourly: _getMockHourlyForecast(),
      ),
    );
  }

  Future<WeatherForecast> getDetailedForecast({
    required double latitude,
    required double longitude,
  }) async {
    try {
      final url = '${AppConstants.baseUrl}/api/weather/forecast?lat=$latitude&lng=$longitude';
      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return _parseForecast(data);
      }
    } catch (e) {
      print('⚠️ Detailed forecast error: $e');
    }
    
    // Fallback to mock forecast
    return WeatherForecast(
      daily: _getMockDailyForecast(),
      hourly: _getMockHourlyForecast(),
    );
  }

  List<String> _getWeatherBasedSuggestions(String condition) {
    final normalized = _normalizeCondition(condition);
    switch (normalized) {
      case 'sunny':
        return [
          'Visit outdoor markets',
          'Take a walking tour',
          'Enjoy rooftop dining',
          'Explore city parks',
          'Visit outdoor attractions',
          'Try street food',
          'Visit beaches or waterfronts',
        ];
      case 'rainy':
        return [
          'Explore museums',
          'Visit indoor cafes',
          'Try shopping malls',
          'Check out indoor attractions',
          'Visit art galleries',
          'Go to libraries or bookstores',
          'Try indoor entertainment',
        ];
      case 'cloudy':
        return [
          'Perfect for photography',
          'Great for city walks',
          'Visit galleries',
          'Explore local shops',
          'Try indoor/outdoor cafes',
          'Visit historic sites',
        ];
      case 'snow':
        return [
          'Visit winter attractions',
          'Try winter sports',
          'Enjoy indoor activities',
          'Visit cozy cafes',
          'Take winter photos',
          'Try hot springs or spas',
        ];
      case 'stormy':
        return [
          'Stay indoors - visit museums',
          'Try indoor shopping',
          'Visit cafes and restaurants',
          'Check out indoor entertainment',
          'Visit libraries or cultural centers',
        ];
      default:
        return [
          'Check local attractions',
          'Visit museums and galleries',
          'Explore local shops',
          'Try local restaurants',
          'Take a city tour',
        ];
    }
  }

  List<DailyForecast> _getMockDailyForecast() {
    final now = DateTime.now();
    return List.generate(7, (index) {
      return DailyForecast(
        date: now.add(Duration(days: index)),
        tempMax: 24.0 + (index * 0.5),
        tempMin: 16.0 + (index * 0.3),
        condition: index % 2 == 0 ? 'Sunny' : 'Partly Cloudy',
        iconUrl: index % 2 == 0 
          ? 'https://example.com/weather/sunny.png'
          : 'https://example.com/weather/partly-cloudy.png',
        precipitation: index % 2 == 0 ? 0.0 : 20.0,
        emoji: index % 2 == 0 ? '☀️' : '⛅',
      );
    });
  }

  List<HourlyForecast> _getMockHourlyForecast() {
    final now = DateTime.now();
    return List.generate(24, (index) {
      return HourlyForecast(
        time: now.add(Duration(hours: index)),
        temperature: 22.0 + (index % 5),
        condition: index % 3 == 0 ? 'Sunny' : 'Partly Cloudy',
        iconUrl: index % 3 == 0 
          ? 'https://example.com/weather/sunny.png'
          : 'https://example.com/weather/partly-cloudy.png',
        emoji: index % 3 == 0 ? '☀️' : '⛅',
        precipitation: index % 3 == 0 ? 0.0 : 10.0,
      );
    });
  }
}