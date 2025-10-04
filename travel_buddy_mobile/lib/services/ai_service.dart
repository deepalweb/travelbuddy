import 'dart:math';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../config/environment.dart';
import '../models/place.dart';
import '../models/trip.dart';

class AiService {
  static final AiService _instance = AiService._internal();
  factory AiService() => _instance;
  AiService._internal();

  late final Dio _dio;

  void initialize() {
    _dio = Dio(BaseOptions(
      baseUrl: Environment.backendUrl,
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
      headers: {'Content-Type': 'application/json'},
    ));
  }

  Future<String> generatePlaceDescription(Place place) async {
    try {
      final response = await _dio.post('/api/enrichment/batch', data: {
        'items': [{
          'place_id': place.id,
          'name': place.name,
          'formatted_address': place.address,
          'types': [place.type],
          'rating': place.rating,
        }],
        'lang': 'en'
      });
      
      if (response.statusCode == 200) {
        final data = response.data;
        final cached = data['cached'] ?? {};
        final enriched = cached[place.id];
        if (enriched != null && enriched['description'] != null) {
          return enriched['description'];
        }
      }
    } catch (e) {
      print('AI description error: $e');
    }
    return _generateFallbackDescription(place);
  }
  
  Future<String> generateLocalTip(Place place) async {
    try {
      final response = await _dio.post('/api/enrichment/batch', data: {
        'items': [{
          'place_id': place.id,
          'name': place.name,
          'formatted_address': place.address,
          'types': [place.type],
          'rating': place.rating,
        }],
        'lang': 'en'
      });
      
      if (response.statusCode == 200) {
        final data = response.data;
        final cached = data['cached'] ?? {};
        final enriched = cached[place.id];
        if (enriched != null && enriched['localTip'] != null) {
          return enriched['localTip'];
        }
      }
    } catch (e) {
      print('AI local tip error: $e');
    }
    return _generateFallbackLocalTip(place);
  }
  
  String _generateFallbackLocalTip(Place place) {
    final tips = {
      'restaurant': 'Try to visit during off-peak hours for better service',
      'museum': 'Check for free admission days or student discounts',
      'park': 'Best visited early morning or late afternoon',
      'attraction': 'Book tickets online to skip the lines',
      'hotel': 'Ask about room upgrades at check-in',
      'shopping': 'Look for local artisan products for unique souvenirs',
    };
    
    for (final key in tips.keys) {
      if (place.type.toLowerCase().contains(key)) {
        return tips[key]!;
      }
    }
    
    return 'Check opening hours and peak times before visiting';
  }

  Future<TripPlan?> generateSmartTripPlan({
    required String destination,
    required String duration,
    required String interests,
    String pace = 'Moderate',
    List<String> travelStyles = const [],
    String budget = 'Mid-Range',
  }) async {
    try {
      final response = await _dio.post('/api/ai/generate-trip-plan', data: {
        'destination': destination,
        'duration': duration,
        'interests': interests,
        'pace': pace,
        'travelStyles': travelStyles,
        'budget': budget,
      });
      
      if (response.statusCode == 200) {
        return TripPlan.fromJson(response.data);
      }
    } catch (e) {
      print('AI trip plan error: $e');
    }
    
    // Enhanced fallback with better structure
    return _generateEnhancedFallbackTripPlan(
      destination: destination,
      duration: duration,
      interests: interests,
      pace: pace,
      travelStyles: travelStyles,
      budget: budget,
    );
  }

  Future<OneDayItinerary?> generateDayItinerary({
    required String location,
    required String interests,
    List<Place> nearbyPlaces = const [],
  }) async {
    print('🤖 ATTEMPTING OpenAI API call for day itinerary...');
    print('🌐 Backend URL: ${Environment.backendUrl}');
    print('📍 Location: $location');
    print('🎯 Interests: $interests');
    
    try {
      final response = await _dio.post('/api/ai/generate-text', data: {
        'prompt': 'Generate a day itinerary for $location with interests: $interests. Return JSON format with title, introduction, dailyPlan array with activities (timeOfDay, activityTitle, description), and conclusion.',
      });
      
      print('📡 API Response Status: ${response.statusCode}');
      print('📄 API Response Data: ${response.data}');
      
      if (response.statusCode == 200 && response.data['itinerary'] != null) {
        print('✅ SUCCESS: OpenAI generated day itinerary!');
        final itineraryData = response.data['itinerary'];
        return OneDayItinerary(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: itineraryData['title'] ?? 'Day in $location',
          introduction: itineraryData['introduction'] ?? 'Explore $location',
          dailyPlan: (itineraryData['dailyPlan'] as List? ?? []).map((activity) => 
            ActivityDetail(
              timeOfDay: activity['timeOfDay'] ?? 'All day',
              activityTitle: activity['activityTitle'] ?? 'Activity',
              description: activity['description'] ?? 'Enjoy this activity',
            )
          ).toList(),
          conclusion: itineraryData['conclusion'] ?? 'Have a great day!',
        );
      } else {
        print('⚠️ API returned success but no itinerary data');
      }
    } catch (e) {
      print('❌ OpenAI API FAILED: $e');
      if (e.toString().contains('SocketException')) {
        print('🌐 Network error - backend unreachable');
      } else if (e.toString().contains('TimeoutException')) {
        print('⏰ Timeout - backend too slow');
      } else if (e.toString().contains('404')) {
        print('🔍 Endpoint not found - /api/ai/generate-text missing');
      }
    }
    
    print('🔄 FALLING BACK to enhanced templates');
    return _generateFallbackDayItinerary(location, interests, nearbyPlaces);
  }

  String _generateFallbackDescription(Place place) {
    final type = place.type.isNotEmpty ? place.type : 'location';
    final rating = place.rating > 0 ? ' with a ${place.rating.toStringAsFixed(1)}-star rating' : '';
    
    return '${place.name} is a popular $type in the area$rating. '
           'This destination offers visitors a unique experience with its distinctive character and local charm. '
           'Whether you\'re interested in exploring, dining, or simply enjoying the atmosphere, this location provides '
           'an authentic taste of the local culture and attractions.';
  }

