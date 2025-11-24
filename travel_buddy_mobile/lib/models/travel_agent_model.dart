class TravelAgentModel {
  final String id;
  final String name;
  final String agency;
  final String photo;
  final String location;
  final List<String> specializations;
  final double rating;
  final int reviewCount;
  final List<String> languages;
  final bool verified;
  final int experience;
  final String description;
  final String phone;
  final String email;
  final String priceRange;
  final String responseTime;
  final int totalTrips;
  final List<String> trustBadges;
  final int profileCompletion;

  TravelAgentModel({
    required this.id,
    required this.name,
    required this.agency,
    required this.photo,
    required this.location,
    required this.specializations,
    required this.rating,
    required this.reviewCount,
    required this.languages,
    required this.verified,
    required this.experience,
    required this.description,
    required this.phone,
    required this.email,
    required this.priceRange,
    this.responseTime = '< 2 hours',
    this.totalTrips = 0,
    this.trustBadges = const [],
    this.profileCompletion = 85,
  });

  factory TravelAgentModel.fromJson(Map<String, dynamic> json) {
    return TravelAgentModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['ownerName']?.toString() ?? '',
      agency: json['agency']?.toString() ?? json['agencyName']?.toString() ?? '',
      photo: json['photo']?.toString() ?? json['profilePhoto']?.toString() ?? 'https://via.placeholder.com/150',
      location: json['location']?.toString() ?? json['address']?.toString() ?? '',
      specializations: List<String>.from(json['specializations'] ?? json['specialties'] ?? []),
      rating: (json['rating'] ?? 4.5).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
      languages: List<String>.from(json['languages'] ?? []),
      verified: json['verified'] ?? true,
      experience: json['experience'] ?? json['experienceYears'] != null ? int.tryParse(json['experienceYears'].toString()) ?? 0 : 0,
      description: json['description']?.toString() ?? json['about']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      priceRange: json['priceRange']?.toString() ?? '\$50-150/day',
      responseTime: json['responseTime']?.toString() ?? '< 2 hours',
      totalTrips: json['totalTrips'] ?? 0,
      trustBadges: List<String>.from(json['trustBadges'] ?? []),
      profileCompletion: json['profileCompletion'] ?? 85,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'agency': agency,
      'photo': photo,
      'location': location,
      'specializations': specializations,
      'rating': rating,
      'reviewCount': reviewCount,
      'languages': languages,
      'verified': verified,
      'experience': experience,
      'description': description,
      'phone': phone,
      'email': email,
      'priceRange': priceRange,
      'responseTime': responseTime,
      'totalTrips': totalTrips,
      'trustBadges': trustBadges,
      'profileCompletion': profileCompletion,
    };
  }
}
