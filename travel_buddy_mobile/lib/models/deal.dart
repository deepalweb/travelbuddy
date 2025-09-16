

class Deal {
  final String id;
  final String title;
  final String description;
  final String category;
  final String imageUrl;
  final double originalPrice;
  final double discountedPrice;
  final String currency;
  final DateTime validFrom;
  final DateTime validUntil;
  final String location;
  final Map<String, dynamic> details;
  final List<String> terms;
  final String providerName;
  final String bookingLink;

  Deal({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.imageUrl,
    required this.originalPrice,
    required this.discountedPrice,
    required this.currency,
    required this.validFrom,
    required this.validUntil,
    required this.location,
    required this.details,
    required this.terms,
    required this.providerName,
    required this.bookingLink,
  });

  factory Deal.fromJson(Map<String, dynamic> json) {
    return Deal(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'general',
      imageUrl: json['imageUrl'] ?? '',
      originalPrice: (json['originalPrice'] as num?)?.toDouble() ?? 0.0,
      discountedPrice: (json['discountedPrice'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] ?? 'USD',
      validFrom: DateTime.parse(json['validFrom'] ?? DateTime.now().toIso8601String()),
      validUntil: DateTime.parse(json['validUntil'] ?? DateTime.now().add(const Duration(days: 30)).toIso8601String()),
      location: json['location'] ?? '',
      details: json['details'] as Map<String, dynamic>? ?? {},
      terms: List<String>.from(json['terms'] ?? []),
      providerName: json['providerName'] ?? '',
      bookingLink: json['bookingLink'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'imageUrl': imageUrl,
      'originalPrice': originalPrice,
      'discountedPrice': discountedPrice,
      'currency': currency,
      'validFrom': validFrom.toIso8601String(),
      'validUntil': validUntil.toIso8601String(),
      'location': location,
      'details': details,
      'terms': terms,
      'providerName': providerName,
      'bookingLink': bookingLink,
    };
  }
}