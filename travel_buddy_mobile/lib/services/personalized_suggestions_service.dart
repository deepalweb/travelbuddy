import '../models/place.dart';

class PersonalizedSuggestion {
  final String id;
  final String name;
  final String type;
  final double rating;
  final String distance;
  final String emoji;
  final String category;
  final int priceLevel;
  final String? trend;
  final String? match;
  final String? busyStatus;
  final String? specialOffer;
  final String? personalReason;
  final String? timeRelevance;

  PersonalizedSuggestion({
    required this.id,
    required this.name,
    required this.type,
    required this.rating,
    required this.distance,
    required this.emoji,
    required this.category,
    this.priceLevel = 2,
    this.trend,
    this.match,
    this.busyStatus,
    this.specialOffer,
    this.personalReason,
    this.timeRelevance,
  });

  String get priceDisplay {
    return '\$' * priceLevel;
  }
}

class PersonalizedSuggestionsService {
  static final PersonalizedSuggestionsService _instance = PersonalizedSuggestionsService._internal();
  factory PersonalizedSuggestionsService() => _instance;
  PersonalizedSuggestionsService._internal();

  Future<List<PersonalizedSuggestion>> getSuggestions({
    required String userId,
    required List<String> interests,
    required double latitude,
    required double longitude,
  }) async {
    // Generate personalized suggestions based on user interests and location
    return [
      PersonalizedSuggestion(
        id: '1',
        name: 'Local Café',
        type: 'cafe',
        rating: 4.5,
        distance: '0.3 km',
        emoji: '☕',
        category: 'food',
        priceLevel: 2,
        personalReason: 'Matches your coffee interests',
      ),
      PersonalizedSuggestion(
        id: '2',
        name: 'City Museum',
        type: 'museum',
        rating: 4.8,
        distance: '1.2 km',
        emoji: '🏛️',
        category: 'culture',
        priceLevel: 3,
        personalReason: 'Based on your interest in history',
      ),
    ];
  }

  Future<List<Place>> getPersonalizedSuggestions() async {
    // Convert PersonalizedSuggestion to Place for compatibility
    final suggestions = await generateSuggestions(
      userInterests: ['food', 'culture', 'adventure'],
      nearbyPlaces: [],
      timeOfDay: 'day',
    );
    
    return suggestions.map((s) => Place(
      id: s.id,
      name: s.name,
      type: s.type,
      address: '${s.distance} away',
      rating: s.rating,
      photoUrl: '',
      description: 'AI-powered suggestion based on your interests',
      localTip: 'Recommended for you',
      handyPhrase: 'Hello, thank you!',
    )).toList();
  }

  Future<List<PersonalizedSuggestion>> generateSuggestions({
    required List<String> userInterests,
    required List<Place> nearbyPlaces,
    required String timeOfDay,
    String weather = 'sunny',
  }) async {
    await Future.delayed(const Duration(milliseconds: 500)); // Simulate API call

    final suggestions = <PersonalizedSuggestion>[];
    final hour = DateTime.now().hour;

    // Perfect Timing suggestions (NEW)
    suggestions.addAll(_getPerfectTimingSuggestions(hour));
    
    // Weather-Smart suggestions (NEW)
    suggestions.addAll(_getWeatherSmartSuggestions(weather));
    
    // Enhanced Interest-based suggestions
    suggestions.addAll(_getInterestBasedSuggestions(userInterests));
    
    // Enhanced Trending suggestions
    suggestions.addAll(_getTrendingSuggestions());
    
    // Enhanced AI match suggestions
    suggestions.addAll(_getAIMatchSuggestions());

    return suggestions;
  }

  List<PersonalizedSuggestion> _getInterestBasedSuggestions(List<String> interests) {
    return [
      PersonalizedSuggestion(
        id: 'interest-1',
        name: 'Rooftop Bar Vista',
        type: 'Nightlife',
        rating: 4.8,
        distance: '0.3km',
        emoji: '🍸',
        category: 'interest',
        priceLevel: 3,
        busyStatus: 'Quiet now',
        personalReason: '92% match for your nightlife taste',
        specialOffer: 'Happy hour until 7 PM',
      ),
      PersonalizedSuggestion(
        id: 'interest-2',
        name: 'Adventure Park',
        type: 'Adventure',
        rating: 4.6,
        distance: '1.2km',
        emoji: '🧗',
        category: 'interest',
        priceLevel: 2,
        busyStatus: 'Peak hours',
        personalReason: 'Perfect for adventure seekers',
      ),
      PersonalizedSuggestion(
        id: 'interest-3',
        name: 'Local Food Market',
        type: 'Food',
        rating: 4.7,
        distance: '0.8km',
        emoji: '🍜',
        category: 'interest',
        priceLevel: 1,
        busyStatus: 'Moderately busy',
        personalReason: 'Based on your foodie profile',
      ),
    ];
  }