  TripPlan _generateEnhancedFallbackTripPlan({
    required String destination,
    required String duration,
    required String interests,
    String pace = 'Moderate',
    List<String> travelStyles = const [],
    String budget = 'Mid-Range',
  }) {
    final days = int.tryParse(duration.split(' ').first) ?? 3;
    final dailyPlans = <DailyTripPlan>[];
    final tripStyle = travelStyles.isNotEmpty ? travelStyles.join(', ') : 'Adventure';
    
    // Add randomization for variety
    final planVariation = DateTime.now().millisecond % 3;
    final titleVariations = [
      '✈️ Ultimate $destination Adventure',
      '🌟 Discover $destination Experience', 
      '🗺️ $destination Journey Awaits'
    ];
    
    for (int i = 0; i < days; i++) {
      dailyPlans.add(DailyTripPlan(
        day: i + 1,
        title: _getDynamicDayTitle(i + 1, destination, interests, travelStyles, planVariation),
        theme: _getDynamicDayTheme(i + 1, destination, travelStyles, planVariation),
        activities: _generateVariedDayActivities(i + 1, destination, interests, travelStyles, pace, budget, planVariation),
      ));
    }
    
    return TripPlan(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      tripTitle: titleVariations[planVariation],
      destination: destination,
      duration: duration,
      introduction: _generateDynamicIntroduction(destination, interests, travelStyles, budget, planVariation),
      dailyPlans: dailyPlans,
      conclusion: _generateDynamicConclusion(destination, days, planVariation),
      accommodationSuggestions: _generateAccommodationSuggestions(destination, budget),
      transportationTips: _generateTransportationTips(destination, budget),
      budgetConsiderations: _generateBudgetConsiderations(destination, budget, days),
    );
  }

  String _getDynamicDayTitle(int day, String destination, String interests, List<String> travelStyles, int variation) {
    final themeVariations = [
      {
        1: 'Arrival & First Impressions',
        2: 'Cultural Exploration', 
        3: 'Adventure & Discovery',
        4: 'Local Experiences',
        5: 'Hidden Gems',
      },
      {
        1: 'Welcome to $destination',
        2: 'Immerse in Local Culture',
        3: 'Discover & Explore', 
        4: 'Authentic Local Life',
        5: 'Secret Spots & Treasures',
      },
      {
        1: 'First Day Magic',
        2: 'Heritage & Traditions',
        3: 'Adventure Awaits',
        4: 'Connect with Locals', 
        5: 'Off the Beaten Path',
      }
    ];
    
    final themes = themeVariations[variation];
    if (day <= 5 && themes.containsKey(day)) {
      return 'Day $day: ${themes[day]}';
    }
    
    final style = travelStyles.isNotEmpty ? travelStyles.first : 'Exploration';
    return 'Day $day: $style in $destination';
  }
  
  String _getDynamicDayTheme(int day, String destination, List<String> travelStyles, int variation) {
    final themeVariations = [
      {
        1: 'Cultural Immersion in Old Town',
        2: 'Local Experiences & Hidden Gems',
        3: 'Adventure & Nature Discovery',
        4: 'Food & Market Exploration',
        5: 'Relaxation & Scenic Views',
      },
      {
        1: 'Historic Heart & Local Flavors',
        2: 'Artisan Quarters & Craft Culture',
        3: 'Outdoor Adventures & Natural Beauty',
        4: 'Culinary Journey & Street Life',
        5: 'Peaceful Retreats & Panoramic Views',
      },
      {
        1: 'Ancient Streets & Modern Vibes',
        2: 'Creative Districts & Local Artists',
        3: 'Wild Spaces & Active Pursuits', 
        4: 'Market Life & Gastronomic Delights',
        5: 'Tranquil Escapes & Sunset Spots',
      }
    ];
    
    final themes = themeVariations[variation];
    if (day <= 5 && themes.containsKey(day)) {
      return themes[day]!;
    }
    
    final style = travelStyles.isNotEmpty ? travelStyles.first : 'Exploration';
    return '$style Discovery in $destination';
  }

  List<ActivityDetail> _generateVariedDayActivities(int day, String destination, String interests, 
      List<String> travelStyles, String pace, String budget, int variation) {
    final activities = <ActivityDetail>[];
    
    // Morning activity with variation
    activities.add(ActivityDetail(
      timeOfDay: _getVariedTimeSlot('morning', variation),
      activityTitle: _getVariedMorningActivity(day, interests, travelStyles, variation),
      description: _getVariedMorningDescription(day, destination, interests, variation),
      estimatedDuration: '2-3 hrs',
      location: _getVariedLocation(destination, 'morning', variation),
      notes: _getVariedMorningNotes(day, interests, variation),
      icon: _getMorningIcon(day, interests, travelStyles),
      category: _getMorningCategory(interests, travelStyles),
    ));
    
    // Afternoon activity with variation
    activities.add(ActivityDetail(
      timeOfDay: _getVariedTimeSlot('afternoon', variation),
      activityTitle: _getVariedAfternoonActivity(day, interests, travelStyles, variation),
      description: _getVariedAfternoonDescription(day, destination, interests, budget, variation),
      estimatedDuration: '3 hrs',
      location: _getVariedLocation(destination, 'afternoon', variation),
      notes: _getVariedAfternoonNotes(budget, variation),
      icon: _getAfternoonIcon(interests, travelStyles),
      category: _getAfternoonCategory(interests, travelStyles),
    ));
    
    // Evening activity with variation
    activities.add(ActivityDetail(
      timeOfDay: _getVariedTimeSlot('evening', variation),
      activityTitle: _getVariedEveningActivity(day, interests, travelStyles, budget, variation),
      description: _getVariedEveningDescription(day, destination, budget, variation),
      estimatedDuration: '2.5 hrs',
      location: _getVariedLocation(destination, 'evening', variation),
      notes: _getVariedEveningNotes(budget, travelStyles, variation),
      icon: _getEveningIcon(travelStyles, budget),
      category: _getEveningCategory(travelStyles, budget),
    ));
    
    return activities;
  }
  
  String _getVariedTimeSlot(String period, int variation) {
    final timeVariations = {
      'morning': [
        'Morning: 9:00 AM - 1:00 PM',
        'Morning: 8:30 AM - 12:30 PM', 
        'Morning: 9:30 AM - 1:30 PM'
      ],
      'afternoon': [
        'Afternoon: 2:00 PM - 5:00 PM',
        'Afternoon: 1:30 PM - 4:30 PM',
        'Afternoon: 2:30 PM - 5:30 PM'
      ],
      'evening': [
        'Evening: 7:00 PM onwards',
        'Evening: 6:30 PM onwards',
        'Evening: 7:30 PM onwards'
      ]
    };
    return timeVariations[period]![variation];
  }
  
