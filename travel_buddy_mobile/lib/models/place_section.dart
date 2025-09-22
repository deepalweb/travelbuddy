import 'place.dart';

class PlaceSection {
  final String id;
  final String title;
  final String subtitle;
  final String emoji;
  final List<Place> places;
  final String category;
  final bool hasMore;
  final int currentPage;
  final String query;

  PlaceSection({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.emoji,
    required this.places,
    required this.category,
    this.hasMore = true,
    this.currentPage = 1,
    required this.query,
  });

  PlaceSection copyWith({
    String? id,
    String? title,
    String? subtitle,
    String? emoji,
    List<Place>? places,
    String? category,
    bool? hasMore,
    int? currentPage,
    String? query,
  }) {
    return PlaceSection(
      id: id ?? this.id,
      title: title ?? this.title,
      subtitle: subtitle ?? this.subtitle,
      emoji: emoji ?? this.emoji,
      places: places ?? this.places,
      category: category ?? this.category,
      hasMore: hasMore ?? this.hasMore,
      currentPage: currentPage ?? this.currentPage,
      query: query ?? this.query,
    );
  }
}