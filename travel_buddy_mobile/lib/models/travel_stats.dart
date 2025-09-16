class TravelStats {
  final int countriesVisited;
  final int citiesVisited;
  final int placesVisited;
  final int totalReviews;
  final int totalPhotos;
  final int helpfulVotes;
  final int postsShared;

  TravelStats({
    this.countriesVisited = 0,
    this.citiesVisited = 0,
    this.placesVisited = 0,
    this.totalReviews = 0,
    this.totalPhotos = 0,
    this.helpfulVotes = 0,
    this.postsShared = 0,
  });

  factory TravelStats.fromJson(Map<String, dynamic> json) {
    return TravelStats(
      countriesVisited: json['countriesVisited'] ?? 0,
      citiesVisited: json['citiesVisited'] ?? 0,
      placesVisited: json['placesVisited'] ?? 0,
      totalReviews: json['totalReviews'] ?? 0,
      totalPhotos: json['totalPhotos'] ?? 0,
      helpfulVotes: json['helpfulVotes'] ?? 0,
      postsShared: json['postsShared'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'countriesVisited': countriesVisited,
      'citiesVisited': citiesVisited,
      'placesVisited': placesVisited,
      'totalReviews': totalReviews,
      'totalPhotos': totalPhotos,
      'helpfulVotes': helpfulVotes,
      'postsShared': postsShared,
    };
  }
}