  String _getVariedLocation(String destination, String period, int variation) {
    final locationVariations = {
      'morning': [
        '$destination City Center',
        '$destination Historic District',
        '$destination Old Town'
      ],
      'afternoon': [
        '$destination Historic Quarter',
        '$destination Cultural District',
        '$destination Arts Quarter'
      ],
      'evening': [
        '$destination Waterfront',
        '$destination Riverside',
        '$destination Marina District'
      ]
    };
    return locationVariations[period]![variation];
  }
  
  String _getVariedMorningActivity(int day, String interests, List<String> travelStyles, int variation) {
    if (day == 1) {
      final activities = [
        'Arrival & City Orientation',
        'Welcome to the City Experience',
        'First Impressions Walking Tour'
      ];
      return activities[variation];
    }
    
    if (interests.toLowerCase().contains('culture')) {
      final activities = [
        'Cultural Sites Visit',
        'Heritage Discovery Tour',
        'Local Traditions Experience'
      ];
      return activities[variation];
    }
    
    final defaultActivities = [
      'Local Landmarks Tour',
      'Neighborhood Exploration',
      'City Highlights Walk'
    ];
    return defaultActivities[variation];
  }
  
  String _getVariedMorningDescription(int day, String destination, String interests, int variation) {
    if (day == 1) {
      final descriptions = [
        '🌅 Welcome to $destination! Start with breakfast at a local café (try the regional specialty). '
        'Take the hop-on-hop-off bus tour (\$25-35) for city orientation. '
        'Visit the Tourist Information Center for maps and discount cards.',
        
        '☀️ Your $destination adventure begins! Fuel up with authentic local breakfast (\$8-15). '
        'Join a welcome walking tour to get oriented (\$20-30). '
        'Collect city maps and discover discount opportunities.',
        
        '🗺️ First day magic in $destination! Experience morning café culture (\$10-18). '
        'Take a self-guided orientation walk through main areas. '
        'Visit the visitor center for insider tips and local recommendations.'
      ];
      return descriptions[variation];
    }
    
    final descriptions = [
      '🏛️ Explore $destination\'s cultural treasures. Visit the main museum (\$15-25). '
      'Take a guided walking tour focusing on $interests (\$20-30). '
      'Stop at local artisan shops for authentic souvenirs.',
      
      '🎨 Dive deep into $destination\'s heritage. Discover hidden cultural gems (\$12-20). '
      'Join locals on their morning routines and cultural practices. '
      'Experience authentic craftsmanship at traditional workshops.',
      
      '🌟 Uncover $destination\'s authentic character. Explore beyond tourist paths. '
      'Connect with local culture through community spaces and markets. '
      'Learn stories that guidebooks don\'t tell.'
    ];
    return descriptions[variation];
  }

  String _getMorningActivity(int day, String interests, List<String> travelStyles) {
    if (day == 1) return 'Arrival & City Orientation';
    if (interests.toLowerCase().contains('culture')) return 'Cultural Sites Visit';
    if (interests.toLowerCase().contains('nature')) return 'Nature Exploration';
    if (travelStyles.contains('Adventure')) return 'Adventure Activity';
    return 'Local Landmarks Tour';
  }

  String _getMorningDescription(int day, String destination, String interests) {
    if (day == 1) {
      return '🌅 Welcome to $destination! Start with breakfast at a local café (try the regional specialty). '
             'Take the hop-on-hop-off bus tour (\$25-35) for city orientation. '
             'Visit the Tourist Information Center for maps and discount cards. '
             'Walk through the main square and take photos at iconic landmarks. '
             'Download local transport apps and buy a day pass (\$8-12).';
    }
    return '🏛️ Explore $destination\'s cultural treasures. Visit the main museum (\$15-25, audio guide +\$5). '
           'Take a guided walking tour focusing on $interests (\$20-30, 2 hours). '
           'Stop at local artisan shops for authentic souvenirs. '
           'Try street food from vendors (\$3-8 per item). '
           'Visit viewpoints for panoramic city photos.';
  }

  String _getAfternoonActivity(int day, String interests, List<String> travelStyles) {
    if (interests.toLowerCase().contains('food')) return 'Culinary Experience';
    if (interests.toLowerCase().contains('shopping')) return 'Local Markets & Shopping';
    if (travelStyles.contains('Nature')) return 'Outdoor Recreation';
    return 'Interactive Local Experience';
  }

  String _getAfternoonDescription(int day, String destination, String interests, String budget) {
    final budgetNote = budget == 'Budget-Friendly' ? 'affordable' : budget == 'Luxury' ? 'premium' : 'mid-range';
    if (interests.toLowerCase().contains('food')) {
      return '🍽️ Culinary adventure awaits! Join a cooking class (\$45-80, 3 hours) or food tour (\$35-60). '
             'Visit the central market for fresh ingredients and local delicacies. '
             'Try 3-4 signature dishes at different $budgetNote restaurants. '
             'Learn about local food culture and dining etiquette. '
             'Buy spices or local products to take home (\$10-25).';
    }
    if (interests.toLowerCase().contains('culture')) {
      return '🎨 Cultural immersion time! Visit 2-3 museums or galleries (\$12-20 each). '
             'Attend a traditional performance or workshop (\$25-45). '
             'Explore historic neighborhoods with local architecture. '
             'Meet local artists at their studios or craft centers. '
             'Purchase authentic handmade items (\$15-50).';
    }
    return '🎯 Experience $destination like a local! Join a $budgetNote activity related to $interests. '
           'Interact with residents through community tours or workshops (\$20-40). '
           'Visit local markets and try regional specialties (\$5-15). '
           'Take photos at Instagram-worthy spots with perfect lighting.';
  }

  String _getEveningActivity(int day, String interests, List<String> travelStyles, String budget) {
    if (interests.toLowerCase().contains('nightlife')) return 'Evening Entertainment';
    if (travelStyles.contains('Romantic')) return 'Romantic Evening';
    if (budget == 'Luxury') return 'Fine Dining Experience';
    return 'Local Dining & Relaxation';
  }

