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
  
  // Enhanced fields
  @HiveField(10)
  final int durationDays;
  
  @HiveField(11)
  final String totalEstimatedCost;
  
  @HiveField(12)
  final String estimatedWalkingDistance;
  
  @HiveField(13)
  final String? mapPolyline;
  
  @HiveField(14)
  final Map<String, dynamic>? metadata;

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
    this.durationDays = 1,
    this.totalEstimatedCost = '€0',
    this.estimatedWalkingDistance = '0 km',
    this.mapPolyline,
    this.metadata,
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
  
  // Enhanced fields
  @HiveField(5)
  final String dayEstimatedCost;
  
  @HiveField(6)
  final String dayWalkingDistance;
  
  // Structured output fields
  @HiveField(7)
  final String date;
  
  @HiveField(8)
  final String summary;
  
  @HiveField(9)
  final String totalWalkingTime;
  
  @HiveField(10)
  final String totalTravelTime;
  
  @HiveField(11)
  final String dailyRecap;

  DailyTripPlan({
    required this.day,
    required this.title,
    this.theme,
    required this.activities,
    this.photoUrl,
    this.dayEstimatedCost = '€0',
    this.dayWalkingDistance = '0 km',
    this.date = '',
    this.summary = '',
    this.totalWalkingTime = '0 min',
    this.totalTravelTime = '0 min',
    this.dailyRecap = '',
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
  
  // Enhanced fields
  @HiveField(8)
  final String startTime;
  
  @HiveField(9)
  final String endTime;
  
  @HiveField(10)
  final String duration;
  
  @HiveField(11)
  final PlaceInfo? place;
  
  @HiveField(12)
  final String type;
  
  @HiveField(13)
  final String estimatedCost;
  
  @HiveField(14)
  final Map<String, String>? costBreakdown;
  
  @HiveField(15)
  final TransportInfo? transportFromPrev;
  
  @HiveField(16)
  final List<String>? tips;
  
  @HiveField(17)
  final WeatherBackup? weatherBackup;
  
  @HiveField(18)
  final String crowdLevel;
  
  @HiveField(19)
  final String? imageURL;
  
  @HiveField(20)
  final Map<String, String>? bookingLinks;
  
  // Google Places Integration
  @HiveField(21)
  final String? googlePlaceId;
  
  @HiveField(22)
  final String? highlight;
  
  @HiveField(23)
  final String? socialProof;
  
  @HiveField(24)
  final double? rating;
  
  @HiveField(25)
  final int? userRatingsTotal;
  
  @HiveField(26)
  final String? practicalTip;
  
  @HiveField(27)
  final String travelMode;
  
  @HiveField(28)
  final int travelTimeMin;
  
  @HiveField(29)
  final int estimatedVisitDurationMin;
  
  // Structured display fields
  @HiveField(30)
  final String? photoThumbnail;
  
  @HiveField(31)
  final String? fullAddress;
  
  @HiveField(32)
  final String? openingHours;
  
  @HiveField(33)
  final bool isOpenNow;
  
  @HiveField(34)
  final String? weatherNote;
  
  @HiveField(35)
  final List<String> tags;
  
  @HiveField(36)
  final String? bookingLink;

  ActivityDetail({
    required this.timeOfDay,
    required this.activityTitle,
    required this.description,
    this.estimatedDuration,
    this.location,
    this.notes,
    this.icon,
    this.category,
    this.startTime = '09:00',
    this.endTime = '10:00',
    this.duration = '1h',
    this.place,
    this.type = 'other',
    this.estimatedCost = '€0',
    this.costBreakdown,
    this.transportFromPrev,
    this.tips,
    this.weatherBackup,
    this.crowdLevel = 'Moderate',
    this.imageURL,
    this.bookingLinks,
    // Google Places fields
    this.googlePlaceId,
    this.highlight,
    this.socialProof,
    this.rating,
    this.userRatingsTotal,
    this.practicalTip,
    this.travelMode = 'walking',
    this.travelTimeMin = 0,
    this.estimatedVisitDurationMin = 60,
    // Display fields
    this.photoThumbnail,
    this.fullAddress,
    this.openingHours,
    this.isOpenNow = false,
    this.weatherNote,
    this.tags = const [],
    this.bookingLink,
  });

  factory ActivityDetail.fromJson(Map<String, dynamic> json) {
    return ActivityDetail(
      timeOfDay: json['timeOfDay'] ?? json['start_time'] ?? '',
      activityTitle: json['activityTitle'] ?? json['name'] ?? '',
      description: json['description'] ?? '',
      estimatedDuration: json['estimatedDuration'],
      location: json['location'],
      notes: json['notes'],
      icon: json['icon'],
      category: json['category'],
      startTime: json['start_time'] ?? '09:00',
      endTime: json['end_time'] ?? '10:00',
      // Google Places fields
      googlePlaceId: json['google_place_id'],
      highlight: json['highlight'],
      socialProof: json['social_proof'],
      rating: json['rating']?.toDouble(),
      userRatingsTotal: json['user_ratings_total'],
      practicalTip: json['practical_tip'],
      travelMode: json['travel_mode'] ?? 'walking',
      travelTimeMin: json['travel_time_min'] ?? 0,
      estimatedVisitDurationMin: json['estimated_visit_duration_min'] ?? 60,
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
      'start_time': startTime,
      'end_time': endTime,
      'google_place_id': googlePlaceId,
      'highlight': highlight,
      'social_proof': socialProof,
      'rating': rating,
      'user_ratings_total': userRatingsTotal,
      'practical_tip': practicalTip,
      'travel_mode': travelMode,
      'travel_time_min': travelTimeMin,
      'estimated_visit_duration_min': estimatedVisitDurationMin,
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

@HiveType(typeId: 7)
class PlaceInfo extends HiveObject {
  @HiveField(0)
  final String? placeId;
  
  @HiveField(1)
  final String name;
  
  @HiveField(2)
  final String address;
  
  @HiveField(3)
  final Coordinates coords;
  
  PlaceInfo({
    this.placeId,
    required this.name,
    required this.address,
    required this.coords,
  });
  
  factory PlaceInfo.fromJson(Map<String, dynamic> json) {
    return PlaceInfo(
      placeId: json['place_id'],
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      coords: Coordinates.fromJson(json['coords'] ?? {}),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'place_id': placeId,
      'name': name,
      'address': address,
      'coords': coords.toJson(),
    };
  }
}

@HiveType(typeId: 8)
class Coordinates extends HiveObject {
  @HiveField(0)
  final double lat;
  
  @HiveField(1)
  final double lng;
  
  Coordinates({
    required this.lat,
    required this.lng,
  });
  
  factory Coordinates.fromJson(Map<String, dynamic> json) {
    return Coordinates(
      lat: (json['lat'] ?? 0.0).toDouble(),
      lng: (json['lng'] ?? 0.0).toDouble(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'lat': lat,
      'lng': lng,
    };
  }
}

@HiveType(typeId: 9)
class TransportInfo extends HiveObject {
  @HiveField(0)
  final String mode;
  
  @HiveField(1)
  final String duration;
  
  @HiveField(2)
  final String distance;
  
  @HiveField(3)
  final String cost;
  
  @HiveField(4)
  final String instructions;
  
  TransportInfo({
    required this.mode,
    required this.duration,
    required this.distance,
    required this.cost,
    required this.instructions,
  });
  
  factory TransportInfo.fromJson(Map<String, dynamic> json) {
    return TransportInfo(
      mode: json['mode'] ?? 'walk',
      duration: json['duration'] ?? '0 min',
      distance: json['distance'] ?? '0 km',
      cost: json['cost'] ?? '€0',
      instructions: json['instructions'] ?? '',
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'mode': mode,
      'duration': duration,
      'distance': distance,
      'cost': cost,
      'instructions': instructions,
    };
  }
}

@HiveType(typeId: 10)
class WeatherBackup extends HiveObject {
  @HiveField(0)
  final String title;
  
  @HiveField(1)
  final String reason;
  
  WeatherBackup({
    required this.title,
    required this.reason,
  });
  
  factory WeatherBackup.fromJson(Map<String, dynamic> json) {
    return WeatherBackup(
      title: json['title'] ?? '',
      reason: json['reason'] ?? '',
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'reason': reason,
    };
  }
}