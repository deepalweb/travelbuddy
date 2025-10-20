import 'travel_enums.dart';
import 'travel_stats.dart';
import 'travel_badge.dart';

class UserProfile {
  final String userId;
  final String username;
  final String email;
  final String bio;
  final String profileImage;
  final List<TravelInterest> travelInterests;
  final TravelStats stats;
  final List<TravelBadge> badges;
  final List<String> favoritePlaceIds;
  final List<String> publicTripIds;
  final TravelerType travelerType;
  final DateTime joinedAt;
  final String currentLocation;
  final Map<String, dynamic>? preferences;
  final bool isVerified;
  final int followersCount;
  final int followingCount;
  final String subscriptionTier;

  UserProfile({
    required this.userId,
    required this.username,
    required this.email,
    this.bio = '',
    this.profileImage = '',
    this.travelInterests = const [],
    required this.stats,
    this.badges = const [],
    this.favoritePlaceIds = const [],
    this.publicTripIds = const [],
    this.travelerType = TravelerType.adventure,
    required this.joinedAt,
    this.currentLocation = '',
    this.preferences,
    this.isVerified = false,
    this.followersCount = 0,
    this.followingCount = 0,
    this.subscriptionTier = 'free',
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      userId: json['userId'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      bio: json['bio'] ?? '',
      profileImage: json['profileImage'] ?? '',
      travelInterests: (json['travelInterests'] as List<dynamic>?)
          ?.map((e) => TravelInterest.values.firstWhere(
                (interest) => interest.toString() == 'TravelInterest.$e',
                orElse: () => TravelInterest.adventure,
              ))
          .toList() ??
          [],
      stats: TravelStats.fromJson(json['stats'] ?? {}),
      badges: (json['badges'] as List<dynamic>?)
          ?.map((e) => TravelBadge.fromJson(e))
          .toList() ??
          [],
      favoritePlaceIds: List<String>.from(json['favoritePlaceIds'] ?? []),
      publicTripIds: List<String>.from(json['publicTripIds'] ?? []),
      travelerType: TravelerType.values.firstWhere(
        (e) => e.toString() == 'TravelerType.${json['travelerType']}',
        orElse: () => TravelerType.adventure,
      ),
      joinedAt: DateTime.parse(json['joinedAt'] ?? DateTime.now().toIso8601String()),
      currentLocation: json['currentLocation'] ?? '',
      preferences: json['preferences'],
      isVerified: json['isVerified'] ?? false,
      followersCount: json['followersCount'] ?? 0,
      followingCount: json['followingCount'] ?? 0,
      subscriptionTier: json['subscriptionTier'] ?? 'free',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'username': username,
      'email': email,
      'bio': bio,
      'profileImage': profileImage,
      'travelInterests': travelInterests
          .map((e) => e.toString().split('.').last)
          .toList(),
      'stats': stats.toJson(),
      'badges': badges.map((e) => e.toJson()).toList(),
      'favoritePlaceIds': favoritePlaceIds,
      'publicTripIds': publicTripIds,
      'travelerType': travelerType.toString().split('.').last,
      'joinedAt': joinedAt.toIso8601String(),
      'currentLocation': currentLocation,
      'preferences': preferences,
      'isVerified': isVerified,
      'followersCount': followersCount,
      'followingCount': followingCount,
      'subscriptionTier': subscriptionTier,
    };
  }

  UserProfile copyWith({
    String? userId,
    String? username,
    String? email,
    String? bio,
    String? profileImage,
    List<TravelInterest>? travelInterests,
    TravelStats? stats,
    List<TravelBadge>? badges,
    List<String>? favoritePlaceIds,
    List<String>? publicTripIds,
    TravelerType? travelerType,
    DateTime? joinedAt,
    String? currentLocation,
    Map<String, dynamic>? preferences,
    bool? isVerified,
    int? followersCount,
    int? followingCount,
    String? subscriptionTier,
  }) {
    return UserProfile(
      userId: userId ?? this.userId,
      username: username ?? this.username,
      email: email ?? this.email,
      bio: bio ?? this.bio,
      profileImage: profileImage ?? this.profileImage,
      travelInterests: travelInterests ?? this.travelInterests,
      stats: stats ?? this.stats,
      badges: badges ?? this.badges,
      favoritePlaceIds: favoritePlaceIds ?? this.favoritePlaceIds,
      publicTripIds: publicTripIds ?? this.publicTripIds,
      travelerType: travelerType ?? this.travelerType,
      joinedAt: joinedAt ?? this.joinedAt,
      currentLocation: currentLocation ?? this.currentLocation,
      preferences: preferences ?? this.preferences,
      isVerified: isVerified ?? this.isVerified,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
      subscriptionTier: subscriptionTier ?? this.subscriptionTier,
    );
  }
}