  String _getEveningDescription(int day, String destination, String budget) {
    if (budget == 'Luxury') {
      return '🍾 Luxury evening experience! Dine at a Michelin-starred restaurant (\$150-300 per person). '
             'Enjoy cocktails at a rooftop bar with city views (\$15-25 per drink). '
             'Take a private sunset cruise or helicopter tour (\$200-400). '
             'End with premium spa treatment or private city tour (\$100-200).';
    }
    if (budget == 'Budget-Friendly') {
      return '🌆 Budget-friendly evening fun! Try local street food dinner (\$8-15 total). '
             'Join free walking tours or attend free outdoor events. '
             'Visit local pubs or cafés for drinks (\$3-8 each). '
             'Explore night markets or evening festivals (often free). '
             'Take sunset photos at free viewpoints.';
    }
    return '🌃 Perfect evening in $destination! Dinner at a recommended local restaurant (\$25-45 per person). '
           'Try regional wine or beer (\$6-12 per glass). '
           'Take an evening stroll through illuminated historic areas. '
           'Visit local bars or live music venues (\$10-20 cover). '
           'End with dessert at a famous local café (\$5-10).';
  }
  
  // Enhanced activity metadata methods
  String _getMorningNotes(int day, String interests) {
    if (day == 1) return '📱 Download city app, get SIM card (\$10-20), exchange money, keep hotel card, wear comfortable shoes';
    if (interests.toLowerCase().contains('culture')) return '🎧 Audio guide recommended (\$5-8), photography rules vary, student discounts available, free WiFi in most museums';
    if (interests.toLowerCase().contains('nature')) return '🥾 Wear hiking boots, bring water (\$2-3), check weather, sunscreen essential, trail maps available';
    return '🎫 Book online for discounts, arrive early (9-10 AM), bring water, comfortable shoes, phone charger';
  }
  
  String _getAfternoonNotes(String budget) {
    switch (budget) {
      case 'Budget-Friendly': return '💰 Lunch specials 11-3 PM, free samples at markets, happy hour 4-6 PM, group discounts available, tap water is free';
      case 'Luxury': return '👔 Reservations essential, smart casual dress, valet parking (\$15-25), sommelier available, dietary restrictions accommodated';
      default: return '🍴 Try daily specials, ask locals for recommendations, 15-20% tip expected, credit cards accepted, vegetarian options available';
    }
  }
  
  String _getEveningNotes(String budget, List<String> travelStyles) {
    if (travelStyles.contains('Romantic')) return '💕 Perfect for couples, sunset at 7:30 PM, book window table, bring camera, dress nicely, share dessert';
    if (budget == 'Luxury') return '🥂 Smart casual required, advance booking essential, valet available, wine pairing recommended (\$40-80), late seating available';
    if (travelStyles.contains('Family-Friendly')) return '👨‍👩‍👧‍👦 Kids menu available, high chairs provided, early dinner recommended (5-7 PM), playground nearby, family restrooms';
    return '🌙 Check weather, bring light jacket, last entry 9 PM, night photography tips available, safe walking routes marked';
  }
  
  String _getMorningIcon(int day, String interests, List<String> travelStyles) {
    if (day == 1) return '🚂';
    if (interests.toLowerCase().contains('culture')) return '🏛️';
    if (travelStyles.contains('Adventure')) return '🧗';
    return '🗺️';
  }
  
  String _getAfternoonIcon(String interests, List<String> travelStyles) {
    if (interests.toLowerCase().contains('food')) return '🍽️';
    if (interests.toLowerCase().contains('shopping')) return '🛍️';
    if (travelStyles.contains('Nature')) return '🌳';
    return '🎨';
  }
  
  String _getEveningIcon(List<String> travelStyles, String budget) {
    if (travelStyles.contains('Romantic')) return '🌅';
    if (budget == 'Luxury') return '🍾';
    return '🌆';
  }
  
  String _getMorningCategory(String interests, List<String> travelStyles) {
    if (interests.toLowerCase().contains('culture')) return 'culture';
    if (travelStyles.contains('Adventure')) return 'adventure';
    return 'sightseeing';
  }
  
  String _getAfternoonCategory(String interests, List<String> travelStyles) {
    if (interests.toLowerCase().contains('food')) return 'food';
    if (interests.toLowerCase().contains('shopping')) return 'shopping';
    if (travelStyles.contains('Nature')) return 'nature';
    return 'experience';
  }
  
  String _getEveningCategory(List<String> travelStyles, String budget) {
    if (travelStyles.contains('Romantic')) return 'romantic';
    if (budget == 'Luxury') return 'luxury';
    return 'dining';
  }

  String _generateDynamicIntroduction(String destination, String interests, List<String> travelStyles, String budget, int variation) {
    final introVariations = [
      '✨ Welcome, Traveler!\n\n'
      'Get ready for your personalized trip to $destination! We\'ve crafted this itinerary based on your interests in $interests. '
      'Each day offers unique experiences that capture the essence of local culture and adventure.\n\n'
      '🗺️ Your Journey Awaits\n'
      'Curated experiences, authentic encounters, memorable moments\n'
      'Budget-conscious planning for $budget travelers\n'
      'Local insights and hidden gems included',
      
      '🌟 Adventure Begins Here!\n\n'
      'Welcome to your $destination discovery! This carefully planned journey celebrates your passion for $interests '
      'while revealing the authentic spirit of this incredible destination.\n\n'
      '🎯 What Makes This Special\n'
      'Handpicked locations, cultural immersion, local connections\n'
      'Thoughtfully designed for $budget experiences\n'
      'Flexible timing with insider recommendations',
      
      '🗺️ Your $destination Story Starts Now!\n\n'
      'Embark on a journey tailored to your love of $interests. Every recommendation comes from deep local knowledge '
      'and authentic experiences that go beyond typical tourist paths.\n\n'
      '✨ Journey Highlights\n'
      'Authentic experiences, cultural connections, memorable encounters\n'
      'Carefully budgeted for $budget travel style\n'
      'Local secrets and community favorites'
    ];
    
    return introVariations[variation];
  }
  
