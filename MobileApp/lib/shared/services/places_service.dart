import '../../core/services/api_service.dart';
import '../../core/models/place.dart';
import '../../core/config/app_config.dart';

class PlacesService {
  final ApiService _apiService = ApiService();

  Future<List<Place>> getNearbyPlaces({
    required double lat,
    required double lng,
    String? query,
    int? radius,
  }) async {
    try {
      final queryParams = {
        'lat': lat.toString(),
        'lng': lng.toString(),
        if (query != null) 'q': query,
        if (radius != null) 'radius': radius.toString(),
      };

      final queryString = queryParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');

      final response = await _apiService.get('/places/nearby?$queryString');
      
      if (response is List) {
        return response.map((json) => Place.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      throw Exception('Failed to load nearby places: $e');
    }
  }

  Future<Map<String, dynamic>?> getPlaceDetails(String placeId) async {
    try {
      final response = await _apiService.get('/places/details?place_id=$placeId');
      return response;
    } catch (e) {
      throw Exception('Failed to load place details: $e');
    }
  }

  String getPhotoUrl(String photoReference, {int width = 400}) {
    return '${AppConfig.baseUrl}/places/photo?ref=$photoReference&w=$width';
  }
}