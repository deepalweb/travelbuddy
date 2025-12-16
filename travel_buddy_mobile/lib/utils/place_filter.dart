import '../models/place.dart';

class PlaceFilter {
  static List<Place> applyQuickFilters(List<Place> places, Set<String> filters) {
    var filtered = places;
    
    if (filters.contains('open_now')) {
      filtered = filtered.where((p) => p.isOpenNow == true).toList();
    }
    
    if (filters.contains('top_rated')) {
      filtered = filtered.where((p) => p.rating >= 4.5).toList();
    }
    
    if (filters.contains('budget')) {
      filtered = filtered.where((p) => (p.priceLevel ?? 0) <= 2).toList();
    }
    
    return filtered;
  }
}
