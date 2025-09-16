class TravelBadge {
  final String id;
  final String name;
  final String description;
  final String iconUrl;
  final DateTime earnedAt;
  final BadgeCategory category;
  final int level; // For tiered badges (e.g., Level 1, 2, 3)

  TravelBadge({
    required this.id,
    required this.name,
    required this.description,
    required this.iconUrl,
    required this.earnedAt,
    required this.category,
    this.level = 1,
  });

  factory TravelBadge.fromJson(Map<String, dynamic> json) {
    return TravelBadge(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      iconUrl: json['iconUrl'] ?? '',
      earnedAt: DateTime.parse(json['earnedAt'] ?? DateTime.now().toIso8601String()),
      category: BadgeCategory.values.firstWhere(
        (e) => e.toString() == 'BadgeCategory.${json['category']}',
        orElse: () => BadgeCategory.other,
      ),
      level: json['level'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'iconUrl': iconUrl,
      'earnedAt': earnedAt.toIso8601String(),
      'category': category.toString().split('.').last,
      'level': level,
    };
  }
}

enum BadgeCategory {
  explorer,      // For visiting places
  photographer,  // For sharing photos
  reviewer,      // For writing reviews
  social,        // For community engagement
  expert,        // For knowledge sharing
  achievement,   // For completing challenges
  other
}
