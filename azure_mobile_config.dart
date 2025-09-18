// Mobile App Configuration for Azure Backend

class ApiConfig {
  // Replace with your actual Azure App Service URL
  static const String baseUrl = 'https://your-travelbuddy-app.azurewebsites.net/api';
  
  // Alternative Azure URLs (choose the correct one):
  // static const String baseUrl = 'https://travelbuddy-backend.azurewebsites.net/api';
  // static const String baseUrl = 'https://travelbuddy.azurewebsites.net/api';
}

class DishesApiService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: Duration(minutes: 2),
    receiveTimeout: Duration(minutes: 2),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Enhanced dishes API call matching your backend
  static Future<DishesResponse> getLocalDishes({
    double? latitude,
    double? longitude,
    String? destination,
    Map<String, dynamic>? filters,
    String language = 'en',
  }) async {
    try {
      final response = await _dio.post('/dishes/generate', data: {
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (destination != null) 'destination': destination,
        'filters': filters ?? {},
        'language': language,
      });

      return DishesResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout) {
        throw Exception('Azure backend timeout. Please try again.');
      }
      throw Exception('Failed to load dishes: ${e.message}');
    }
  }

  // Add dish to trip (integrates with your MongoDB)
  static Future<void> addDishToTrip({
    required String dishName,
    required String tripId,
    required int dayNumber,
    String mealTime = 'lunch',
  }) async {
    await _dio.post('/dishes/add-to-trip', data: {
      'dishName': dishName,
      'tripId': tripId,
      'dayNumber': dayNumber,
      'mealTime': mealTime,
    });
  }

  // Get meal suggestions based on context
  static Future<List<Dish>> getMealSuggestions({
    required double latitude,
    required double longitude,
    required String timeOfDay,
    required String weather,
    required List<String> dietaryPrefs,
  }) async {
    final response = await _dio.post('/dishes/meal-suggestions', data: {
      'latitude': latitude,
      'longitude': longitude,
      'timeOfDay': timeOfDay,
      'weather': weather,
      'dietaryPrefs': dietaryPrefs,
    });

    return (response.data['suggestions'] as List)
        .map((json) => Dish.fromJson(json))
        .toList();
  }
}

// Data models matching your backend response
class DishesResponse {
  final String location;
  final List<Dish> dishes;
  final Metadata metadata;
  final Gamification? gamification;

  DishesResponse({
    required this.location,
    required this.dishes,
    required this.metadata,
    this.gamification,
  });

  factory DishesResponse.fromJson(Map<String, dynamic> json) {
    return DishesResponse(
      location: json['location'] ?? '',
      dishes: (json['dishes'] as List? ?? [])
          .map((d) => Dish.fromJson(d))
          .toList(),
      metadata: Metadata.fromJson(json['metadata'] ?? {}),
      gamification: json['gamification'] != null 
          ? Gamification.fromJson(json['gamification'])
          : null,
    );
  }
}

class Dish {
  final String name;
  final String description;
  final String averagePrice;
  final String category;
  final List<RecommendedPlace> recommendedPlaces;
  final List<String> userPhotos;
  final List<String> dietaryTags;
  final String culturalSignificance;

  Dish({
    required this.name,
    required this.description,
    required this.averagePrice,
    required this.category,
    required this.recommendedPlaces,
    required this.userPhotos,
    required this.dietaryTags,
    required this.culturalSignificance,
  });

  factory Dish.fromJson(Map<String, dynamic> json) {
    return Dish(
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      averagePrice: json['average_price'] ?? '',
      category: json['category'] ?? '',
      recommendedPlaces: (json['recommended_places'] as List? ?? [])
          .map((p) => RecommendedPlace.fromJson(p))
          .toList(),
      userPhotos: List<String>.from(json['user_photos'] ?? []),
      dietaryTags: List<String>.from(json['dietary_tags'] ?? []),
      culturalSignificance: json['cultural_significance'] ?? '',
    );
  }
}

class RecommendedPlace {
  final String name;
  final String type;
  final String address;
  final double rating;
  final String? placeId;
  final int? priceLevel;

  RecommendedPlace({
    required this.name,
    required this.type,
    required this.address,
    required this.rating,
    this.placeId,
    this.priceLevel,
  });

  factory RecommendedPlace.fromJson(Map<String, dynamic> json) {
    return RecommendedPlace(
      name: json['name'] ?? '',
      type: json['type'] ?? '',
      address: json['address'] ?? '',
      rating: (json['rating'] ?? 0).toDouble(),
      placeId: json['place_id'],
      priceLevel: json['price_level'],
    );
  }
}

class Metadata {
  final List<String> source;
  final List<String> filtersApplied;
  final List<String> signatureDishes;
  final String mealContext;

  Metadata({
    required this.source,
    required this.filtersApplied,
    required this.signatureDishes,
    required this.mealContext,
  });

  factory Metadata.fromJson(Map<String, dynamic> json) {
    return Metadata(
      source: List<String>.from(json['source'] ?? []),
      filtersApplied: List<String>.from(json['filters_applied'] ?? []),
      signatureDishes: List<String>.from(json['signature_dishes'] ?? []),
      mealContext: json['meal_context'] ?? '',
    );
  }
}

class Gamification {
  final String badgeProgress;
  final List<String> achievements;
  final String nextMilestone;

  Gamification({
    required this.badgeProgress,
    required this.achievements,
    required this.nextMilestone,
  });

  factory Gamification.fromJson(Map<String, dynamic> json) {
    return Gamification(
      badgeProgress: json['badge_progress'] ?? '',
      achievements: List<String>.from(json['achievements'] ?? []),
      nextMilestone: json['next_milestone'] ?? '',
    );
  }
}

// Usage in your app
class DishesProvider extends ChangeNotifier {
  DishesResponse? _dishesResponse;
  bool _isLoading = false;
  String? _error;

  DishesResponse? get dishesResponse => _dishesResponse;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadDishes({
    double? latitude,
    double? longitude,
    String? destination,
    Map<String, dynamic>? filters,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _dishesResponse = await DishesApiService.getLocalDishes(
        latitude: latitude,
        longitude: longitude,
        destination: destination,
        filters: filters,
      );
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

// Example usage with filters
/*
final dishesProvider = context.read<DishesProvider>();

// Load dishes with filters
await dishesProvider.loadDishes(
  latitude: 6.9271,
  longitude: 79.8612,
  filters: {
    'dietary': ['vegetarian', 'halal'],
    'budget': 'mid-range',
    'cuisine': 'Sri Lankan'
  },
);

// Or search by destination
await dishesProvider.loadDishes(
  destination: 'Colombo, Sri Lanka',
  filters: {
    'dietary': ['vegan'],
    'budget': 'budget'
  },
);
*/