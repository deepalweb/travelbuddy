import '../models/place.dart';

class PlaceSorter {
  static List<Place> sort(List<Place> places, String sortBy, {double? userLat, double? userLng}) {
    final sorted = List<Place>.from(places);
    
    switch (sortBy) {
      case 'distance':
        if (userLat != null && userLng != null) {
          sorted.sort((a, b) {
            final distA = _getDistance(userLat, userLng, a.latitude ?? 0, a.longitude ?? 0);
            final distB = _getDistance(userLat, userLng, b.latitude ?? 0, b.longitude ?? 0);
            return distA.compareTo(distB);
          });
        }
        break;
      case 'popularity':
        sorted.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case 'rating':
      default:
        sorted.sort((a, b) => b.rating.compareTo(a.rating));
    }
    
    return sorted;
  }
  
  static double _getDistance(double lat1, double lng1, double lat2, double lng2) {
    const p = 0.017453292519943295;
    final a = 0.5 - 
        (((lat2 - lat1) * p).cos() / 2) +
        ((lat1 * p).cos() * (lat2 * p).cos() * (1 - ((lng2 - lng1) * p).cos()) / 2);
    return 12742 * (a.sqrt().asin());
  }
}
