class Place {
  final String id;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final String? phone;
  final String? website;
  final String category;
  final double? rating;
  final int? reviewCount;
  final List<Review>? reviews;
  final String? priceLevel;
  final OpeningHours? openingHours;
  final bool hasReviews;

  Place({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    this.phone,
    this.website,
    required this.category,
    this.rating,
    this.reviewCount,
    this.reviews,
    this.priceLevel,
    this.openingHours,
    this.hasReviews = false,
  });

  // Create from Azure Maps response
  factory Place.fromAzureMaps(Map<String, dynamic> json) {
    final position = json['position'];
    final poi = json['poi'] ?? {};
    final address = json['address'] ?? {};

    return Place(
      id: json['id'] ?? '',
      name: poi['name'] ?? 'Unknown',
      address: address['freeformAddress'] ?? '',
      latitude: position['lat']?.toDouble() ?? 0.0,
      longitude: position['lon']?.toDouble() ?? 0.0,
      phone: poi['phone'],
      website: poi['url'],
      category: poi['categories']?.first ?? 'general',
    );
  }

  // Create from backend response (supports both Google Places and Azure Maps)
  factory Place.fromBackend(Map<String, dynamic> json) {
    // Handle Azure Maps format
    if (json['poi'] != null) {
      final poi = json['poi'];
      final address = json['address'];
      final position = json['position'];
      
      return Place(
        id: json['id'] ?? '',
        name: poi['name'] ?? 'Unknown',
        address: address?['freeformAddress'] ?? '',
        latitude: position?['lat']?.toDouble() ?? 0.0,
        longitude: position?['lon']?.toDouble() ?? 0.0,
        phone: poi['phone'],
        website: poi['url'],
        category: poi['categories']?.first ?? 'general',
        rating: null, // Azure Maps doesn't provide ratings
        reviewCount: null,
        hasReviews: false,
      );
    }
    
    // Handle Google Places format
    final geometry = json['geometry']?['location'];
    final types = json['types'] as List?;
    
    return Place(
      id: json['place_id'] ?? '',
      name: json['name'] ?? 'Unknown',
      address: json['vicinity'] ?? json['formatted_address'] ?? '',
      latitude: geometry?['lat']?.toDouble() ?? 0.0,
      longitude: geometry?['lng']?.toDouble() ?? 0.0,
      category: types?.first ?? 'general',
      rating: json['rating']?.toDouble(),
      reviewCount: json['user_ratings_total'],
      hasReviews: json['rating'] != null,
    );
  }



  static String? _getPriceLevel(int? level) {
    switch (level) {
      case 1: return '\$';
      case 2: return '\$\$';
      case 3: return '\$\$\$';
      case 4: return '\$\$\$\$';
      default: return null;
    }
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'address': address,
    'latitude': latitude,
    'longitude': longitude,
    'phone': phone,
    'website': website,
    'category': category,
    'rating': rating,
    'reviewCount': reviewCount,
    'priceLevel': priceLevel,
    'hasReviews': hasReviews,
  };

  factory Place.fromJson(Map<String, dynamic> json) => Place(
    id: json['id'],
    name: json['name'],
    address: json['address'],
    latitude: json['latitude'],
    longitude: json['longitude'],
    phone: json['phone'],
    website: json['website'],
    category: json['category'],
    rating: json['rating'],
    reviewCount: json['reviewCount'],
    priceLevel: json['priceLevel'],
    hasReviews: json['hasReviews'] ?? false,
  );
}

class Review {
  final String author;
  final double rating;
  final String text;
  final DateTime time;

  Review({
    required this.author,
    required this.rating,
    required this.text,
    required this.time,
  });

  factory Review.fromBackend(Map<String, dynamic> json) => Review(
    author: json['author'] ?? 'Anonymous',
    rating: json['rating']?.toDouble() ?? 0.0,
    text: json['text'] ?? '',
    time: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
  );

  factory Review.fromGoogle(Map<String, dynamic> json) => Review(
    author: json['author_name'] ?? 'Anonymous',
    rating: json['rating']?.toDouble() ?? 0.0,
    text: json['text'] ?? '',
    time: DateTime.fromMillisecondsSinceEpoch(json['time'] * 1000),
  );
}

class OpeningHours {
  final List<String> weekdayText;
  final bool openNow;

  OpeningHours({
    required this.weekdayText,
    required this.openNow,
  });

  factory OpeningHours.fromBackend(Map<String, dynamic> json) => OpeningHours(
    weekdayText: List<String>.from(json['weekdayText'] ?? []),
    openNow: json['openNow'] ?? false,
  );

  factory OpeningHours.fromGoogle(Map<String, dynamic> json) => OpeningHours(
    weekdayText: List<String>.from(json['weekday_text'] ?? []),
    openNow: json['open_now'] ?? false,
  );
}