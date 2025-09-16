import '../models/weather.dart' as models;

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
    await Future.delayed(const Duration(milliseconds: 300)); // Simulate API call

    // Mock weather data - in real app, use weather API
    return WeatherInfo(
      temperature: 22.0,
      feelsLike: 23.5,
      humidity: 65,
      windSpeed: 3.5,
      condition: 'Sunny',
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
    await Future.delayed(const Duration(milliseconds: 300)); // Simulate API call

    return WeatherForecast(
      daily: _getMockDailyForecast(),
      hourly: _getMockHourlyForecast(),
    );
  }

  List<String> _getWeatherBasedSuggestions(String condition) {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return [
          'Visit outdoor markets',
          'Take a walking tour',
          'Enjoy rooftop dining',
          'Explore city parks',
          'Visit outdoor attractions',
        ];
      case 'rainy':
        return [
          'Explore museums',
          'Visit indoor cafes',
          'Try shopping malls',
          'Check out indoor attractions',
          'Visit art galleries',
        ];
      case 'cloudy':
        return [
          'Perfect for photography',
          'Great for city walks',
          'Visit galleries',
          'Explore local shops',
          'Try indoor/outdoor cafes',
        ];
      case 'snow':
        return [
          'Visit winter attractions',
          'Try winter sports',
          'Enjoy indoor activities',
          'Visit cozy cafes',
          'Take winter photos',
        ];
      default:
        return [
          'Check local indoor attractions',
          'Visit museums and galleries',
          'Explore local shops',
          'Try local restaurants',
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