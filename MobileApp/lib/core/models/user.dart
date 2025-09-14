import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String username;
  final String email;
  final String? firebaseUid;
  final String tier;
  final String subscriptionStatus;
  final DateTime? subscriptionEndDate;
  final DateTime? trialEndDate;
  final String homeCurrency;
  final String language;
  final List<String> selectedInterests;
  final bool hasCompletedWizard;
  final bool isAdmin;
  final List<String> favoritePlaces;
  final String? profilePicture;
  final UserReputation reputation;
  final DateTime createdAt;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.firebaseUid,
    required this.tier,
    required this.subscriptionStatus,
    this.subscriptionEndDate,
    this.trialEndDate,
    required this.homeCurrency,
    required this.language,
    required this.selectedInterests,
    required this.hasCompletedWizard,
    required this.isAdmin,
    required this.favoritePlaces,
    this.profilePicture,
    required this.reputation,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class UserReputation {
  final int score;
  final String level;
  final int violations;
  final int contributions;

  UserReputation({
    required this.score,
    required this.level,
    required this.violations,
    required this.contributions,
  });

  factory UserReputation.fromJson(Map<String, dynamic> json) => _$UserReputationFromJson(json);
  Map<String, dynamic> toJson() => _$UserReputationToJson(this);
}