// Enhanced Dishes Provider with Filters and Trip Integration

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/dish_models.dart';
import '../services/backend_dishes_service.dart';

class EnhancedDishesProvider extends ChangeNotifier {
  DishesResponse? _dishesResponse;
  bool _isLoading = false;
  String? _error;
  String _loadingMessage = 'Loading...';
  
  // Filters
  Map<String, dynamic> _filters = {};
  String _selectedDietaryFilter = 'All';

  // Getters
  DishesResponse? get dishesResponse => _dishesResponse;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get loadingMessage => _loadingMessage;
  Map<String, dynamic> get filters => _filters;
  String get selectedDietaryFilter => _selectedDietaryFilter;

  List<Dish> get filteredDishes {
    if (_dishesResponse == null) return [];
    if (_selectedDietaryFilter == 'All') return _dishesResponse!.dishes;
    
    return _dishesResponse!.dishes.where((dish) {
      return dish.dietaryTags.any((tag) => 
        tag.toLowerCase().contains(_selectedDietaryFilter.toLowerCase())
      );
    }).toList();
  }

  // Load dishes with enhanced filters
  Future<void> loadDishes({
    double? latitude,
    double? longitude,
    String? destination,
    Map<String, dynamic>? filters,
  }) async {
    _isLoading = true;
    _error = null;
    _filters = filters ?? {};
    notifyListeners();

    try {
      _loadingMessage = 'Getting your location...';
      notifyListeners();

      // Get location if not provided
      if (latitude == null && longitude == null && destination == null) {
        final position = await Geolocator.getCurrentPosition();
        latitude = position.latitude;
        longitude = position.longitude;
      }

      _loadingMessage = 'Backend is processing your request...';
      notifyListeners();

      // Test backend connection first
      print('🔍 Testing backend connection...');
      try {
        final testResponse = await BackendDishesService.testConnection();
        print('✅ Backend connection test: $testResponse');
      } catch (e) {
        print('❌ Backend connection failed: $e');
      }

      final dishesData = await BackendDishesService.getLocalDishes(
        lat: latitude!,
        lng: longitude!,
        filters: _filters,
      );
      
      // Transform backend data to Dish objects
      final dishes = dishesData.map((dishMap) => Dish(
        name: dishMap['name'] ?? '',
        description: dishMap['description'] ?? '',
        averagePrice: dishMap['averagePrice'] ?? '',
        category: dishMap['cuisine'] ?? '',
        recommendedPlaces: [RecommendedPlace(
          name: dishMap['restaurantName'] ?? '',
          type: 'Restaurant',
          address: dishMap['restaurantAddress'] ?? '',
          rating: (dishMap['rating'] ?? 4.0).toDouble(),
          placeId: dishMap['restaurantId'],
        )],
        userPhotos: dishMap['imageUrl']?.isNotEmpty == true ? [dishMap['imageUrl']] : [],
        dietaryTags: List<String>.from(dishMap['dietaryTags'] ?? []),
        culturalSignificance: dishMap['culturalNote'] ?? '',
      )).toList();
      
      _dishesResponse = DishesResponse(
        location: destination ?? 'Current Location',
        dishes: dishes,
        metadata: Metadata(
          source: ['Backend API', 'Gemini AI', 'Google Places'],
          filtersApplied: _filters.keys.toList(),
        ),
      );
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      _loadingMessage = 'Loading...';
      notifyListeners();
    }
  }

  // Set dietary filter
  void setDietaryFilter(String filter) {
    _selectedDietaryFilter = filter;
    notifyListeners();
  }

  // Add filters
  void addFilter(String key, dynamic value) {
    _filters[key] = value;
    notifyListeners();
  }

  void removeFilter(String key) {
    _filters.remove(key);
    notifyListeners();
  }

  void clearFilters() {
    _filters.clear();
    _selectedDietaryFilter = 'All';
    notifyListeners();
  }

  // Add dish to trip (placeholder for now)
  Future<bool> addDishToTrip(String dishName, String tripId, int dayNumber) async {
    try {
      // TODO: Implement backend endpoint for adding dishes to trips
      await Future.delayed(Duration(milliseconds: 500));
      return true;
    } catch (e) {
      _error = 'Failed to add dish to trip: $e';
      notifyListeners();
      return false;
    }
  }

  // Get meal suggestions
  Future<List<Dish>> getMealSuggestions({
    required double latitude,
    required double longitude,
    String? weather,
    List<String>? dietaryPrefs,
  }) async {
    final timeOfDay = _getCurrentTimeOfDay();
    
    final filters = {
      'timeOfDay': timeOfDay,
      if (weather != null) 'weather': weather,
      if (dietaryPrefs != null && dietaryPrefs.isNotEmpty) 'dietary': dietaryPrefs,
    };
    
    final dishesData = await BackendDishesService.getLocalDishes(
      lat: latitude,
      lng: longitude,
      limit: 5,
      filters: filters,
    );
    
    // Transform to Dish objects
    return dishesData.map((dishMap) => Dish(
      name: dishMap['name'] ?? '',
      description: dishMap['description'] ?? '',
      averagePrice: dishMap['averagePrice'] ?? '',
      category: dishMap['cuisine'] ?? '',
      recommendedPlaces: [RecommendedPlace(
        name: dishMap['restaurantName'] ?? '',
        type: 'Restaurant',
        address: dishMap['restaurantAddress'] ?? '',
        rating: (dishMap['rating'] ?? 4.0).toDouble(),
        placeId: dishMap['restaurantId'],
      )],
      userPhotos: dishMap['imageUrl']?.isNotEmpty == true ? [dishMap['imageUrl']] : [],
      dietaryTags: List<String>.from(dishMap['dietaryTags'] ?? []),
      culturalSignificance: dishMap['culturalNote'] ?? '',
    )).toList();
  }

  String _getCurrentTimeOfDay() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 19) return 'afternoon';
    return 'dinner';
  }

  // Test backend connection
  Future<bool> testBackendConnection() async {
    try {
      return await BackendDishesService.testConnection();
    } catch (e) {
      print('Backend connection test failed: $e');
      return false;
    }
  }
  
  // Get backend status
  Future<Map<String, dynamic>> getBackendStatus() async {
    try {
      return await BackendDishesService.getBackendStatus();
    } catch (e) {
      return {
        'connected': false,
        'error': e.toString(),
        'url': 'Unknown',
      };
    }
  }

  // Mock data fallback
  void setMockData(List<Dish> dishes) {
    _dishesResponse = DishesResponse(
      location: 'Sample Location',
      dishes: dishes,
      metadata: Metadata(
        source: ['Mock Data'],
        filtersApplied: [],
      ),
    );
    _isLoading = false;
    _error = null;
    notifyListeners();
  }
}