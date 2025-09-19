class WeatherForecast {
  final String condition;
  final double temperature;
  final double humidity;
  final double windSpeed;
  final List<HourlyForecast> hourlyForecast;

  WeatherForecast({
    required this.condition,
    required this.temperature,
    required this.humidity,
    required this.windSpeed,
    required this.hourlyForecast,
  });

  factory WeatherForecast.fromJson(Map<String, dynamic> json) {
    return WeatherForecast(
      condition: json['condition'] ?? 'sunny',
      temperature: (json['temperature'] ?? 25.0).toDouble(),
      humidity: (json['humidity'] ?? 60.0).toDouble(),
      windSpeed: (json['windSpeed'] ?? 5.0).toDouble(),
      hourlyForecast: (json['hourlyForecast'] as List<dynamic>?)
          ?.map((item) => HourlyForecast.fromJson(item))
          .toList() ?? [],
    );
  }
}

class HourlyForecast {
  final String time;
  final double temperature;
  final String condition;

  HourlyForecast({
    required this.time,
    required this.temperature,
    required this.condition,
  });

  factory HourlyForecast.fromJson(Map<String, dynamic> json) {
    return HourlyForecast(
      time: json['time'] ?? '',
      temperature: (json['temperature'] ?? 25.0).toDouble(),
      condition: json['condition'] ?? 'sunny',
    );
  }
}