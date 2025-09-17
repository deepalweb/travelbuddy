class Dish {
  final String id;
  final String name;
  final String description;
  final String priceRange; // 'budget', 'mid-range', 'fine-dining'
  final String averagePrice;
  final String cuisine;
  final String restaurantName;
  final String restaurantAddress;
  final String restaurantId;
  final String imageUrl;
  final double rating;
  final List<String> dietaryTags; // ['vegetarian', 'halal', 'gluten-free']
  final String culturalNote;

  Dish({
    required this.id,
    required this.name,
    required this.description,
    required this.priceRange,
    required this.averagePrice,
    required this.cuisine,
    required this.restaurantName,
    required this.restaurantAddress,
    required this.restaurantId,
    this.imageUrl = '',
    this.rating = 0.0,
    this.dietaryTags = const [],
    this.culturalNote = '',
  });

  factory Dish.fromJson(Map<String, dynamic> json) {
    return Dish(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      priceRange: json['priceRange'] ?? 'mid-range',
      averagePrice: json['averagePrice'] ?? '',
      cuisine: json['cuisine'] ?? '',
      restaurantName: json['restaurantName'] ?? '',
      restaurantAddress: json['restaurantAddress'] ?? '',
      restaurantId: json['restaurantId'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      dietaryTags: List<String>.from(json['dietaryTags'] ?? []),
      culturalNote: json['culturalNote'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'priceRange': priceRange,
      'averagePrice': averagePrice,
      'cuisine': cuisine,
      'restaurantName': restaurantName,
      'restaurantAddress': restaurantAddress,
      'restaurantId': restaurantId,
      'imageUrl': imageUrl,
      'rating': rating,
      'dietaryTags': dietaryTags,
      'culturalNote': culturalNote,
    };
  }
}