  List<PersonalizedSuggestion> _getTrendingSuggestions() {
    return [
      PersonalizedSuggestion(
        id: 'trending-1',
        name: 'New Art Gallery',
        type: 'Culture',
        rating: 4.9,
        distance: '0.4km',
        emoji: '🎨',
        category: 'trending',
        priceLevel: 2,
        trend: '+45% visits today',
        busyStatus: '127 people visited today',
        specialOffer: 'Free entry this week',
      ),
      PersonalizedSuggestion(
        id: 'trending-2',
        name: 'Pop-up Food Festival',
        type: 'Event',
        rating: 4.5,
        distance: '0.6km',
        emoji: '🎪',
        category: 'trending',
        priceLevel: 2,
        trend: 'Trending this weekend',
        busyStatus: 'Very popular now',
      ),
    ];
  }

  List<PersonalizedSuggestion> _getAIMatchSuggestions() {
    return [
      PersonalizedSuggestion(
        id: 'ai-1',
        name: 'Artisan Coffee Co.',
        type: 'Similar vibe',
        rating: 4.7,
        distance: '0.5km',
        emoji: '☕',
        category: 'ai-match',
        priceLevel: 2,
        match: '95% match',
        personalReason: 'Because you loved Italian cuisine',
        busyStatus: 'Perfect timing',
      ),
      PersonalizedSuggestion(
        id: 'ai-2',
        name: 'Cozy Book Café',
        type: 'Similar atmosphere',
        rating: 4.6,
        distance: '0.7km',
        emoji: '📚',
        category: 'ai-match',
        priceLevel: 1,
        match: '88% match',
        personalReason: 'Based on your 5-star ratings',
        busyStatus: 'Quiet atmosphere',
      ),
    ];
  }

  List<PersonalizedSuggestion> _getPerfectTimingSuggestions(int hour) {
    if (hour >= 11 && hour <= 14) {
      return [
        PersonalizedSuggestion(
          id: 'timing-1',
          name: 'Lunch Bistro',
          type: 'Restaurant',
          rating: 4.5,
          distance: '0.2km',
          emoji: '🍽️',
          category: 'perfect-timing',
          priceLevel: 2,
          timeRelevance: 'Great for lunch right now',
          busyStatus: 'No wait time',
        ),
      ];
    } else if (hour >= 17 && hour <= 19) {
      return [
        PersonalizedSuggestion(
          id: 'timing-2',
          name: 'Sunset Viewpoint',
          type: 'Scenic',
          rating: 4.8,
          distance: '0.9km',
          emoji: '🌅',
          category: 'perfect-timing',
          priceLevel: 0,
          timeRelevance: 'Perfect sunset spot (6:45 PM)',
          busyStatus: 'Best time to visit',
        ),
      ];
    } else if (hour >= 22 || hour <= 2) {
      return [
        PersonalizedSuggestion(
          id: 'timing-3',
          name: '24/7 Diner',
          type: 'Late Night',
          rating: 4.3,
          distance: '0.4km',
          emoji: '🌙',
          category: 'perfect-timing',
          priceLevel: 1,
          timeRelevance: 'Open late tonight',
          busyStatus: 'Peaceful atmosphere',
        ),
      ];
    }
    return [];
  }

  List<PersonalizedSuggestion> _getWeatherSmartSuggestions(String weather) {
    if (weather == 'sunny') {
      return [
        PersonalizedSuggestion(
          id: 'weather-1',
          name: 'Outdoor Market',
          type: 'Shopping',
          rating: 4.4,
          distance: '0.6km',
          emoji: '☀️',
          category: 'weather-smart',
          priceLevel: 1,
          timeRelevance: 'Perfect for this sunny day',
          busyStatus: 'Great weather crowds',
        ),
      ];
    } else if (weather == 'rainy') {
      return [
        PersonalizedSuggestion(
          id: 'weather-2',
          name: 'Indoor Museum',
          type: 'Culture',
          rating: 4.6,
          distance: '0.3km',
          emoji: '🏛️',
          category: 'weather-smart',
          priceLevel: 2,
          timeRelevance: 'Great indoor option for rain',
          busyStatus: 'Cozy and dry',
        ),
      ];
    }
    return [];
  }
}