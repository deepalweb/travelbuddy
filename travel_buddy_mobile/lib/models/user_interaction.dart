import 'package:hive/hive.dart';

// part 'user_interaction.g.dart'; // Will be generated

// @HiveType(typeId: 10)
enum InteractionType {
  // @HiveField(0)
  placeViewed,
  // @HiveField(1)
  placeFavorited,
  // @HiveField(2)
  placeAddedToTrip,
  // @HiveField(3)
  placeDetailsOpened,
  // @HiveField(4)
  categorySelected,
  // @HiveField(5)
  searchPerformed,
  // @HiveField(6)
  placeUnfavorited,
}

// @HiveType(typeId: 11)
class UserInteraction {
  // @HiveField(0)
  final String id;

  // @HiveField(1)
  final InteractionType type;

  // @HiveField(2)
  final String? placeId;

  // @HiveField(3)
  final String? placeName;

  // @HiveField(4)
  final String? placeType;

  // @HiveField(5)
  final String? category;

  // @HiveField(6)
  final String? searchQuery;

  // @HiveField(7)
  final DateTime timestamp;

  // @HiveField(8)
  final Map<String, dynamic>? metadata;

  UserInteraction({
    required this.id,
    required this.type,
    this.placeId,
    this.placeName,
    this.placeType,
    this.category,
    this.searchQuery,
    required this.timestamp,
    this.metadata,
  });

  factory UserInteraction.placeViewed({
    required String placeId,
    required String placeName,
    required String placeType,
  }) {
    return UserInteraction(
      id: '${DateTime.now().millisecondsSinceEpoch}_place_viewed',
      type: InteractionType.placeViewed,
      placeId: placeId,
      placeName: placeName,
      placeType: placeType,
      timestamp: DateTime.now(),
    );
  }

  factory UserInteraction.placeFavorited({
    required String placeId,
    required String placeName,
    required String placeType,
  }) {
    return UserInteraction(
      id: '${DateTime.now().millisecondsSinceEpoch}_place_favorited',
      type: InteractionType.placeFavorited,
      placeId: placeId,
      placeName: placeName,
      placeType: placeType,
      timestamp: DateTime.now(),
    );
  }

  factory UserInteraction.categorySelected({
    required String category,
  }) {
    return UserInteraction(
      id: '${DateTime.now().millisecondsSinceEpoch}_category_selected',
      type: InteractionType.categorySelected,
      category: category,
      timestamp: DateTime.now(),
    );
  }

  factory UserInteraction.searchPerformed({
    required String searchQuery,
  }) {
    return UserInteraction(
      id: '${DateTime.now().millisecondsSinceEpoch}_search_performed',
      type: InteractionType.searchPerformed,
      searchQuery: searchQuery,
      timestamp: DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'placeId': placeId,
      'placeName': placeName,
      'placeType': placeType,
      'category': category,
      'searchQuery': searchQuery,
      'timestamp': timestamp.toIso8601String(),
      'metadata': metadata,
    };
  }
}