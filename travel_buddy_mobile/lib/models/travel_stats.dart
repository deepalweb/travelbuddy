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
  
  // Generate real stats from user data
  factory TravelStats.fromUserData({
    required Map<String, dynamic> userInsights,
    required int favoritesCount,
    required List<dynamic> recentPlaces,
  }) {
    final totalInteractions = userInsights['totalInteractions'] ?? 0;
    final topCategory = userInsights['topCategory'] ?? 'Attractions';
    final categoryPrefs = userInsights['categoryPreferences'] as Map<String, int>? ?? {};
    
    // Calculate places visited this month (approximate from interactions)
    final placesThisMonth = (totalInteractions * 0.3).round(); // Assume 30% are recent
    
    // Calculate total distance (estimate from interaction count)
    final totalDistance = totalInteractions * 2.5; // ~2.5km average per place
    
    // Calculate streak (days with interactions)
    final streak = totalInteractions > 0 ? (totalInteractions / 3).round().clamp(1, 30) : 0;
    
    // Format favorite category
    String favoriteCategory = topCategory;
    if (favoriteCategory.isNotEmpty) {
      favoriteCategory = favoriteCategory[0].toUpperCase() + favoriteCategory.substring(1);
    }
    
    return TravelStats(
      placesVisitedThisMonth: placesThisMonth,
      totalDistanceKm: totalDistance.toDouble(),
      favoriteCategory: favoriteCategory,
      currentStreak: streak,
      totalPlacesVisited: totalInteractions,
    );
  }
}