  String _generateDynamicConclusion(String destination, int days, int variation) {
    final conclusionVariations = [
      '✅ Journey Complete!\n\n'
      'Your $days-day adventure in $destination comes to an end, but the memories will last forever! '
      'This itinerary provided a comprehensive taste of what makes this destination special, '
      'from iconic landmarks to hidden local gems.\n\n'
      '🎆 Safe travels, and we hope you\'ll return to explore even more of $destination!',
      
      '🌟 What an Amazing Adventure!\n\n'
      'After $days incredible days in $destination, you\'ve experienced the heart and soul of this remarkable place. '
      'From authentic local encounters to breathtaking discoveries, every moment was crafted for lasting memories.\n\n'
      '✈️ Until next time - $destination will always welcome you back!',
      
      '🎉 Your $destination Story Concludes!\n\n'
      'These $days days have woven together culture, adventure, and authentic connections that define the true spirit of $destination. '
      'You\'ve not just visited - you\'ve experienced this place through the eyes of locals and fellow travelers.\n\n'
      '🌍 The world awaits your next adventure, but $destination will always hold a special place in your heart!'
    ];
    
    return conclusionVariations[variation];
  }

  // Remove duplicate method since we added _generateDynamicConclusion above
  
  // Add helper methods for varied content
  String _getVariedAfternoonActivity(int day, String interests, List<String> travelStyles, int variation) {
    if (interests.toLowerCase().contains('food')) {
      final activities = [
        'Culinary Experience',
        'Food Market Adventure', 
        'Local Cooking Discovery'
      ];
      return activities[variation];
    }
    
    final defaultActivities = [
      'Interactive Local Experience',
      'Community Cultural Immersion',
      'Authentic Local Encounters'
    ];
    return defaultActivities[variation];
  }
  
  String _getVariedAfternoonDescription(int day, String destination, String interests, String budget, int variation) {
    final budgetNote = budget == 'Budget-Friendly' ? 'affordable' : budget == 'Luxury' ? 'premium' : 'mid-range';
    
    if (interests.toLowerCase().contains('food')) {
      final descriptions = [
        '🍽️ Culinary adventure awaits! Join a cooking class (\$45-80) or food tour (\$35-60). '
        'Visit the central market for fresh ingredients and local delicacies. '
        'Try 3-4 signature dishes at different $budgetNote restaurants.',
        
        '👨‍🍳 Dive into local food culture! Learn from home cooks (\$40-70) or street food experts. '
        'Explore neighborhood markets where locals shop daily. '
        'Taste authentic flavors at family-run $budgetNote establishments.',
        
        '🥘 Discover culinary secrets! Join food enthusiasts on market tours (\$30-55). '
        'Learn about regional ingredients and cooking techniques. '
        'Experience dining culture at carefully selected $budgetNote venues.'
      ];
      return descriptions[variation];
    }
    
    final descriptions = [
      '🎯 Experience $destination like a local! Join a $budgetNote activity related to $interests. '
      'Interact with residents through community tours or workshops (\$20-40). '
      'Visit local markets and try regional specialties (\$5-15).',
      
      '🤝 Connect with the community! Participate in local traditions and customs. '
      'Learn from residents about their daily life and culture. '
      'Support local businesses and artisans through authentic experiences.',
      
      '🌟 Authentic cultural exchange! Engage with locals through shared activities. '
      'Discover neighborhood secrets and community gathering places. '
      'Create meaningful connections beyond typical tourist interactions.'
    ];
    return descriptions[variation];
  }
  
  String _getVariedEveningActivity(int day, String interests, List<String> travelStyles, String budget, int variation) {
    if (budget == 'Luxury') {
      final activities = [
        'Fine Dining Experience',
        'Premium Evening Entertainment',
        'Exclusive Sunset Experience'
      ];
      return activities[variation];
    }
    
    final defaultActivities = [
      'Local Dining & Relaxation',
      'Evening Cultural Experience',
      'Sunset & Local Flavors'
    ];
    return defaultActivities[variation];
  }
  
  String _getVariedEveningDescription(int day, String destination, String budget, int variation) {
    if (budget == 'Luxury') {
      final descriptions = [
        '🍾 Luxury evening experience! Dine at a Michelin-starred restaurant (\$150-300 per person). '
        'Enjoy cocktails at a rooftop bar with city views (\$15-25 per drink). '
        'Take a private sunset cruise or helicopter tour (\$200-400).',
        
        '✨ Premium $destination evening! Experience world-class dining (\$180-350). '
        'Sip artisanal cocktails at exclusive venues (\$18-30 per drink). '
        'Enjoy VIP cultural performances or private tours (\$150-300).',
        
        '🥂 Sophisticated night out! Indulge in chef\'s tasting menu (\$200-400). '
        'Experience premium entertainment and nightlife (\$50-100). '
        'End with luxury spa treatment or private city illumination tour (\$100-250).'
      ];
      return descriptions[variation];
    }
    
    final descriptions = [
      '🌃 Perfect evening in $destination! Dinner at a recommended local restaurant (\$25-45 per person). '
      'Try regional wine or beer (\$6-12 per glass). '
      'Take an evening stroll through illuminated historic areas.',
      
      '🌆 Magical $destination sunset! Enjoy dinner with locals at neighborhood favorites (\$20-40). '
      'Sample craft beverages and regional specialties (\$5-10). '
      'Experience the city\'s evening rhythm and community life.',
      
      '🌙 Enchanting evening atmosphere! Dine where residents gather (\$22-38). '
      'Discover evening markets and street food culture (\$8-15). '
      'Join locals for traditional evening activities and entertainment.'
    ];
    return descriptions[variation];
  }
  
  String _getVariedMorningNotes(int day, String interests, int variation) {
    if (day == 1) {
      final notes = [
        '📱 Download city app, get SIM card (\$10-20), exchange money, keep hotel card, wear comfortable shoes',
        '🗺️ Grab offline maps, local transport card (\$8-15), emergency contacts, comfortable walking gear',
        '📞 Set up local connectivity, visitor information, city orientation materials, weather-appropriate clothing'
      ];
      return notes[variation];
    }
    
    final notes = [
      '🎫 Book online for discounts, arrive early (9-10 AM), bring water, comfortable shoes, phone charger',
      '💡 Student discounts available, morning crowds lighter, hydration important, good walking shoes essential',
      '⏰ Early arrival recommended, group rates possible, weather protection, comfortable footwear advised'
    ];
    return notes[variation];
  }
  
