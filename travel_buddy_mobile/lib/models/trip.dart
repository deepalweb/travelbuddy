import 'package:hive/hive.dart';

part 'trip.g.dart';

@HiveType(typeId: 3)
class TripPlan extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String tripTitle;

  @HiveField(2)
  final String destination;

  @HiveField(3)
  final String duration;

  @HiveField(4)
  final String introduction;

  @HiveField(5)
  final List<DailyTripPlan> dailyPlans;

  @HiveField(6)
  final String conclusion;

  @HiveField(7)
  final List<String>? accommodationSuggestions;

  @HiveField(8)
  final List<String>? transportationTips;

  @HiveField(9)
  final String? budgetConsiderations;

  TripPlan({
    required this.id,
    required this.tripTitle,
    required this.destination,
    required this.duration,
    required this.introduction,
    required this.dailyPlans,
    required this.conclusion,
    this.accommodationSuggestions,
    this.transportationTips,
    this.budgetConsiderations,
  });

  factory TripPlan.fromJson(Map<String, dynamic> json) {
    return TripPlan(
      id: json['id'] ?? '',
      tripTitle: json['tripTitle'] ?? '',
      destination: json['destination'] ?? '',
      duration: json['duration'] ?? '',
      introduction: json['introduction'] ?? '',
      dailyPlans: (json['dailyPlans'] as List?)
              ?.map((e) => DailyTripPlan.fromJson(e))
              .toList() ??
          [],
      conclusion: json['conclusion'] ?? '',
      accommodationSuggestions: (json['accommodationSuggestions'] as List?)
          ?.map((e) => e.toString())
          .toList(),
      transportationTips:
          (json['transportationTips'] as List?)?.map((e) => e.toString()).toList(),
      budgetConsiderations: json['budgetConsiderations'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tripTitle': tripTitle,
      'destination': destination,
      'duration': duration,
      'introduction': introduction,
      'dailyPlans': dailyPlans.map((e) => e.toJson()).toList(),
      'conclusion': conclusion,
      'accommodationSuggestions': accommodationSuggestions,
      'transportationTips': transportationTips,
      'budgetConsiderations': budgetConsiderations,
    };
  }
}

@HiveType(typeId: 4)
class DailyTripPlan extends HiveObject {
  @HiveField(0)
  final int day;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String? theme;

  @HiveField(3)
  final List<ActivityDetail> activities;

  @HiveField(4)
  final String? photoUrl;

  DailyTripPlan({
    required this.day,
    required this.title,
    this.theme,
    required this.activities,
    this.photoUrl,
  });

  factory DailyTripPlan.fromJson(Map<String, dynamic> json) {
    return DailyTripPlan(
      day: json['day'] ?? 0,
      title: json['title'] ?? '',
      theme: json['theme'],
      activities: (json['activities'] as List?)
              ?.map((e) => ActivityDetail.fromJson(e))
              .toList() ??
          [],
      photoUrl: json['photoUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'day': day,
      'title': title,
      'theme': theme,
      'activities': activities.map((e) => e.toJson()).toList(),
      'photoUrl': photoUrl,
    };
  }
}

@HiveType(typeId: 5)
class ActivityDetail extends HiveObject {
  @HiveField(0)
  final String timeOfDay;

  @HiveField(1)
  final String activityTitle;

  @HiveField(2)
  final String description;

  @HiveField(3)
  final String? estimatedDuration;

  @HiveField(4)
  final String? location;

  @HiveField(5)
  final String? notes;

  @HiveField(6)
  final String? icon;

  @HiveField(7)
  final String? category;

  ActivityDetail({
    required this.timeOfDay,
    required this.activityTitle,
    required this.description,
    this.estimatedDuration,
    this.location,
    this.notes,
    this.icon,
    this.category,
  });

  factory ActivityDetail.fromJson(Map<String, dynamic> json) {
    return ActivityDetail(
      timeOfDay: json['timeOfDay'] ?? '',
      activityTitle: json['activityTitle'] ?? '',
      description: json['description'] ?? '',
      estimatedDuration: json['estimatedDuration'],
      location: json['location'],
      notes: json['notes'],
      icon: json['icon'],
      category: json['category'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'timeOfDay': timeOfDay,
      'activityTitle': activityTitle,
      'description': description,
      'estimatedDuration': estimatedDuration,
      'location': location,
      'notes': notes,
      'icon': icon,
      'category': category,
    };
  }
}

@HiveType(typeId: 6)
class OneDayItinerary extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String introduction;

  @HiveField(3)
  final List<ActivityDetail> dailyPlan;

  @HiveField(4)
  final String conclusion;

  @HiveField(5)
  final List<String> travelTips;

  OneDayItinerary({
    required this.id,
    required this.title,
    required this.introduction,
    required this.dailyPlan,
    required this.conclusion,
    this.travelTips = const [],
  });

  factory OneDayItinerary.fromJson(Map<String, dynamic> json) {
    return OneDayItinerary(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      introduction: json['introduction'] ?? '',
      dailyPlan: (json['dailyPlan'] as List?)
              ?.map((e) => ActivityDetail.fromJson(e))
              .toList() ??
          [],
      conclusion: json['conclusion'] ?? '',
      travelTips:
          (json['travelTips'] as List?)?.map((e) => e.toString()).toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'introduction': introduction,
      'dailyPlan': dailyPlan.map((e) => e.toJson()).toList(),
      'conclusion': conclusion,
      'travelTips': travelTips,
    };
  }
}