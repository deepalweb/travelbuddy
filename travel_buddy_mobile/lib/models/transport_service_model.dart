class TransportServiceModel {
  final String id;
  final String providerId;
  final String companyName;
  final String vehicleType;
  final String route;
  final String fromLocation;
  final String toLocation;
  final double price;
  final String duration;
  final String departure;
  final String arrival;
  final int availableSeats;
  final int totalSeats;
  final List<String> amenities;
  final double rating;
  final int reviewCount;
  final String image;
  final String description;
  final String phone;
  final String email;
  final bool isVerified;
  final bool isLive;
  final bool aiRecommended;
  final bool popularRoute;
  final bool instantBooking;
  final bool refundable;
  final bool ecoFriendly;
  final List<String> driverLanguages;
  final bool insuranceIncluded;
  final String lastUpdated;

  TransportServiceModel({
    required this.id,
    required this.providerId,
    required this.companyName,
    required this.vehicleType,
    required this.route,
    required this.fromLocation,
    required this.toLocation,
    required this.price,
    required this.duration,
    required this.departure,
    required this.arrival,
    required this.availableSeats,
    required this.totalSeats,
    required this.amenities,
    required this.rating,
    required this.reviewCount,
    required this.image,
    required this.description,
    required this.phone,
    required this.email,
    this.isVerified = false,
    this.isLive = false,
    this.aiRecommended = false,
    this.popularRoute = false,
    this.instantBooking = false,
    this.refundable = false,
    this.ecoFriendly = false,
    this.driverLanguages = const [],
    this.insuranceIncluded = false,
    this.lastUpdated = '',
  });

  factory TransportServiceModel.fromJson(Map<String, dynamic> json) {
    return TransportServiceModel(
      id: json['id']?.toString() ?? '',
      providerId: json['providerId']?.toString() ?? '',
      companyName: json['companyName']?.toString() ?? '',
      vehicleType: json['vehicleType']?.toString() ?? '',
      route: json['route']?.toString() ?? '',
      fromLocation: json['fromLocation']?.toString() ?? '',
      toLocation: json['toLocation']?.toString() ?? '',
      price: (json['price'] ?? 0).toDouble(),
      duration: json['duration']?.toString() ?? '',
      departure: json['departure']?.toString() ?? '',
      arrival: json['arrival']?.toString() ?? '',
      availableSeats: json['availableSeats'] ?? 0,
      totalSeats: json['totalSeats'] ?? 0,
      amenities: List<String>.from(json['amenities'] ?? []),
      rating: (json['rating'] ?? 0).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
      image: json['image']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      isVerified: json['isVerified'] ?? false,
      isLive: json['isLive'] ?? false,
      aiRecommended: json['aiRecommended'] ?? false,
      popularRoute: json['popularRoute'] ?? false,
      instantBooking: json['instantBooking'] ?? false,
      refundable: json['refundable'] ?? false,
      ecoFriendly: json['ecoFriendly'] ?? false,
      driverLanguages: List<String>.from(json['driverLanguages'] ?? []),
      insuranceIncluded: json['insuranceIncluded'] ?? false,
      lastUpdated: json['lastUpdated']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'providerId': providerId,
      'companyName': companyName,
      'vehicleType': vehicleType,
      'route': route,
      'fromLocation': fromLocation,
      'toLocation': toLocation,
      'price': price,
      'duration': duration,
      'departure': departure,
      'arrival': arrival,
      'availableSeats': availableSeats,
      'totalSeats': totalSeats,
      'amenities': amenities,
      'rating': rating,
      'reviewCount': reviewCount,
      'image': image,
      'description': description,
      'phone': phone,
      'email': email,
      'isVerified': isVerified,
      'isLive': isLive,
      'aiRecommended': aiRecommended,
      'popularRoute': popularRoute,
      'instantBooking': instantBooking,
      'refundable': refundable,
      'ecoFriendly': ecoFriendly,
      'driverLanguages': driverLanguages,
      'insuranceIncluded': insuranceIncluded,
      'lastUpdated': lastUpdated,
    };
  }

  TransportServiceModel copyWith({
    String? id,
    String? providerId,
    String? companyName,
    String? vehicleType,
    String? route,
    String? fromLocation,
    String? toLocation,
    double? price,
    String? duration,
    String? departure,
    String? arrival,
    int? availableSeats,
    int? totalSeats,
    List<String>? amenities,
    double? rating,
    int? reviewCount,
    String? image,
    String? description,
    String? phone,
    String? email,
    bool? isVerified,
    bool? isLive,
    bool? aiRecommended,
    bool? popularRoute,
    bool? instantBooking,
    bool? refundable,
    bool? ecoFriendly,
    List<String>? driverLanguages,
    bool? insuranceIncluded,
    String? lastUpdated,
  }) {
    return TransportServiceModel(
      id: id ?? this.id,
      providerId: providerId ?? this.providerId,
      companyName: companyName ?? this.companyName,
      vehicleType: vehicleType ?? this.vehicleType,
      route: route ?? this.route,
      fromLocation: fromLocation ?? this.fromLocation,
      toLocation: toLocation ?? this.toLocation,
      price: price ?? this.price,
      duration: duration ?? this.duration,
      departure: departure ?? this.departure,
      arrival: arrival ?? this.arrival,
      availableSeats: availableSeats ?? this.availableSeats,
      totalSeats: totalSeats ?? this.totalSeats,
      amenities: amenities ?? this.amenities,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      image: image ?? this.image,
      description: description ?? this.description,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      isVerified: isVerified ?? this.isVerified,
      isLive: isLive ?? this.isLive,
      aiRecommended: aiRecommended ?? this.aiRecommended,
      popularRoute: popularRoute ?? this.popularRoute,
      instantBooking: instantBooking ?? this.instantBooking,
      refundable: refundable ?? this.refundable,
      ecoFriendly: ecoFriendly ?? this.ecoFriendly,
      driverLanguages: driverLanguages ?? this.driverLanguages,
      insuranceIncluded: insuranceIncluded ?? this.insuranceIncluded,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  @override
  String toString() {
    return 'TransportServiceModel(id: $id, companyName: $companyName, route: $route, price: $price)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TransportServiceModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}