  String _getVariedAfternoonNotes(String budget, int variation) {
    switch (budget) {
      case 'Budget-Friendly':
        final notes = [
          '💰 Lunch specials 11-3 PM, free samples at markets, happy hour 4-6 PM, group discounts available',
          '🍽️ Daily deals common, market tastings free, afternoon discounts, bulk booking savings',
          '💵 Midday promotions, complimentary samples, early evening specials, student rates available'
        ];
        return notes[variation];
      case 'Luxury':
        final notes = [
          '👔 Reservations essential, smart casual dress, valet parking (\$15-25), sommelier available',
          '🎩 Advance booking required, elegant attire, premium parking, wine expert on-site',
          '✨ Prior arrangements needed, refined dress code, concierge parking, beverage specialist present'
        ];
        return notes[variation];
      default:
        final notes = [
          '🍴 Try daily specials, ask locals for recommendations, 15-20% tip expected, credit cards accepted',
          '👥 Local favorites recommended, standard gratuity appreciated, most places accept cards',
          '🗣️ Seek resident advice, customary tipping, electronic payments widely accepted'
        ];
        return notes[variation];
    }
  }
  
  String _getVariedEveningNotes(String budget, List<String> travelStyles, int variation) {
    if (budget == 'Luxury') {
      final notes = [
        '🥂 Smart casual required, advance booking essential, valet available, wine pairing recommended',
        '👑 Elegant attire expected, reservations mandatory, premium services, sommelier consultation',
        '✨ Refined dress code, prior booking crucial, luxury amenities, expert beverage guidance'
      ];
      return notes[variation];
    }
    
    final notes = [
      '🌙 Check weather, bring light jacket, last entry 9 PM, night photography tips available',
      '🌆 Weather-appropriate clothing, evening temperatures cooler, venues close early, photo opportunities',
      '🌃 Layer clothing recommended, temperature drops evening, early closing times, scenic photo spots'
    ];
    return notes[variation];
  }
  
  int _getActivityCount() {
    return 12; // Estimated activity count
  }
  
  List<String> _generateAccommodationSuggestions(String destination, String budget) {
    final suggestions = <String>[];
    
    switch (budget) {
      case 'Budget-Friendly':
        suggestions.addAll([
          '🏨 RECOMMENDED: Central Hostel $destination',
          '📍 Location: 2 blocks from main square, safe neighborhood',
          '💰 Price: \$25-35/night (dorm), \$45-60/night (private)',
          '✨ Features: Free breakfast (7-10 AM), Free Wi-Fi, Luggage storage',
          '🚌 Transport: Bus stop 50m away, Metro station 200m',
          '📞 Contact: Book 2-3 days ahead, 24/7 reception',
          '💡 Pro Tip: Ask for upper floor rooms (quieter)',
        ]);
        break;
      case 'Luxury':
        suggestions.addAll([
          '🏨 RECOMMENDED: Grand Palace Hotel $destination',
          '📍 Location: Premium district, city center views',
          '💰 Price: \$250-400/night (standard), \$500+/night (suite)',
          '✨ Features: Spa, Fine dining, Concierge, Room service 24/7',
          '🚗 Transport: Private airport transfer included (\$80 value)',
          '📞 Contact: Book 1-2 weeks ahead, special packages available',
          '💡 Pro Tip: Mention special occasions for upgrades',
        ]);
        break;
      default:
        suggestions.addAll([
          '🏨 RECOMMENDED: Boutique Hotel Heritage $destination',
          '📍 Location: Historic quarter, walking distance to attractions',
          '💰 Price: \$80-120/night (standard), \$140-180/night (deluxe)',
          '✨ Features: Local breakfast, Rooftop terrace, Free Wi-Fi',
          '🚌 Transport: 10-min walk to metro, taxi stand nearby',
          '📞 Contact: Book 5-7 days ahead, weekend rates higher',
          '💡 Pro Tip: Request rooms facing courtyard (quieter)',
        ]);
    }
    
    return suggestions;
  }
  
  List<String> _generateTransportationTips(String destination, String budget) {
    final tips = <String>[];
    
    switch (budget) {
      case 'Budget-Friendly':
        tips.addAll([
          '🚌 PUBLIC TRANSPORT (Recommended)',
          '💰 Day Pass: \$8-12 (unlimited rides), Weekly: \$35-45',
          '📱 Apps: Download "$destination Transit" for real-time updates',
          '🚶 Walking: Most attractions within 2-3 km, wear good shoes',
          '🚲 Bike Rental: \$15-20/day, bike lanes available',
          '💡 Money-Saving: Avoid taxis (\$15-25 per ride), walk when possible',
        ]);
        break;
      case 'Luxury':
        tips.addAll([
          '🚗 PRIVATE TRANSPORT (Recommended)',
          '💰 Private Driver: \$200-300/day, hotel can arrange',
          '🚕 Premium Taxi: \$25-40 per ride, apps available',
          '✈️ Airport Transfer: \$80-120, book through hotel',
          '🚌 First Class Transit: \$15-25/day for premium service',
          '💡 Luxury Tip: Hotel concierge handles all bookings',
        ]);
        break;
      default:
        tips.addAll([
          '🚌 MIXED TRANSPORT (Recommended)',
          '💰 Transit Pass: \$12-18/day, covers buses and metro',
          '🚕 Taxi/Uber: \$8-15 per ride, surge pricing evenings',
          '🚶 Walking Tours: Free or \$15-25, great for orientation',
          '🚲 Bike Share: \$5-8/hour, stations throughout city',
          '💡 Smart Tip: Combine walking with public transport',
        ]);
    }
    
    return tips;
  }
  
  String _generateBudgetConsiderations(String destination, String budget, int days) {
    final budgetBreakdown = _getBudgetBreakdown(budget, days);
    
    return '💰 DETAILED BUDGET BREAKDOWN\n\n'
           '🏨 ACCOMMODATION ($days nights)\n'
           '${budgetBreakdown['accommodation']}\n\n'
           '🍽️ MEALS (per day)\n'
           '${budgetBreakdown['meals']}\n\n'
           '🚌 TRANSPORTATION\n'
           '${budgetBreakdown['transport']}\n\n'
           '🎯 ACTIVITIES & ATTRACTIONS\n'
           '${budgetBreakdown['activities']}\n\n'
           '💳 PAYMENT TIPS\n'
           'Credit cards accepted at most places\n'
           'Carry \$50-100 cash for small vendors\n'
           'ATMs available, \$3-5 fee per withdrawal\n'
           'Tipping: 15-20% at restaurants, \$2-5 for guides\n\n'
           '💡 MONEY-SAVING HACKS\n'
           'City tourist cards: Save 20-40% on attractions\n'
           'Lunch specials: \$8-15 vs \$25-35 dinner\n'
           'Free walking tours: Tip \$5-10 per person\n'
           'Happy hours: 4-6 PM, drinks 50% off';
  }
  
