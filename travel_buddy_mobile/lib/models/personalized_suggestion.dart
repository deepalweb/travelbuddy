class PersonalizedSuggestion {
  final String id;
  final String title;
  final String description;
  final String category;
  final double rating;
  final String imageUrl;
  final Map<String, dynamic> details;
  final double relevanceScore;
  final List<String> tags;

  PersonalizedSuggestion({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.rating,
    required this.imageUrl,
    required this.details,
    required this.relevanceScore,
    required this.tags,
  });

  factory PersonalizedSuggestion.fromJson(Map<String, dynamic> json) {
    return PersonalizedSuggestion(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'general',
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      imageUrl: json['imageUrl'] ?? '',
      details: json['details'] as Map<String, dynamic>? ?? {},
      relevanceScore: (json['relevanceScore'] as num?)?.toDouble() ?? 0.0,
      tags: List<String>.from(json['tags'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'rating': rating,
      'imageUrl': imageUrl,
      'details': details,
      'relevanceScore': relevanceScore,
      'tags': tags,
    };
  }
}