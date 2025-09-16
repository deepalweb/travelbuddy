import 'package:hive/hive.dart';

part 'place.g.dart';

@HiveType(typeId: 0)
class Place extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String name;

  @HiveField(2)
  final String type;

  @HiveField(3)
  final double rating;

  @HiveField(4)
  final String address;

  @HiveField(5)
  final String photoUrl;

  @HiveField(6)
  final String description;

  @HiveField(7)
  final String localTip;

  @HiveField(8)
  final String handyPhrase;

  @HiveField(9)
  final double? latitude;

  @HiveField(10)
  final double? longitude;

  @HiveField(11)
  final bool? isOpenNow;

  @HiveField(12)
  final String? website;

  @HiveField(13)
  final String? phoneNumber;

  @HiveField(14)
  final int? priceLevel;

  @HiveField(15)
  final Deal? deal;

  Place({
    required this.id,
    required this.name,
    required this.type,
    required this.rating,
    required this.address,
    required this.photoUrl,
    required this.description,
    required this.localTip,
    required this.handyPhrase,
    this.latitude,
    this.longitude,
    this.isOpenNow,
    this.website,
    this.phoneNumber,
    this.priceLevel,
    this.deal,
  });

  factory Place.fromJson(Map<String, dynamic> json) {
    // Handle both backend API format and local storage format
    final String placeId = json['place_id'] ?? json['id'] ?? '';
    final String placeName = json['name'] ?? '';
    final String placeType = json['types'] != null && (json['types'] as List).isNotEmpty 
        ? (json['types'] as List).first.toString().replaceAll('_', ' ').toUpperCase()
        : json['type'] ?? 'PLACE';
    final double placeRating = (json['rating'] ?? 0.0).toDouble();
    final String placeAddress = json['formatted_address'] ?? json['address'] ?? '';
    
    // Extract photo URL from photos array or use direct photoUrl
    String photoUrl = json['photoUrl'] ?? '';
    if (photoUrl.isEmpty && json['photos'] != null && (json['photos'] as List).isNotEmpty) {
      final photo = (json['photos'] as List).first;
      if (photo['photo_reference'] != null) {
        photoUrl = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/places/photo?ref=${photo['photo_reference']}&w=400';
      }
    }
    
    return Place(
      id: placeId,
      name: placeName,
      type: placeType,
      rating: placeRating,
      address: placeAddress,
      photoUrl: photoUrl,
      description: json['description'] ?? 'A great place to visit in the area.',
      localTip: json['localTip'] ?? 'Check opening hours before visiting.',
      handyPhrase: json['handyPhrase'] ?? 'Hello, thank you!',
      latitude: json['geometry']?['location']?['lat']?.toDouble(),
      longitude: json['geometry']?['location']?['lng']?.toDouble(),
      isOpenNow: json['opening_hours']?['open_now'] ?? json['business_status'] == 'OPERATIONAL',
      website: json['website'],
      phoneNumber: json['formatted_phone_number'],
      priceLevel: json['price_level'],
      deal: json['deal'] != null ? Deal.fromJson(json['deal']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'rating': rating,
      'address': address,
      'photoUrl': photoUrl,
      'description': description,
      'localTip': localTip,
      'handyPhrase': handyPhrase,
      'latitude': latitude,
      'longitude': longitude,
      'isOpenNow': isOpenNow,
      'website': website,
      'phoneNumber': phoneNumber,
      'priceLevel': priceLevel,
      'deal': deal?.toJson(),
    };
  }
}

@HiveType(typeId: 1)
class Deal extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String description;

  @HiveField(3)
  final String category;

  @HiveField(4)
  final String imageUrl;

  @HiveField(5)
  final double originalPrice;

  @HiveField(6)
  final double discountedPrice;

  @HiveField(7)
  final String currency;

  @HiveField(8)
  final DateTime validFrom;

  @HiveField(9)
  final DateTime validUntil;

  @HiveField(10)
  final String location;

  @HiveField(11)
  final Map<String, dynamic> details;

  @HiveField(12)
  final List<String> terms;

  @HiveField(13)
  final String providerName;

  @HiveField(14)
  final String discount;

  @HiveField(17)
  final String placeName;

  @HiveField(15)
  final String bookingLink;

  @HiveField(16)
  final bool isPremium;

  Deal({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.imageUrl,
    required this.discount,
    required this.placeName,
    required this.bookingLink,
    this.isPremium = false,
    required this.originalPrice,
    required this.discountedPrice,
    required this.currency,
    required this.validFrom,
    required this.validUntil,
    required this.location,
    required this.details,
    required this.terms,
    required this.providerName,
  });

  factory Deal.fromJson(Map<String, dynamic> json) {
    return Deal(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'general',
      imageUrl: json['imageUrl'] ?? '',
      discount: json['discount'] ?? '0%',
      placeName: json['placeName'] ?? '',
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