  Map<String, String> _getBudgetBreakdown(String budget, int days) {
    switch (budget) {
      case 'Budget-Friendly':
        return {
          'accommodation': 'Hostels/Budget hotels: \$25-40/night\nTotal: \$${(30 * days).toStringAsFixed(0)}-${(40 * days).toStringAsFixed(0)}',
          'meals': 'Breakfast: \$5-8 (hostel/cafe)\nLunch: \$8-12 (local spots)\nDinner: \$12-18 (casual dining)\nDaily total: \$25-38',
          'transport': 'Public transit pass: \$8-12/day\nWalking tours: Free-\$15\nBike rental: \$15-20/day',
          'activities': 'Museums: \$8-15 each\nFree attractions: Many available\nGuided tours: \$20-35\nDaily budget: \$15-30',
        };
      case 'Luxury':
        return {
          'accommodation': '5-star hotels: \$250-400/night\nTotal: \$${(325 * days).toStringAsFixed(0)}-${(400 * days).toStringAsFixed(0)}',
          'meals': 'Breakfast: \$25-40 (hotel/upscale)\nLunch: \$45-70 (fine dining)\nDinner: \$80-150 (premium)\nDaily total: \$150-260',
          'transport': 'Private driver: \$200-300/day\nPremium taxis: \$25-40/ride\nAirport transfers: \$80-120',
          'activities': 'Premium tours: \$100-200\nPrivate guides: \$150-300/day\nExclusive experiences: \$200-500\nDaily budget: \$150-300',
        };
      default:
        return {
          'accommodation': 'Mid-range hotels: \$80-140/night\nTotal: \$${(110 * days).toStringAsFixed(0)}-${(140 * days).toStringAsFixed(0)}',
          'meals': 'Breakfast: \$12-18 (hotel/cafe)\nLunch: \$18-28 (restaurants)\nDinner: \$30-50 (good dining)\nDaily total: \$60-96',
          'transport': 'Mixed transport: \$15-25/day\nTaxis when needed: \$8-15/ride\nDay passes: \$12-18',
          'activities': 'Attractions: \$15-25 each\nGuided tours: \$35-60\nExperiences: \$40-80\nDaily budget: \$40-70',
        };
    }
  }

  // Real-time travel assistance
  Future<Map<String, dynamic>> getRealTimeAssistance(String destination, {Position? currentLocation}) async {
    try {
      final weather = await _getWeatherData(destination);
      final traffic = await _getTrafficData(destination, currentLocation);
      final emergency = _getEmergencyServices(destination);
      
      return {
        'weather': weather,
        'traffic': traffic,
        'emergency': emergency,
        'recommendations': _generateWeatherBasedRecommendations(weather),
        'alerts': _generateTravelAlerts(weather, traffic)
      };
    } catch (e) {
      return {
        'error': 'Unable to fetch real-time data',
        'emergency': _getEmergencyServices(destination)
      };
    }
  }

  Future<Map<String, dynamic>> _getWeatherData(String destination) async {
    await Future.delayed(Duration(milliseconds: 500));
    final random = Random();
    final temp = 15 + random.nextInt(20);
    final conditions = ['sunny', 'cloudy', 'rainy', 'partly_cloudy'][random.nextInt(4)];
    
    return {
      'temperature': temp,
      'condition': conditions,
      'humidity': 40 + random.nextInt(40),
      'windSpeed': random.nextInt(15),
      'uvIndex': random.nextInt(10),
      'forecast': List.generate(5, (i) => {
        'day': DateTime.now().add(Duration(days: i)).weekday,
        'temp': temp + random.nextInt(10) - 5,
        'condition': ['sunny', 'cloudy', 'rainy'][random.nextInt(3)]
      })
    };
  }

  Future<Map<String, dynamic>> _getTrafficData(String destination, Position? currentLocation) async {
    await Future.delayed(Duration(milliseconds: 300));
    final random = Random();
    
    return {
      'status': ['light', 'moderate', 'heavy'][random.nextInt(3)],
      'delays': random.nextInt(30),
      'incidents': random.nextBool() ? [
        {
          'type': 'construction',
          'location': 'Main Street',
          'impact': 'moderate',
          'alternative': 'Use Highway 101'
        }
      ] : [],
      'bestRoutes': [
        {'name': 'Fastest Route', 'duration': '25 min', 'distance': '12 km'},
        {'name': 'Scenic Route', 'duration': '35 min', 'distance': '18 km'}
      ]
    };
  }

  Map<String, dynamic> _getEmergencyServices(String destination) {
    return {
      'police': '911',
      'medical': '911',
      'fire': '911',
      'tourist_helpline': '+1-800-TOURIST',
      'embassy': '+1-555-EMBASSY',
      'local_hospital': 'City General Hospital - +1-555-HOSPITAL',
      'nearest_pharmacy': 'Downtown Pharmacy - 0.5 km away'
    };
  }

  List<Map<String, dynamic>> _generateWeatherBasedRecommendations(Map<String, dynamic> weather) {
    final condition = weather['condition'];
    final temp = weather['temperature'];
    
    List<Map<String, dynamic>> recommendations = [];
    
    if (condition == 'rainy') {
      recommendations.addAll([
        {'type': 'indoor', 'activity': 'Visit museums or galleries', 'reason': 'Stay dry'},
        {'type': 'gear', 'item': 'Umbrella or rain jacket', 'priority': 'high'}
      ]);
    } else if (condition == 'sunny' && temp > 25) {
      recommendations.addAll([
        {'type': 'outdoor', 'activity': 'Beach or park activities', 'reason': 'Perfect weather'},
        {'type': 'gear', 'item': 'Sunscreen and hat', 'priority': 'high'}
      ]);
    }
    
    if (temp < 10) {
      recommendations.add({'type': 'gear', 'item': 'Warm clothing', 'priority': 'medium'});
    }
    
    return recommendations;
  }

