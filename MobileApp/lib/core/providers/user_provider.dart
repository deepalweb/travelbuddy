import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/user.dart';

class UserProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<String> _favoritePlaces = [];
  bool _isLoading = false;

  List<String> get favoritePlaces => _favoritePlaces;
  bool get isLoading => _isLoading;

  Future<void> loadFavorites(String userId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get('/users/$userId/favorites');
      _favoritePlaces = List<String>.from(response);
    } catch (e) {
      debugPrint('Load favorites error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addFavorite(String userId, String placeId) async {
    try {
      await _apiService.post('/users/$userId/favorites', body: {
        'placeId': placeId,
      });
      
      if (!_favoritePlaces.contains(placeId)) {
        _favoritePlaces.add(placeId);
        notifyListeners();
      }
      return true;
    } catch (e) {
      debugPrint('Add favorite error: $e');
      return false;
    }
  }

  Future<bool> removeFavorite(String userId, String placeId) async {
    try {
      await _apiService.delete('/users/$userId/favorites/$placeId');
      
      _favoritePlaces.remove(placeId);
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Remove favorite error: $e');
      return false;
    }
  }

  Future<User?> updateProfile(String userId, Map<String, dynamic> updates) async {
    try {
      final response = await _apiService.put('/users/$userId', body: updates);
      return User.fromJson(response);
    } catch (e) {
      debugPrint('Update profile error: $e');
      return null;
    }
  }

  bool isFavorite(String placeId) {
    return _favoritePlaces.contains(placeId);
  }
}