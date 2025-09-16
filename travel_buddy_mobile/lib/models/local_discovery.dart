class LocalDiscovery {
  final String title;
  final String description;
  final Map<String, dynamic> hiddenGem;
  final Map<String, dynamic> localFoodCulture;
  final List<String> insiderTips;
  final List<Map<String, dynamic>> events;
  final List<String> traditions;
  final List<String> seasonalHighlights;

  LocalDiscovery({
    required this.title,
    required this.description,
    required this.hiddenGem,
    required this.localFoodCulture,
    required this.insiderTips,
    required this.events,
    required this.traditions,
    required this.seasonalHighlights,
  });

  factory LocalDiscovery.fromJson(Map<String, dynamic> json) {
    return LocalDiscovery(
      title: json['title'] ?? 'Local Discoveries',
      description: json['description'] ?? 'Discover local treasures',
      hiddenGem: json['hiddenGem'] as Map<String, dynamic>? ?? {},
      localFoodCulture: json['localFoodCulture'] as Map<String, dynamic>? ?? {},
      insiderTips: List<String>.from(json['insiderTips'] ?? []),
      events: List<Map<String, dynamic>>.from(json['events'] ?? []),
      traditions: List<String>.from(json['traditions'] ?? []),
      seasonalHighlights: List<String>.from(json['seasonalHighlights'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'hiddenGem': hiddenGem,
      'localFoodCulture': localFoodCulture,
      'insiderTips': insiderTips,
      'events': events,
      'traditions': traditions,
      'seasonalHighlights': seasonalHighlights,
    };
  }
}