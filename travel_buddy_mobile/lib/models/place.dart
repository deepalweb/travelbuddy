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
        // Use backend photo proxy endpoint
        photoUrl = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/places/photo?ref=${photo['photo_reference']}&maxWidth=800';
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
      isOpenNow: json['business_status'] == 'OPERATIONAL',
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

@HiveType(typeId: 20)
class PriceInfo extends HiveObject {
  @HiveField(0)
  final double amount;

  @HiveField(1)
  final String currencyCode;

  PriceInfo({
    required this.amount,
    required this.currencyCode,
  });

  factory PriceInfo.fromJson(Map<String, dynamic> json) {
    try {
      return PriceInfo(
        amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
        currencyCode: json['currencyCode']?.toString() ?? 'USD',
      );
    } catch (e) {
      print('Error parsing PriceInfo from JSON: $e');
      return PriceInfo(amount: 0.0, currencyCode: 'USD');
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'currencyCode': currencyCode,
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
  final String discount;

  @HiveField(4)
  final String placeName;

  @HiveField(5)
  final String businessType;

  @HiveField(6)
  final String businessName;

  @HiveField(7)
  final List<String> images;

  @HiveField(8)
  final DateTime validUntil;

  @HiveField(9)
  final bool isActive;

  @HiveField(10)
  final int views;

  @HiveField(11)
  final int claims;

  @HiveField(12)
  final String? merchantId;

  @HiveField(13)
  final PriceInfo? price;

  @HiveField(14)
  final bool isPremium;

  // Legacy fields for backward compatibility
  @HiveField(15)
  final String? category;

  @HiveField(16)
  final String? imageUrl;

  @HiveField(17)
  final double? originalPrice;

  @HiveField(18)
  final double? discountedPrice;

  @HiveField(19)
  final String? currency;
  
  @HiveField(20)
  final DealLocation? location;
  
  @HiveField(21)
  final String? businessAddress;
  
  @HiveField(22)
  final String? businessPhone;
  
  @HiveField(23)
  final String? businessWebsite;
  
  @HiveField(24)
  final ContactInfo? contactInfo;
  
  // Non-persisted field for distance calculation
  double? distance;

  Deal({
    required this.id,
    required this.title,
    required this.description,
    required this.discount,
    required this.placeName,
    required this.businessType,
    required this.businessName,
    required this.images,
    required this.validUntil,
    this.isActive = true,
    this.views = 0,
    this.claims = 0,
    this.merchantId,
    this.price,
    this.isPremium = false,
    // Legacy fields
    this.category,
    this.imageUrl,
    this.originalPrice,
    this.discountedPrice,
    this.currency,
    this.location,
    this.businessAddress,
    this.businessPhone,
    this.businessWebsite,
    this.contactInfo,
  });

  factory Deal.fromJson(Map<String, dynamic> json) {
    try {
      // Handle MongoDB _id field
      final String dealId = json['_id']?.toString() ?? json['id']?.toString() ?? '';
      
      // Parse validUntil date safely
      DateTime validUntilDate;
      try {
        validUntilDate = DateTime.parse(json['validUntil'] ?? DateTime.now().add(const Duration(days: 30)).toIso8601String());
      } catch (e) {
        validUntilDate = DateTime.now().add(const Duration(days: 30));
      }
      
      // Handle images array safely
      List<String> imagesList = [];
      if (json['images'] != null && json['images'] is List) {
        imagesList = List<String>.from(json['images']);
      } else if (json['imageUrl'] != null) {
        imagesList = [json['imageUrl'].toString()];
      }
      
      return Deal(
        id: dealId,
        title: json['title']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        discount: json['discount']?.toString() ?? '0%',
        placeName: json['placeName']?.toString() ?? json['businessName']?.toString() ?? '',
        businessType: json['businessType']?.toString() ?? json['category']?.toString() ?? 'general',
        businessName: json['businessName']?.toString() ?? json['placeName']?.toString() ?? '',
        images: imagesList,
        validUntil: validUntilDate,
        isActive: json['isActive'] ?? true,
        views: (json['views'] as num?)?.toInt() ?? 0,
        claims: (json['claims'] as num?)?.toInt() ?? 0,
        merchantId: json['merchantId']?.toString(),
        price: json['price'] != null ? PriceInfo.fromJson(json['price']) : null,
        isPremium: json['isPremium'] ?? false,
        // Legacy support
        category: json['category']?.toString(),
        imageUrl: json['imageUrl']?.toString(),
        originalPrice: _parsePrice(json['originalPrice']),
        discountedPrice: _parsePrice(json['discountedPrice']),
        currency: json['currency']?.toString(),
        location: json['location'] != null ? DealLocation.fromJson(json['location']) : null,
        businessAddress: json['businessAddress']?.toString(),
        businessPhone: json['businessPhone']?.toString(),
        businessWebsite: json['businessWebsite']?.toString(),
        contactInfo: json['contactInfo'] != null ? ContactInfo.fromJson(json['contactInfo']) : null,
      );
    } catch (e) {
      print('Error parsing Deal from JSON: $e');
      print('JSON data: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'discount': discount,
      'placeName': placeName,
      'businessType': businessType,
      'businessName': businessName,
      'images': images,
      'validUntil': validUntil.toIso8601String(),
      'isActive': isActive,
      'views': views,
      'claims': claims,
      'merchantId': merchantId,
      'price': price?.toJson(),
      'isPremium': isPremium,
      'location': location?.toJson(),
    };
  }
  
  static double? _parsePrice(dynamic price) {
    if (price == null) return null;
    if (price is num) return price.toDouble();
    if (price is String) {
      final numStr = price.replaceAll(RegExp(r'[^0-9.]'), '');
      return double.tryParse(numStr);
    }
    return null;
  }
}

@HiveType(typeId: 21)
class DealLocation extends HiveObject {
  @HiveField(0)
  final String type;
  
  @HiveField(1)
  final List<double> coordinates;
  
  @HiveField(2)
  final double? lat;
  
  @HiveField(3)
  final double? lng;
  
  DealLocation({
    required this.type,
    required this.coordinates,
    this.lat,
    this.lng,
  });
  
  factory DealLocation.fromJson(Map<String, dynamic> json) {
    // Handle nested coordinates structure from MongoDB
    List<double> coords;
    if (json['coordinates'] is Map) {
      // MongoDB format: {type: "Point", coordinates: [lng, lat]}
      final coordsMap = json['coordinates'] as Map<String, dynamic>;
      coords = List<double>.from(coordsMap['coordinates'] ?? [0.0, 0.0]);
    } else if (json['coordinates'] is List) {
      // Direct array format
      coords = List<double>.from(json['coordinates']);
    } else {
      coords = [0.0, 0.0];
    }
    
    return DealLocation(
      type: json['type'] ?? 'Point',
      coordinates: coords,
      lat: json['lat']?.toDouble(),
      lng: json['lng']?.toDouble(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'coordinates': coordinates,
      'lat': lat,
      'lng': lng,
    };
  }
}

@HiveType(typeId: 22)
class ContactInfo extends HiveObject {
  @HiveField(0)
  final String? website;
  
  @HiveField(1)
  final String? phone;
  
  @HiveField(2)
  final String? whatsapp;
  
  @HiveField(3)
  final String? facebook;
  
  @HiveField(4)
  final String? instagram;
  
  @HiveField(5)
  final String? email;
  
  ContactInfo({
    this.website,
    this.phone,
    this.whatsapp,
    this.facebook,
    this.instagram,
    this.email,
  });
  
  factory ContactInfo.fromJson(Map<String, dynamic> json) {
    return ContactInfo(
      website: json['website']?.toString(),
      phone: json['phone']?.toString(),
      whatsapp: json['whatsapp']?.toString(),
      facebook: json['facebook']?.toString(),
      instagram: json['instagram']?.toString(),
      email: json['email']?.toString(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'website': website,
      'phone': phone,
      'whatsapp': whatsapp,
      'facebook': facebook,
      'instagram': instagram,
      'email': email,
    };
  }
}