class TravelStats {
  final int placesVisitedThisMonth;
  final double totalDistanceKm;
  final String favoriteCategory;
  final int currentStreak;
  final int totalPlacesVisited;

  TravelStats({
    required this.placesVisitedThisMonth,
    required this.totalDistanceKm,
    required this.favoriteCategory,
    required this.currentStreak,
    required this.totalPlacesVisited,
  });

  factory TravelStats.fromJson(Map<String, dynamic> json) {
    return TravelStats(
      placesVisitedThisMonth: json['placesVisitedThisMonth'] ?? 0,
      totalDistanceKm: (json['totalDistanceKm'] ?? 0.0).toDouble(),
      favoriteCategory: json['favoriteCategory'] ?? 'Attractions',
      currentStreak: json['currentStreak'] ?? 0,
      totalPlacesVisited: json['totalPlacesVisited'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'placesVisitedThisMonth': placesVisitedThisMonth,
      'totalDistanceKm': totalDistanceKm,
      'favoriteCategory': favoriteCategory,
      'currentStreak': currentStreak,
      'totalPlacesVisited': totalPlacesVisited,
    };
  }

  // Generate mock stats for demo
  factory TravelStats.mock() {
    return TravelStats(
      placesVisitedThisMonth: 12,
      totalDistanceKm: 245.8,
      favoriteCategory: 'Restaurants',
      currentStreak: 7,
      totalPlacesVisited: 89,
    );
  }
}