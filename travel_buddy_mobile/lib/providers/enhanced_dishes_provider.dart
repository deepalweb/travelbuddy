// Enhanced Dishes Provider with Filters and Trip Integration

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/dish_models.dart';
import '../services/enhanced_dishes_api_service.dart';

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

      _loadingMessage = 'AI is discovering local dishes...';
      notifyListeners();

      _dishesResponse = await EnhancedDishesApiService.getLocalDishes(
        latitude: latitude,
        longitude: longitude,
        destination: destination,
        filters: _filters,
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

  // Add dish to trip
  Future<bool> addDishToTrip(String dishName, String tripId, int dayNumber) async {
    try {
      await EnhancedDishesApiService.addDishToTrip(
        dishName: dishName,
        tripId: tripId,
        dayNumber: dayNumber,
      );
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
    
    return await EnhancedDishesApiService.getMealSuggestions(
      latitude: latitude,
      longitude: longitude,
      timeOfDay: timeOfDay,
      weather: weather ?? 'clear',
      dietaryPrefs: dietaryPrefs ?? [],
    );
  }

  String _getCurrentTimeOfDay() {
    final hour = DateTime.now().hour;
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 19) return 'afternoon';
    return 'dinner';
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