  List<Map<String, dynamic>> _generateTravelAlerts(Map<String, dynamic> weather, Map<String, dynamic> traffic) {
    List<Map<String, dynamic>> alerts = [];
    
    if (weather['condition'] == 'rainy') {
      alerts.add({
        'type': 'weather',
        'severity': 'medium',
        'message': 'Rain expected - consider indoor activities',
        'action': 'Pack umbrella'
      });
    }
    
    if (traffic['status'] == 'heavy') {
      alerts.add({
        'type': 'traffic',
        'severity': 'high',
        'message': 'Heavy traffic detected - allow extra time',
        'action': 'Leave 30 minutes earlier'
      });
    }
    
    return alerts;
  }

  OneDayItinerary _generateFallbackDayItinerary(String location, String interests, List<Place> nearbyPlaces) {
    final activities = <ActivityDetail>[];
    
    // Enhanced morning activity
    activities.add(ActivityDetail(
      timeOfDay: 'Morning: 9:00 AM - 12:00 PM',
      activityTitle: '🌅 Morning Discovery in $location',
      description: 'Start with breakfast at a local café (\$8-12). '
                  'Take a self-guided walking tour of the historic center. '
                  'Visit the main square and take photos at key landmarks. '
                  'Stop by the visitor center for maps and local tips. '
                  'Browse morning markets for fresh produce and local crafts.',
      estimatedDuration: '3 hours',
      location: '$location City Center',
      notes: 'Wear comfortable shoes, bring water, most shops open at 10 AM',
      icon: '🏛️',
      category: 'sightseeing',
    ));
    
    // Enhanced lunch activity
    activities.add(ActivityDetail(
      timeOfDay: 'Lunch: 12:30 PM - 2:00 PM',
      activityTitle: '🍽️ Authentic Local Lunch',
      description: 'Try the regional specialty at a recommended restaurant (\$15-25). '
                  'Ask locals for their favorite lunch spots. '
                  'Sample traditional appetizers and main dishes. '
                  'Learn about local ingredients and cooking methods. '
                  'Take photos of beautifully presented dishes.',
      estimatedDuration: '1.5 hours',
      location: '$location Restaurant District',
      notes: 'Lunch specials available 12-3 PM, vegetarian options available, 15% tip expected',
      icon: '🍴',
      category: 'food',
    ));
    
    // Enhanced afternoon activity based on interests
    final afternoonActivity = _getAfternoonActivityForInterests(location, interests);
    activities.add(afternoonActivity);
    
    // Enhanced evening activity
    activities.add(ActivityDetail(
      timeOfDay: 'Evening: 6:00 PM - 9:00 PM',
      activityTitle: '🌆 Evening Atmosphere & Dining',
      description: 'Watch the sunset from a scenic viewpoint (free). '
                  'Stroll through illuminated historic streets. '
                  'Enjoy dinner at a cozy local restaurant (\$20-35). '
                  'Try regional wine or craft beer (\$6-10 per glass). '
                  'End with dessert at a famous local bakery (\$4-8).',
      estimatedDuration: '3 hours',
      location: '$location Waterfront/Historic Quarter',
      notes: 'Sunset around 7:30 PM, bring light jacket, safe walking areas, last orders 9 PM',
      icon: '🌃',
      category: 'dining',
    ));
    
    return OneDayItinerary(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: '🌟 Perfect Day in $location',
      introduction: '🗺️ Welcome to your personalized day in $location! '
                   'This itinerary is designed around your interests in $interests. '
                   'Each activity includes timing, costs, and insider tips. '
                   'Total estimated cost: \$60-90 per person. '
                   'Duration: Full day (9 AM - 9 PM). '
                   'Difficulty: Easy walking, suitable for all ages.',
      dailyPlan: activities,
      conclusion: '✨ What an amazing day in $location! '
                 'You\'ve experienced the best of local culture, cuisine, and attractions. '
                 'Don\'t forget to share your photos and recommend this itinerary to fellow travelers. '
                 'Safe travels and hope to see you back in $location soon!',
      travelTips: [
        'Download offline maps before starting your day',
        'Carry \$50-70 cash for small vendors and tips',
        'Wear comfortable walking shoes and dress in layers',
        'Keep your phone charged - bring a portable battery',
        'Learn basic local phrases: "Hello", "Thank you", "How much?"',
        'Take photos but also enjoy the moment without screens',
      ],
    );
  }
  
  ActivityDetail _getAfternoonActivityForInterests(String location, String interests) {
    if (interests.toLowerCase().contains('culture')) {
      return ActivityDetail(
        timeOfDay: 'Afternoon: 2:30 PM - 5:30 PM',
        activityTitle: '🎨 Cultural Immersion Experience',
        description: 'Visit the main museum or cultural center (\$12-18, audio guide +\$5). '
                    'Join a guided tour focusing on local history (\$20-30). '
                    'Explore artisan workshops and meet local craftspeople. '
                    'Purchase authentic handmade souvenirs (\$10-30). '
                    'Attend a cultural performance if available (\$15-25).',
        estimatedDuration: '3 hours',
        location: '$location Cultural District',
        notes: 'Student discounts available, photography rules vary, free WiFi, lockers available',
        icon: '🎭',
        category: 'culture',
      );
    }
    
    if (interests.toLowerCase().contains('nature')) {
      return ActivityDetail(
        timeOfDay: 'Afternoon: 2:30 PM - 5:30 PM',
        activityTitle: '🌳 Nature & Outdoor Adventure',
        description: 'Explore the city park or botanical gardens (\$5-10 entry). '
                    'Take a nature walk or bike ride (bike rental \$15-20). '
                    'Visit scenic viewpoints for panoramic photos. '
                    'Relax by the lake or river with a picnic snack. '
                    'Spot local wildlife and learn about native plants.',
        estimatedDuration: '3 hours',
        location: '$location Nature Reserve/Park',
        notes: 'Wear hiking shoes, bring water and snacks, check weather, trails marked clearly',
        icon: '🥾',
        category: 'nature',
      );
    }
    
    // Default activity
    return ActivityDetail(
      timeOfDay: 'Afternoon: 2:30 PM - 5:30 PM',
      activityTitle: '🎯 Local Experience & Shopping',
      description: 'Explore local markets and shopping districts. '
                  'Try street food and local snacks (\$3-8 per item). '
                  'Visit unique shops for souvenirs and local products. '
                  'Interact with friendly locals and practice the language. '
                  'Take photos at Instagram-worthy spots.',
      estimatedDuration: '3 hours',
      location: '$location Market District',
      notes: 'Bargaining acceptable at markets, try before buying food, keep valuables secure',
      icon: '🛍️',
      category: 'shopping',
    );
  }
}