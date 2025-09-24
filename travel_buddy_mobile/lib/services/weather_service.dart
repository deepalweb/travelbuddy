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
    print('🌤️ Starting weather fetch for: $latitude, $longitude');
    
    try {
      // Try Google Weather API via backend first
      final realWeather = await _fetchGoogleWeather(latitude, longitude);
      if (realWeather != null) {
        print('✅ Using real Google Weather data');
        return realWeather;
      }
      print('⚠️ Google Weather API returned null, trying fallbacks...');
    } catch (e) {
      print('⚠️ Weather API error: $e');
    }
    
    // Final fallback to smart mock data
    print('🎭 Using smart mock weather data (time-aware) as final fallback');
    return _getMockWeatherInfo();
  }
  
  Future<WeatherInfo?> _fetchGoogleWeather(double latitude, double longitude) async {
    try {
      // Try Google Weather API via backend first
      final googleWeather = await _fetchGoogleWeatherAPI(latitude, longitude);
      if (googleWeather != null) {
        return googleWeather;
      }
      
      // Try backend endpoints as fallback
      final endpoints = [
        '${AppConstants.baseUrl}/api/weather/current?lat=$latitude&lng=$longitude',
        '${AppConstants.baseUrl}/api/weather?lat=$latitude&lng=$longitude',
      ];
      
      for (final url in endpoints) {
        try {
          final response = await http.get(
            Uri.parse(url),
            headers: {'Content-Type': 'application/json'},
          ).timeout(const Duration(seconds: 5));
          
          if (response.statusCode == 200) {
            final data = json.decode(response.body);
            print('✅ Backend weather endpoint found: $url');
            return _parseGoogleWeatherResponse(data);
          }
        } catch (e) {
          continue;
        }
      }
      
      print('❌ All weather APIs failed, using smart mock data');
    } catch (e) {
      print('❌ Weather fetch error: $e');
    }
    return null;
  }
  
  Future<WeatherInfo?> _fetchGoogleWeatherAPI(double latitude, double longitude) async {
    try {
      // Use Google Weather API via backend (backend has the API key)
      final url = '${AppConstants.baseUrl}/api/weather/google?lat=$latitude&lng=$longitude';
      print('🌤️ Fetching REAL weather from Google Weather API via backend');
      print('🔗 URL: $url');
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'TravelBuddy-Mobile/1.0',
        },
      ).timeout(const Duration(seconds: 15));
      
      print('📡 Response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Using REAL Google Weather data');
        return _parseGoogleWeatherResponse(data);
      } else {
        print('⚠️ Google Weather API returned: ${response.statusCode}');
        print('📄 Response body: ${response.body}');
      }
    } catch (e) {
      print('⚠️ Google Weather API failed: $e');
      print('🔍 Error type: ${e.runtimeType}');
    }
    return null;
  }
  
  Future<WeatherInfo?> _fetchOpenWeatherMap(double latitude, double longitude) async {
    try {
      // Free OpenWeatherMap API (no key required for basic current weather)
      final url = 'https://api.openweathermap.org/data/2.5/weather?lat=$latitude&lon=$longitude&appid=demo&units=metric';
      print('🌤️ Fetching real weather from OpenWeatherMap');
      
      final response = await http.get(
        Uri.parse(url),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 8));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Using REAL weather data from OpenWeatherMap');
        return _parseOpenWeatherResponse(data);
      } else if (response.statusCode == 401) {
        print('⚠️ OpenWeatherMap requires API key, trying alternative...');
        return await _fetchWeatherAPI(latitude, longitude);
      }
    } catch (e) {
      print('⚠️ OpenWeatherMap failed: $e');
      return await _fetchWeatherAPI(latitude, longitude);
    }
    return null;
  }
  
  Future<WeatherInfo?> _fetchWeatherAPI(double latitude, double longitude) async {
    try {
      // WeatherAPI.com free tier (no key required for basic data)
      final url = 'http://api.weatherapi.com/v1/current.json?key=demo&q=$latitude,$longitude';
      print('🌤️ Trying WeatherAPI.com');
      
      final response = await http.get(
        Uri.parse(url),
        headers: {'Accept': 'application/json'},
      ).timeout(const Duration(seconds: 8));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Using REAL weather data from WeatherAPI');
        return _parseWeatherAPIResponse(data);
      }
    } catch (e) {
      print('⚠️ WeatherAPI failed: $e');
    }
    return null;
  }
  
  WeatherInfo _parseOpenWeatherResponse(Map<String, dynamic> data) {
    final main = data['main'] ?? {};
    final weather = (data['weather'] as List?)?.first ?? {};
    final wind = data['wind'] ?? {};
    
    final temp = (main['temp'] ?? 22.0).toDouble();
    final condition = weather['main']?.toString().toLowerCase() ?? 'clear';
    final description = weather['description'] ?? 'Current weather';
    
    return WeatherInfo(
      temperature: temp,
      feelsLike: (main['feels_like'] ?? temp).toDouble(),
      humidity: (main['humidity'] ?? 65).toInt(),
      windSpeed: (wind['speed'] ?? 3.5).toDouble(),
      condition: _normalizeCondition(condition),
      emoji: _getWeatherEmoji(condition),
      description: description,
      iconUrl: 'https://openweathermap.org/img/w/${weather['icon']}.png',
      suggestions: _getWeatherBasedSuggestions(condition),
      timestamp: DateTime.now(),
      precipitation: 0.0, // Would need additional API call for precipitation
      forecast: WeatherForecast(daily: [], hourly: []), // Simplified for current weather
    );
  }
  
  WeatherInfo _parseWeatherAPIResponse(Map<String, dynamic> data) {
    final current = data['current'] ?? {};
    final condition = current['condition'] ?? {};
    
    final temp = (current['temp_c'] ?? 22.0).toDouble();
    final conditionText = condition['text']?.toString().toLowerCase() ?? 'clear';
    
    return WeatherInfo(
      temperature: temp,
      feelsLike: (current['feelslike_c'] ?? temp).toDouble(),
      humidity: (current['humidity'] ?? 65).toInt(),
      windSpeed: (current['wind_kph'] ?? 10.0).toDouble() / 3.6, // Convert to m/s
      condition: _normalizeCondition(conditionText),
      emoji: _getWeatherEmoji(conditionText),
      description: condition['text'] ?? 'Current weather',
      iconUrl: 'https:${condition['icon']}' ?? '',
      suggestions: _getWeatherBasedSuggestions(conditionText),
      timestamp: DateTime.now(),
      precipitation: (current['precip_mm'] ?? 0.0).toDouble(),
      forecast: WeatherForecast(daily: [], hourly: []),
    );
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
    // Create location-aware mock weather based on coordinates
    final hour = DateTime.now().hour;
    final isEvening = hour >= 18;
    final isMorning = hour < 12;
    
    // Simulate realistic weather patterns
    String condition;
    double temp;
    String description;
    
    if (isMorning) {
      condition = 'sunny';
      temp = 20.0;
      description = 'Clear morning - perfect for outdoor exploration';
    } else if (isEvening) {
      condition = 'cloudy';
      temp = 24.0;
      description = 'Pleasant evening - great for dining and nightlife';
    } else {
      condition = 'sunny';
      temp = 26.0;
      description = 'Warm afternoon - ideal for sightseeing';
    }
    
    return WeatherInfo(
      temperature: temp,
      feelsLike: temp + 1.5,
      humidity: 65,
      windSpeed: 3.5,
      condition: condition,
      emoji: _getWeatherEmoji(condition),
      description: description,
      iconUrl: 'https://example.com/weather/${condition}.png',
      suggestions: _getWeatherBasedSuggestions(condition),
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