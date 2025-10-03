import 'package:hive/hive.dart';

part 'travel_style.g.dart';

@HiveType(typeId: 25)
enum TravelStyle {
  @HiveField(0)
  foodie,     // +40% restaurants, +20% cafes
  @HiveField(1)
  explorer,   // +40% attractions, +20% nature
  @HiveField(2)
  relaxer,    // +40% nature, +20% cafes, -20% nightlife
  @HiveField(3)
  nightOwl,   // +50% nightlife, +20% entertainment
  @HiveField(4)
  culture,    // +40% museums, +30% historic sites
  @HiveField(5)
  nature,     // +50% parks, +30% outdoor activities
}

extension TravelStyleExtension on TravelStyle {
  String get displayName {
    switch (this) {
      case TravelStyle.foodie:
        return 'Foodie';
      case TravelStyle.explorer:
        return 'Explorer';
      case TravelStyle.relaxer:
        return 'Relaxer';
      case TravelStyle.nightOwl:
        return 'Night Owl';
      case TravelStyle.culture:
        return 'Culture Lover';
      case TravelStyle.nature:
        return 'Nature Enthusiast';
    }
  }

  String get description {
    switch (this) {
      case TravelStyle.foodie:
        return 'Love trying local cuisine and discovering great restaurants';
      case TravelStyle.explorer:
        return 'Enjoy discovering new places and tourist attractions';
      case TravelStyle.relaxer:
        return 'Prefer peaceful places and relaxing experiences';
      case TravelStyle.nightOwl:
        return 'Love nightlife, bars, and evening entertainment';
      case TravelStyle.culture:
        return 'Fascinated by museums, history, and cultural sites';
      case TravelStyle.nature:
        return 'Drawn to parks, nature, and outdoor activities';
    }
  }

  String get emoji {
    switch (this) {
      case TravelStyle.foodie:
        return '🍽️';
      case TravelStyle.explorer:
        return '🗺️';
      case TravelStyle.relaxer:
        return '🧘';
      case TravelStyle.nightOwl:
        return '🌙';
      case TravelStyle.culture:
        return '🏛️';
      case TravelStyle.nature:
        return '🌿';
    }
  }

  Map<String, double> get placeWeights {
    switch (this) {
      case TravelStyle.foodie:
        return {
          'restaurants': 1.4,  // +40%
          'cafes': 1.2,        // +20%
          'food': 1.4,
        };
      case TravelStyle.explorer:
        return {
          'attractions': 1.4,  // +40%
          'nature': 1.2,       // +20%
          'landmarks': 1.3,
        };
      case TravelStyle.relaxer:
        return {
          'nature': 1.4,       // +40%
          'cafes': 1.2,        // +20%
          'nightlife': 0.8,    // -20%
          'bars': 0.8,
        };
      case TravelStyle.nightOwl:
        return {
          'nightlife': 1.5,    // +50%
          'bars': 1.5,
          'entertainment': 1.2, // +20%
        };
      case TravelStyle.culture:
        return {
          'culture': 1.4,      // +40%
          'museums': 1.4,
          'historic': 1.3,     // +30%
        };
      case TravelStyle.nature:
        return {
          'nature': 1.5,       // +50%
          'parks': 1.5,
          'outdoor': 1.3,      // +30%
        };
    }
  }
}