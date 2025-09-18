// Enhanced Dish Models for Mobile App

class DishesResponse {
  final String location;
  final List<Dish> dishes;
  final Metadata metadata;

  DishesResponse({
    required this.location,
    required this.dishes,
    required this.metadata,
  });

  factory DishesResponse.fromJson(Map<String, dynamic> json) {
    return DishesResponse(
      location: json['location'] ?? '',
      dishes: (json['dishes'] as List? ?? [])
          .map((d) => Dish.fromJson(d))
          .toList(),
      metadata: Metadata.fromJson(json['metadata'] ?? {}),
    );
  }
}

class Dish {
  final String name;
  final String description;
  final String averagePrice;
  final String category;
  final List<RecommendedPlace> recommendedPlaces;
  final List<String> userPhotos;
  final List<String> dietaryTags;
  final String culturalSignificance;

  Dish({
    required this.name,
    required this.description,
    required this.averagePrice,
    required this.category,
    required this.recommendedPlaces,
    required this.userPhotos,
    required this.dietaryTags,
    required this.culturalSignificance,
  });

  factory Dish.fromJson(Map<String, dynamic> json) {
    return Dish(
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      averagePrice: json['average_price'] ?? '',
      category: json['category'] ?? '',
      recommendedPlaces: (json['recommended_places'] as List? ?? [])
          .map((p) => RecommendedPlace.fromJson(p))
          .toList(),
      userPhotos: List<String>.from(json['user_photos'] ?? []),
      dietaryTags: List<String>.from(json['dietary_tags'] ?? []),
      culturalSignificance: json['cultural_significance'] ?? '',
    );
  }
}

class RecommendedPlace {
  final String name;
  final String type;
  final String address;
  final double rating;
  final String? placeId;

  RecommendedPlace({
    required this.name,
    required this.type,
    required this.address,
    required this.rating,
    this.placeId,
  });

  factory RecommendedPlace.fromJson(Map<String, dynamic> json) {
    return RecommendedPlace(
      name: json['name'] ?? '',
      type: json['type'] ?? '',
      address: json['address'] ?? '',
      rating: (json['rating'] ?? 0).toDouble(),
      placeId: json['place_id'],
    );
  }
}

class Metadata {
  final List<String> source;
  final List<String> filtersApplied;

  Metadata({
    required this.source,
    required this.filtersApplied,
  });

  factory Metadata.fromJson(Map<String, dynamic> json) {
    return Metadata(
      source: List<String>.from(json['source'] ?? []),
      filtersApplied: List<String>.from(json['filters_applied'] ?? []),
    );
  }
}