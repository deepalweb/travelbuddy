// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String,
      firebaseUid: json['firebaseUid'] as String?,
      tier: json['tier'] as String,
      subscriptionStatus: json['subscriptionStatus'] as String,
      subscriptionEndDate: json['subscriptionEndDate'] == null
          ? null
          : DateTime.parse(json['subscriptionEndDate'] as String),
      trialEndDate: json['trialEndDate'] == null
          ? null
          : DateTime.parse(json['trialEndDate'] as String),
      homeCurrency: json['homeCurrency'] as String,
      language: json['language'] as String,
      selectedInterests: (json['selectedInterests'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      hasCompletedWizard: json['hasCompletedWizard'] as bool,
      isAdmin: json['isAdmin'] as bool,
      favoritePlaces: (json['favoritePlaces'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      profilePicture: json['profilePicture'] as String?,
      reputation:
          UserReputation.fromJson(json['reputation'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'email': instance.email,
      'firebaseUid': instance.firebaseUid,
      'tier': instance.tier,
      'subscriptionStatus': instance.subscriptionStatus,
      'subscriptionEndDate': instance.subscriptionEndDate?.toIso8601String(),
      'trialEndDate': instance.trialEndDate?.toIso8601String(),
      'homeCurrency': instance.homeCurrency,
      'language': instance.language,
      'selectedInterests': instance.selectedInterests,
      'hasCompletedWizard': instance.hasCompletedWizard,
      'isAdmin': instance.isAdmin,
      'favoritePlaces': instance.favoritePlaces,
      'profilePicture': instance.profilePicture,
      'reputation': instance.reputation,
      'createdAt': instance.createdAt.toIso8601String(),
    };

UserReputation _$UserReputationFromJson(Map<String, dynamic> json) =>
    UserReputation(
      score: (json['score'] as num).toInt(),
      level: json['level'] as String,
      violations: (json['violations'] as num).toInt(),
      contributions: (json['contributions'] as num).toInt(),
    );

Map<String, dynamic> _$UserReputationToJson(UserReputation instance) =>
    <String, dynamic>{
      'score': instance.score,
      'level': instance.level,
      'violations': instance.violations,
      'contributions': instance.contributions,
    };
