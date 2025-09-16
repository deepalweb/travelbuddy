import 'package:hive/hive.dart';

part 'user.g.dart';

@HiveType(typeId: 7)
enum SubscriptionStatus {
  @HiveField(0)
  none,
  @HiveField(1)
  trial,
  @HiveField(2)
  active,
  @HiveField(3)
  expired,
  @HiveField(4)
  canceled,
}

@HiveType(typeId: 8)
enum SubscriptionTier {
  @HiveField(0)
  free,
  @HiveField(1)
  basic,
  @HiveField(2)
  premium,
  @HiveField(3)
  pro,
}

@HiveType(typeId: 9)
enum UserInterest {
  @HiveField(0)
  adventure,
  @HiveField(1)
  history,
  @HiveField(2)
  foodie,
  @HiveField(3)
  artCulture,
  @HiveField(4)
  natureOutdoors,
  @HiveField(5)
  shopping,
  @HiveField(6)
  nightlife,
  @HiveField(7)
  relaxationWellness,
}

@HiveType(typeId: 2)
class CurrentUser extends HiveObject {
  @HiveField(0)
  final String? username;

  @HiveField(1)
  final String? email;

  @HiveField(2)
  final bool isAdmin;

  @HiveField(3)
  final SubscriptionStatus subscriptionStatus;

  @HiveField(4)
  final SubscriptionTier tier;

  @HiveField(5)
  final String? trialEndDate;

  @HiveField(6)
  final String? subscriptionEndDate;

  @HiveField(7)
  final String? homeCurrency;

  @HiveField(8)
  final String? language;

  @HiveField(9)
  final List<UserInterest>? selectedInterests;

  @HiveField(10)
  final bool hasCompletedWizard;

  @HiveField(11)
  final String? mongoId;

  @HiveField(12)
  final String? profilePicture;

  @HiveField(13)
  final String? uid;

  CurrentUser({
    this.username,
    this.uid,
    this.email,
    this.isAdmin = false,
    this.subscriptionStatus = SubscriptionStatus.none,
    this.tier = SubscriptionTier.free,
    this.trialEndDate,
    this.subscriptionEndDate,
    this.homeCurrency = 'USD',
    this.language = 'en',
    this.selectedInterests = const [],
    this.hasCompletedWizard = false,
    this.mongoId,
    this.profilePicture,
  });

  factory CurrentUser.fromJson(Map<String, dynamic> json) {
    return CurrentUser(
      username: json['username'] ?? '',
      uid: json['uid'] ?? json['_id'] ?? '', // Support both formats for compatibility
      email: json['email'],
      isAdmin: json['isAdmin'] ?? false,
      subscriptionStatus: SubscriptionStatus.values.firstWhere(
        (e) => e.name == json['subscriptionStatus'],
        orElse: () => SubscriptionStatus.none,
      ),
      tier: SubscriptionTier.values.firstWhere(
        (e) => e.name == json['tier'],
        orElse: () => SubscriptionTier.free,
      ),
      trialEndDate: json['trialEndDate'],
      subscriptionEndDate: json['subscriptionEndDate'],
      homeCurrency: json['homeCurrency'] ?? 'USD',
      language: json['language'] ?? 'en',
      selectedInterests: (json['selectedInterests'] as List?)
              ?.map((e) => UserInterest.values.firstWhere(
                    (interest) => interest.name == e,
                    orElse: () => UserInterest.adventure,
                  ))
              .toList() ??
          [],
      hasCompletedWizard: json['hasCompletedWizard'] ?? false,
      mongoId: json['mongoId'],
      profilePicture: json['profilePicture'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'email': email,
      'isAdmin': isAdmin,
      'subscriptionStatus': subscriptionStatus.name,
      'tier': tier.name,
      'trialEndDate': trialEndDate,
      'subscriptionEndDate': subscriptionEndDate,
      'homeCurrency': homeCurrency,
      'language': language,
      'selectedInterests': selectedInterests?.map((e) => e.name).toList(),
      'hasCompletedWizard': hasCompletedWizard,
      'mongoId': mongoId,
      'profilePicture': profilePicture,
      'uid': uid,
    };
  }

  CurrentUser copyWith({
    String? username,
    String? email,
    bool? isAdmin,
    SubscriptionStatus? subscriptionStatus,
    SubscriptionTier? tier,
    String? trialEndDate,
    String? subscriptionEndDate,
    String? homeCurrency,
    String? language,
    List<UserInterest>? selectedInterests,
    bool? hasCompletedWizard,
    String? mongoId,
    String? profilePicture,
    String? uid,
  }) {
    return CurrentUser(
      username: username ?? this.username,
      email: email ?? this.email,
      isAdmin: isAdmin ?? this.isAdmin,
      subscriptionStatus: subscriptionStatus ?? this.subscriptionStatus,
      tier: tier ?? this.tier,
      trialEndDate: trialEndDate ?? this.trialEndDate,
      subscriptionEndDate: subscriptionEndDate ?? this.subscriptionEndDate,
      homeCurrency: homeCurrency ?? this.homeCurrency,
      language: language ?? this.language,
      selectedInterests: selectedInterests ?? this.selectedInterests,
      hasCompletedWizard: hasCompletedWizard ?? this.hasCompletedWizard,
      mongoId: mongoId ?? this.mongoId,
      profilePicture: profilePicture ?? this.profilePicture,
      uid: uid ?? this.uid,
    );
  }
}