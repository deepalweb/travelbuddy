import 'package:flutter/foundation.dart';
import '../models/place.dart';
import '../services/places_service.dart';

class PlacesProvider with ChangeNotifier {
  final PlacesService _placesService = PlacesService();
  List<Place> _nearbyPlaces = [];
  List<Place> _favoritePlaces = [];
  bool _isLoading = false;
  String? _error;

  List<Place> get nearbyPlaces => _nearbyPlaces;
  List<Place> get favoritePlaces => _favoritePlaces;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchNearbyPlaces({
    required double latitude,
    required double longitude,
  }) async {
    _setLoading(true);
    try {
      _nearbyPlaces = await _placesService.getNearbyPlaces(
        latitude: latitude,
        longitude: longitude,
      );
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> fetchFavoritePlaces() async {
    _setLoading(true);
    try {
      _favoritePlaces = await _placesService.getFavoritePlaces();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> toggleFavorite(String placeId) async {
    try {
      await _placesService.toggleFavorite(placeId);
      
      // Update the favorite status in both lists
      _nearbyPlaces = _nearbyPlaces.map((place) {
        if (place.id == placeId) {
          return place.copyWith(isFavorite: !place.isFavorite);
        }
        return place;
      }).toList();

      _favoritePlaces = _favoritePlaces.map((place) {
        if (place.id == placeId) {
          return place.copyWith(isFavorite: !place.isFavorite);
        }
        return place;
      }).toList();

      // Remove from favorites if unfavorited
      _favoritePlaces.removeWhere((place) => place.id == placeId && !place.isFavorite);

      notifyListeners();
      _error = null;
    } catch (e) {
      _error = e.toString();
    }
  }

  Future<List<Place>> searchPlaces(String query) async {
    try {
      final results = await _placesService.searchPlaces(query);
      _error = null;
      return results;
    } catch (e) {
      _error = e.toString();
      return [];
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<Place> getPlaceDetails(String placeId) async {
    try {
      final place = await _placesService.getPlaceDetails(placeId);
      _error = null;
      return place;
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }
}