import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../models/place.dart';
import '../models/trip.dart';
import '../constants/app_constants.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  late Box<CurrentUser> _userBox;
  late Box<Place> _placesBox;
  late Box<TripPlan> _tripPlansBox;
  late Box<OneDayItinerary> _itinerariesBox;
  late SharedPreferences _prefs;

  Future<void> initialize() async {
    await Hive.initFlutter();
    
    // Register adapters
    if (!Hive.isAdapterRegistered(0)) Hive.registerAdapter(PlaceAdapter());
    if (!Hive.isAdapterRegistered(1)) Hive.registerAdapter(DealAdapter());
    if (!Hive.isAdapterRegistered(2)) Hive.registerAdapter(CurrentUserAdapter());
    if (!Hive.isAdapterRegistered(3)) Hive.registerAdapter(TripPlanAdapter());
    if (!Hive.isAdapterRegistered(4)) Hive.registerAdapter(DailyTripPlanAdapter());
    if (!Hive.isAdapterRegistered(5)) Hive.registerAdapter(ActivityDetailAdapter());
    if (!Hive.isAdapterRegistered(6)) Hive.registerAdapter(OneDayItineraryAdapter());
    if (!Hive.isAdapterRegistered(7)) Hive.registerAdapter(SubscriptionStatusAdapter());
    if (!Hive.isAdapterRegistered(8)) Hive.registerAdapter(SubscriptionTierAdapter());
    if (!Hive.isAdapterRegistered(9)) Hive.registerAdapter(UserInterestAdapter());

    // Open boxes
    _userBox = await Hive.openBox<CurrentUser>('users');
    _placesBox = await Hive.openBox<Place>('places');
    _tripPlansBox = await Hive.openBox<TripPlan>('tripPlans');
    _itinerariesBox = await Hive.openBox<OneDayItinerary>('itineraries');
    
    _prefs = await SharedPreferences.getInstance();
  }

  // User Storage
  Future<void> saveUser(CurrentUser user) async {
    await _userBox.put('current_user', user);
  }

  Future<CurrentUser?> getUser() async {
    return _userBox.get('current_user');
  }

  Future<void> clearUser() async {
    await _userBox.delete('current_user');
  }

  // Favorites Storage
  Future<void> saveFavorites(List<String> favoriteIds) async {
    await _prefs.setStringList(AppConstants.favoritePlacesKey, favoriteIds);
  }

  Future<List<String>> getFavorites() async {
    return _prefs.getStringList(AppConstants.favoritePlacesKey) ?? [];
  }

  Future<void> addFavorite(String placeId) async {
    final favorites = await getFavorites();
    if (!favorites.contains(placeId)) {
      favorites.add(placeId);
      await saveFavorites(favorites);
    }
  }

  Future<void> removeFavorite(String placeId) async {
    final favorites = await getFavorites();
    favorites.remove(placeId);
    await saveFavorites(favorites);
  }

  // Places Cache
  Future<void> cachePlaces(List<Place> places) async {
    for (final place in places) {
      await _placesBox.put(place.id, place);
    }
  }

  Future<List<Place>> getCachedPlaces() async {
    return _placesBox.values.toList();
  }

  Future<Place?> getCachedPlace(String placeId) async {
    return _placesBox.get(placeId);
  }

  Future<void> clearPlacesCache() async {
    await _placesBox.clear();
  }

  // Trip Plans Storage
  Future<void> saveTripPlan(TripPlan tripPlan) async {
    await _tripPlansBox.put(tripPlan.id, tripPlan);
  }

  Future<List<TripPlan>> getTripPlans() async {
    return _tripPlansBox.values.toList();
  }

  Future<void> deleteTripPlan(String tripPlanId) async {
    await _tripPlansBox.delete(tripPlanId);
  }

  Future<void> clearTripPlans() async {
    await _tripPlansBox.clear();
  }

  // Itineraries Storage
  Future<void> saveItinerary(OneDayItinerary itinerary) async {
    await _itinerariesBox.put(itinerary.id, itinerary);
  }

  Future<List<OneDayItinerary>> getItineraries() async {
    return _itinerariesBox.values.toList();
  }

  Future<void> deleteItinerary(String itineraryId) async {
    await _itinerariesBox.delete(itineraryId);
  }

  Future<void> clearItineraries() async {
    await _itinerariesBox.clear();
  }

  // Settings Storage
  Future<void> setSelectedRadius(int radius) async {
    await _prefs.setInt(AppConstants.selectedRadiusKey, radius);
  }

  Future<int> getSelectedRadius() async {
    return _prefs.getInt(AppConstants.selectedRadiusKey) ?? AppConstants.defaultPlacesRadiusM;
  }

  Future<void> setLanguage(String language) async {
    await _prefs.setString('language', language);
  }

  Future<String> getLanguage() async {
    return _prefs.getString('language') ?? AppConstants.defaultLanguage;
  }

  Future<void> setCurrency(String currency) async {
    await _prefs.setString('currency', currency);
  }

  Future<String> getCurrency() async {
    return _prefs.getString('currency') ?? AppConstants.defaultCurrency;
  }

  // Clear cache only
  Future<void> clearCache() async {
    await _placesBox.clear();
    await _tripPlansBox.clear();
    await _itinerariesBox.clear();
  }

  // Enriched Places Cache (AI-enhanced places)
  Future<void> cacheEnrichedPlace(Place place) async {
    final key = 'enriched_${place.id}';
    await _placesBox.put(key, place);
    
    // Store timestamp for cache expiry (7 days)
    await _prefs.setInt('${key}_timestamp', DateTime.now().millisecondsSinceEpoch);
  }
  
  Future<Place?> getCachedEnrichedPlace(String placeId) async {
    final key = 'enriched_$placeId';
    final timestamp = _prefs.getInt('${key}_timestamp');
    
    // Check if cache is expired (7 days)
    if (timestamp != null) {
      final cacheAge = DateTime.now().millisecondsSinceEpoch - timestamp;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (cacheAge > sevenDays) {
        // Cache expired, remove it
        await _placesBox.delete(key);
        await _prefs.remove('${key}_timestamp');
        return null;
      }
    }
    
    return _placesBox.get(key);
  }
  
  Future<void> clearEnrichedCache() async {
    final keys = _placesBox.keys.where((key) => key.toString().startsWith('enriched_')).toList();
    for (final key in keys) {
      await _placesBox.delete(key);
      await _prefs.remove('${key}_timestamp');
    }
  }
  
  // Batch operations for performance
  Future<void> batchCachePlaces(List<Place> places) async {
    final Map<String, Place> batch = {};
    for (final place in places) {
      batch[place.id] = place;
    }
    await _placesBox.putAll(batch);
  }
  
  Future<Map<String, Place>> batchGetCachedPlaces(List<String> placeIds) async {
    final result = <String, Place>{};
    for (final id in placeIds) {
      final place = await getCachedPlace(id);
      if (place != null) {
        result[id] = place;
      }
    }
    return result;
  }

  // Clear all data
  Future<void> clearAllData() async {
    await _userBox.clear();
    await _placesBox.clear();
    await _tripPlansBox.clear();
    await _itinerariesBox.clear();
    await _prefs.clear();
  }
}