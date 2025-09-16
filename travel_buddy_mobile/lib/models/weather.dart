class WeatherInfo {
  final String displayText;
  final double temperature;
  final String condition;
  final double humidity;
  final double windSpeed;
  final String description;

  WeatherInfo({
    required this.displayText,
    required this.temperature,
    required this.condition,
    required this.humidity,
    required this.windSpeed,
    required this.description,
  });

  factory WeatherInfo.fromJson(Map<String, dynamic> json) {
    return WeatherInfo(
      displayText: json['displayText'] ?? '22°C ☀️',
      temperature: (json['temperature'] as num?)?.toDouble() ?? 22.0,
      condition: json['condition'] ?? 'sunny',
      humidity: (json['humidity'] as num?)?.toDouble() ?? 50.0,
      windSpeed: (json['windSpeed'] as num?)?.toDouble() ?? 0.0,
      description: json['description'] ?? 'Sunny day',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'displayText': displayText,
      'temperature': temperature,
      'condition': condition,
      'humidity': humidity,
      'windSpeed': windSpeed,
      'description': description,
    };
  }
}