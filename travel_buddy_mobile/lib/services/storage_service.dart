import 'dart:convert';
import 'dart:math';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../models/user.dart';
import '../models/place.dart';
import '../models/trip.dart';
import '../models/travel_style.dart';
import '../models/safety_info.dart';
import '../models/safety_enums.dart';
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
    if (!Hive.isAdapterRegistered(20)) Hive.registerAdapter(PriceInfoAdapter());
    if (!Hive.isAdapterRegistered(25)) Hive.registerAdapter(TravelStyleAdapter());

    // Open boxes with error handling for corrupted data
    try {
      _userBox = await Hive.openBox<CurrentUser>('users');
      _placesBox = await Hive.openBox<Place>('places');
      _tripPlansBox = await Hive.openBox<TripPlan>('tripPlans');
      _itinerariesBox = await Hive.openBox<OneDayItinerary>('itineraries');
    } catch (e) {
      print('Corrupted Hive data detected, clearing and recreating boxes...');
      // Delete corrupted boxes
      await Hive.deleteBoxFromDisk('users');
      await Hive.deleteBoxFromDisk('places');
      await Hive.deleteBoxFromDisk('tripPlans');
      await Hive.deleteBoxFromDisk('itineraries');
      
      // Recreate boxes
      _userBox = await Hive.openBox<CurrentUser>('users');
      _placesBox = await Hive.openBox<Place>('places');
      _tripPlansBox = await Hive.openBox<TripPlan>('tripPlans');
      _itinerariesBox = await Hive.openBox<OneDayItinerary>('itineraries');
    }
    
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
    print('💾 StorageService: Saving itinerary ${itinerary.id}');
    
    // Debug: Check visit status before saving
    for (final activity in itinerary.dailyPlan) {
      print('   Saving activity: ${activity.activityTitle} - isVisited: ${activity.isVisited}');
    }
    
    await _itinerariesBox.put(itinerary.id, itinerary);
    
    // Verify the save worked
    final saved = _itinerariesBox.get(itinerary.id);
    if (saved != null) {
      print('✅ StorageService: Itinerary saved successfully');
      for (final activity in saved.dailyPlan) {
        print('   Verified activity: ${activity.activityTitle} - isVisited: ${activity.isVisited}');
      }
    } else {
      print('❌ StorageService: Failed to save itinerary');
    }
  }

  Future<List<OneDayItinerary>> getItineraries() async {
    final itineraries = _itinerariesBox.values.toList();
    print('💾 StorageService: Loading ${itineraries.length} itineraries');
    
    for (final itinerary in itineraries) {
      print('   Loading itinerary: ${itinerary.title}');
      for (final activity in itinerary.dailyPlan) {
        print('     Activity: ${activity.activityTitle} - isVisited: ${activity.isVisited}');
      }
    }
    
    return itineraries;
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

  // Location-aware caching
  Future<void> cachePlacesWithLocation(
    List<Place> places, 
    double lat, 
    double lng, 
    String category
  ) async {
    final locationKey = _generateLocationKey(lat, lng, category);
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    
    // Store places with location metadata
    final Map<String, Place> batch = {};
    for (final place in places) {
      batch['${locationKey}_${place.id}'] = place;
    }
    await _placesBox.putAll(batch);
    
    // Store location metadata
    await _prefs.setString('${locationKey}_metadata', '$lat,$lng,$category,$timestamp');
    
    // Clean old location caches (keep only last 5 locations)
    await _cleanOldLocationCaches();
  }
  
  Future<List<Place>> getCachedPlacesForLocation(
    double lat, 
    double lng, 
    String category, {
    required double maxAgeHours,
    required double maxDistanceKm,
  }) async {
    // Find cached locations within distance and time threshold
    final allKeys = _prefs.getKeys().where((key) => key.endsWith('_metadata')).toList();
    
    for (final metaKey in allKeys) {
      final metadata = _prefs.getString(metaKey);
      if (metadata == null) continue;
      
      final parts = metadata.split(',');
      if (parts.length != 4) continue;
      
      final cachedLat = double.tryParse(parts[0]);
      final cachedLng = double.tryParse(parts[1]);
      final cachedCategory = parts[2];
      final cachedTimestamp = int.tryParse(parts[3]);
      
      if (cachedLat == null || cachedLng == null || cachedTimestamp == null) continue;
      
      // Check category match
      if (cachedCategory != category) continue;
      
      // Check time threshold
      final ageHours = (DateTime.now().millisecondsSinceEpoch - cachedTimestamp) / (1000 * 60 * 60);
      if (ageHours > maxAgeHours) continue;
      
      // Check distance threshold
      final distance = _calculateDistance(lat, lng, cachedLat, cachedLng);
      if (distance > maxDistanceKm) continue;
      
      // Found valid cache - load places
      final locationKey = metaKey.replaceAll('_metadata', '');
      return await _loadPlacesForLocationKey(locationKey);
    }
    
    return []; // No valid cache found
  }
  
  String _generateLocationKey(double lat, double lng, String category) {
    final latRounded = (lat * 100).round() / 100; // Round to ~1km precision
    final lngRounded = (lng * 100).round() / 100;
    return 'loc_${latRounded}_${lngRounded}_$category';
  }
  
  Future<List<Place>> _loadPlacesForLocationKey(String locationKey) async {
    final places = <Place>[];
    final allKeys = _placesBox.keys.where((key) => key.toString().startsWith('${locationKey}_')).toList();
    
    for (final key in allKeys) {
      final place = _placesBox.get(key);
      if (place != null) {
        places.add(place);
      }
    }
    
    return places;
  }
  
  double _calculateDistance(double lat1, double lng1, double lat2, double lng2) {
    const double earthRadius = 6371; // km
    final double dLat = _degreesToRadians(lat2 - lat1);
    final double dLng = _degreesToRadians(lng2 - lng1);
    
    final double a = 
        sin(dLat / 2) * sin(dLat / 2) +
        cos(_degreesToRadians(lat1)) * cos(_degreesToRadians(lat2)) *
        sin(dLng / 2) * sin(dLng / 2);
    
    final double c = 2 * asin(sqrt(a));
    return earthRadius * c;
  }
  
  double _degreesToRadians(double degrees) {
    return degrees * (pi / 180);
  }
  
  Future<void> _cleanOldLocationCaches() async {
    final allMetaKeys = _prefs.getKeys().where((key) => key.endsWith('_metadata')).toList();
    
    if (allMetaKeys.length <= 5) return; // Keep up to 5 locations
    
    // Sort by timestamp and remove oldest
    final keyTimestamps = <String, int>{};
    for (final key in allMetaKeys) {
      final metadata = _prefs.getString(key);
      if (metadata != null) {
        final parts = metadata.split(',');
        if (parts.length == 4) {
          final timestamp = int.tryParse(parts[3]);
          if (timestamp != null) {
            keyTimestamps[key] = timestamp;
          }
        }
      }
    }
    
    final sortedKeys = keyTimestamps.keys.toList()
      ..sort((a, b) => keyTimestamps[a]!.compareTo(keyTimestamps[b]!));
    
    // Remove oldest caches
    final keysToRemove = sortedKeys.take(sortedKeys.length - 5);
    for (final metaKey in keysToRemove) {
      final locationKey = metaKey.replaceAll('_metadata', '');
      
      // Remove places for this location
      final placeKeys = _placesBox.keys.where((key) => key.toString().startsWith('${locationKey}_')).toList();
      for (final placeKey in placeKeys) {
        await _placesBox.delete(placeKey);
      }
      
      // Remove metadata
      await _prefs.remove(metaKey);
    }
  }

  // Saved Day Plans (Premium) - MongoDB Backend
  static Future<List<Map<String, dynamic>>> getSavedOneDayItineraries() async {
    try {
      // Try to get from backend first
      final user = await StorageService().getUser();
      if (user?.uid != null || user?.mongoId != null) {
        final userId = user!.mongoId ?? user.uid;
        final response = await http.get(
          Uri.parse('${AppConstants.baseUrl}/api/users/$userId/itineraries'),
          headers: {'Content-Type': 'application/json'},
        );
        
        if (response.statusCode == 200) {
          final List<dynamic> data = json.decode(response.body);
          return data.cast<Map<String, dynamic>>();
        }
      }
    } catch (e) {
      print('Failed to load from backend: $e');
    }
    
    // Fallback to local storage
    final prefs = await SharedPreferences.getInstance();
    final savedPlansJson = prefs.getStringList('saved_premium_plans') ?? [];
    
    return savedPlansJson.map((planJson) {
      try {
        return Map<String, dynamic>.from(
          const JsonDecoder().convert(planJson) as Map
        );
      } catch (e) {
        return <String, dynamic>{};
      }
    }).where((plan) => plan.isNotEmpty).toList();
  }
  
  static Future<void> saveSavedOneDayItineraries(List<Map<String, dynamic>> plans) async {
    // Save to local storage first (immediate)
    final prefs = await SharedPreferences.getInstance();
    final plansJson = plans.map((plan) => const JsonEncoder().convert(plan)).toList();
    await prefs.setStringList('saved_premium_plans', plansJson);
    
    // Save to MongoDB backend (async)
    _syncToBackend(plans);
  }
  
  static Future<void> savePremiumPlanToMongo(Map<String, dynamic> plan) async {
    try {
      final user = await StorageService().getUser();
      if (user?.uid == null && user?.mongoId == null) {
        throw Exception('User not logged in');
      }
      
      final userId = user!.mongoId ?? user.uid;
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/itineraries'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'title': plan['title'] ?? 'Premium Day Plan',
          'introduction': 'AI-generated premium day plan with local insights',
          'dailyPlan': [plan], // Wrap in array for one-day plan
          'conclusion': 'Enjoy your premium travel experience!',
          'travelTips': plan['packingTips'] ?? [],
          'isPremium': true,
          'destination': plan['destination'],
          'totalCost': plan['totalCost'],
          'activities': plan['activities'],
        }),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Plan saved to MongoDB successfully');
      } else {
        print('❌ Failed to save to MongoDB: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ MongoDB save error: $e');
    }
  }
  
  static Future<void> _syncToBackend(List<Map<String, dynamic>> plans) async {
    // Sync latest plan to backend (fire and forget)
    if (plans.isNotEmpty) {
      final latestPlan = plans.last;
      savePremiumPlanToMongo(latestPlan);
    }
  }

  // Subscription storage methods
  Future<void> saveSubscription(Map<String, dynamic> subscription) async {
    await _prefs.setString('subscription_data', json.encode(subscription));
  }
  
  Future<Map<String, dynamic>?> getSubscription() async {
    final data = _prefs.getString('subscription_data');
    if (data != null) {
      try {
        return Map<String, dynamic>.from(json.decode(data));
      } catch (e) {
        print('Error parsing subscription data: $e');
        return null;
      }
    }
    return null;
  }
  
  Future<void> updateSubscriptionStatus(String status) async {
    final current = await getSubscription();
    if (current != null) {
      current['status'] = status;
      await saveSubscription(current);
    }
  }

  // Usage tracking methods
  Future<Map<String, dynamic>> getUsageData(String date) async {
    final data = _prefs.getString('usage_$date');
    if (data != null) {
      try {
        return Map<String, dynamic>.from(json.decode(data));
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  Future<void> saveUsageData(String date, Map<String, dynamic> usage) async {
    await _prefs.setString('usage_$date', json.encode(usage));
  }

  // Visit Status Methods
  Future<void> updateActivityVisitStatus(String tripPlanId, String activityTitle, bool isVisited) async {
    try {
      // Update local storage
      final tripPlan = _tripPlansBox.get(tripPlanId);
      if (tripPlan != null) {
        // Find and update the activity
        for (final day in tripPlan.dailyPlans) {
          for (int i = 0; i < day.activities.length; i++) {
            if (day.activities[i].activityTitle == activityTitle) {
              final original = day.activities[i];
              final updatedActivity = ActivityDetail(
                timeOfDay: original.timeOfDay,
                activityTitle: original.activityTitle,
                description: original.description,
                estimatedDuration: original.estimatedDuration,
                location: original.location,
                notes: original.notes,
                icon: original.icon,
                category: original.category,
                startTime: original.startTime,
                endTime: original.endTime,
                duration: original.duration,
                place: original.place,
                type: original.type,
                estimatedCost: original.estimatedCost,
                costBreakdown: original.costBreakdown,
                transportFromPrev: original.transportFromPrev,
                tips: original.tips,
                weatherBackup: original.weatherBackup,
                crowdLevel: original.crowdLevel,
                imageURL: original.imageURL,
                bookingLinks: original.bookingLinks,
                googlePlaceId: original.googlePlaceId,
                highlight: original.highlight,
                socialProof: original.socialProof,
                rating: original.rating,
                userRatingsTotal: original.userRatingsTotal,
                practicalTip: original.practicalTip,
                travelMode: original.travelMode,
                travelTimeMin: original.travelTimeMin,
                estimatedVisitDurationMin: original.estimatedVisitDurationMin,
                photoThumbnail: original.photoThumbnail,
                fullAddress: original.fullAddress,
                openingHours: original.openingHours,
                isOpenNow: original.isOpenNow,
                weatherNote: original.weatherNote,
                tags: original.tags,
                bookingLink: original.bookingLink,
                isVisited: isVisited,
                visitedDate: isVisited ? DateTime.now().toIso8601String() : original.visitedDate,
              );
              day.activities[i] = updatedActivity;
            }
          }
        }
        await _tripPlansBox.put(tripPlanId, tripPlan);
      }
      
      // Update itinerary if it's a day plan
      final itinerary = _itinerariesBox.values.firstWhere(
        (itinerary) => itinerary.dailyPlan.any((activity) => activity.activityTitle == activityTitle),
        orElse: () => OneDayItinerary(id: '', title: '', introduction: '', dailyPlan: [], conclusion: ''),
      );
      
      if (itinerary.id.isNotEmpty) {
        for (int i = 0; i < itinerary.dailyPlan.length; i++) {
          if (itinerary.dailyPlan[i].activityTitle == activityTitle) {
            final original = itinerary.dailyPlan[i];
            final updatedActivity = ActivityDetail(
              timeOfDay: original.timeOfDay,
              activityTitle: original.activityTitle,
              description: original.description,
              estimatedDuration: original.estimatedDuration,
              location: original.location,
              notes: original.notes,
              icon: original.icon,
              category: original.category,
              startTime: original.startTime,
              endTime: original.endTime,
              duration: original.duration,
              place: original.place,
              type: original.type,
              estimatedCost: original.estimatedCost,
              costBreakdown: original.costBreakdown,
              transportFromPrev: original.transportFromPrev,
              tips: original.tips,
              weatherBackup: original.weatherBackup,
              crowdLevel: original.crowdLevel,
              imageURL: original.imageURL,
              bookingLinks: original.bookingLinks,
              googlePlaceId: original.googlePlaceId,
              highlight: original.highlight,
              socialProof: original.socialProof,
              rating: original.rating,
              userRatingsTotal: original.userRatingsTotal,
              practicalTip: original.practicalTip,
              travelMode: original.travelMode,
              travelTimeMin: original.travelTimeMin,
              estimatedVisitDurationMin: original.estimatedVisitDurationMin,
              photoThumbnail: original.photoThumbnail,
              fullAddress: original.fullAddress,
              openingHours: original.openingHours,
              isOpenNow: original.isOpenNow,
              weatherNote: original.weatherNote,
              tags: original.tags,
              bookingLink: original.bookingLink,
              isVisited: isVisited,
              visitedDate: isVisited ? DateTime.now().toIso8601String() : original.visitedDate,
            );
            itinerary.dailyPlan[i] = updatedActivity;
          }
        }
        await _itinerariesBox.put(itinerary.id, itinerary);
      }
      
    } catch (e) {
      print('❌ Error updating visit status: $e');
    }
  }
  
  Future<void> removeActivityFromPlan(String tripPlanId, String activityTitle) async {
    try {
      // Remove from trip plan
      final tripPlan = _tripPlansBox.get(tripPlanId);
      if (tripPlan != null) {
        for (final day in tripPlan.dailyPlans) {
          day.activities.removeWhere((activity) => activity.activityTitle == activityTitle);
        }
        await _tripPlansBox.put(tripPlanId, tripPlan);
      }
      
      // Remove from itinerary
      final itinerary = _itinerariesBox.values.firstWhere(
        (itinerary) => itinerary.dailyPlan.any((activity) => activity.activityTitle == activityTitle),
        orElse: () => OneDayItinerary(id: '', title: '', introduction: '', dailyPlan: [], conclusion: ''),
      );
      
      if (itinerary.id.isNotEmpty) {
        itinerary.dailyPlan.removeWhere((activity) => activity.activityTitle == activityTitle);
        await _itinerariesBox.put(itinerary.id, itinerary);
      }
      
    } catch (e) {
      print('❌ Error removing activity: $e');
    }
  }
  
  Map<String, bool> getVisitStatusForPlan(String tripPlanId) {
    final visitStatus = <String, bool>{};
    
    // Get from trip plan
    final tripPlan = _tripPlansBox.get(tripPlanId);
    if (tripPlan != null) {
      for (final day in tripPlan.dailyPlans) {
        for (final activity in day.activities) {
          visitStatus[activity.activityTitle] = activity.isVisited;
        }
      }
    }
    
    // Get from itineraries
    for (final itinerary in _itinerariesBox.values) {
      for (final activity in itinerary.dailyPlan) {
        visitStatus[activity.activityTitle] = activity.isVisited;
      }
    }
    
    return visitStatus;
  }

  // Emergency Contacts Storage
  Future<List<EmergencyContact>> getEmergencyContacts() async {
    final contactsJson = _prefs.getStringList('emergency_contacts') ?? [];
    return contactsJson.map((json) {
      try {
        return EmergencyContact.fromJson(Map<String, dynamic>.from(
          const JsonDecoder().convert(json) as Map
        ));
      } catch (e) {
        return null;
      }
    }).where((contact) => contact != null).cast<EmergencyContact>().toList();
  }

  Future<void> addEmergencyContact(EmergencyContact contact) async {
    final contacts = await getEmergencyContacts();
    contacts.add(contact);
    await _saveEmergencyContacts(contacts);
  }

  Future<void> removeEmergencyContact(String contactId) async {
    final contacts = await getEmergencyContacts();
    contacts.removeWhere((contact) => contact.id == contactId);
    await _saveEmergencyContacts(contacts);
  }

  Future<void> _saveEmergencyContacts(List<EmergencyContact> contacts) async {
    final contactsJson = contacts.map((contact) => 
      const JsonEncoder().convert(contact.toJson())
    ).toList();
    await _prefs.setStringList('emergency_contacts', contactsJson);
  }
  
  // Enhanced Safety Storage
  Future<void> saveOfflineSafetyInfo(SafetyInfo info) async {
    await _prefs.setString('offline_safety_info', const JsonEncoder().convert({
      'country': info.country,
      'emergencyNumber': info.emergencyNumber,
      'policeNumber': info.policeNumber,
      'ambulanceNumber': info.ambulanceNumber,
      'fireNumber': info.fireNumber,
      'alternativeNumbers': info.alternativeNumbers,
      'embassyNumber': info.embassyNumber,
      'touristHelpline': info.touristHelpline,
      'taxiSafetyLine': info.taxiSafetyLine,
    }));
  }
  
  Future<SafetyInfo?> getOfflineSafetyInfo() async {
    final data = _prefs.getString('offline_safety_info');
    if (data != null) {
      try {
        final json = Map<String, dynamic>.from(const JsonDecoder().convert(data) as Map);
        return SafetyInfo.fromJson(json);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  
  Future<void> saveMedicalInfo(MedicalInfo info) async {
    await _prefs.setString('medical_info', const JsonEncoder().convert(info.toJson()));
  }
  
  Future<MedicalInfo?> getMedicalInfo() async {
    final data = _prefs.getString('medical_info');
    if (data != null) {
      try {
        final json = Map<String, dynamic>.from(const JsonDecoder().convert(data) as Map);
        return MedicalInfo.fromJson(json);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  
  Future<void> saveActiveTimer(SafetyTimer timer) async {
    await _prefs.setString('active_safety_timer', const JsonEncoder().convert({
      'id': timer.id,
      'startTime': timer.startTime.toIso8601String(),
      'duration': timer.duration.inMilliseconds,
      'description': timer.description,
      'notifyContacts': timer.notifyContacts,
    }));
  }
  
  Future<void> clearActiveTimer() async {
    await _prefs.remove('active_safety_timer');
  }
  
  Future<void> saveSOSSettings(Map<String, dynamic> settings) async {
    await _prefs.setString('sos_settings', const JsonEncoder().convert(settings));
  }
  
  Future<Map<String, dynamic>?> getSOSSettings() async {
    final data = _prefs.getString('sos_settings');
    if (data != null) {
      try {
        return Map<String, dynamic>.from(const JsonDecoder().convert(data) as Map);
      } catch (e) {
        return null;
      }
    }
    return null;
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