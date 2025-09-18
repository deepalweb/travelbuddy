import '../models/enhanced_activity.dart';
import '../services/places_service.dart';

class DebugPremiumService {
  static Future<List<EnhancedActivity>> generatePremiumDayPlan({
    required String destination,
    required String interests,
    required String pace,
    required List<String> dietaryPreferences,
    required bool isAccessible,
    String? weather,
    required double latitude,
    required double longitude,
  }) async {
    print('🎯 Generating plan for: $destination at $latitude,$longitude');
    
    try {
      final placesService = PlacesService();
      final places = await placesService.searchPlaces(
        query: destination,
        category: 'tourist_attraction',
        latitude: latitude,
        longitude: longitude,
        radius: 10000,
      );
      
      print('📍 Found ${places.length} places');
      
      if (places.isNotEmpty) {
        final activities = <EnhancedActivity>[];
        for (int i = 0; i < places.length && i < 3; i++) {
          final place = places[i];
          activities.add(EnhancedActivity(
            id: place.id,
            title: place.name,
            description: place.description.isNotEmpty ? place.description : 'Visit ${place.name}',
            timeSlot: ['09:00-11:00', '12:30-14:00', '15:30-17:30'][i],
            estimatedDuration: Duration(hours: 2),
            type: ActivityType.landmark,
            location: Location(
              address: place.address,
              latitude: place.latitude ?? 0.0,
              longitude: place.longitude ?? 0.0,
            ),
            costInfo: CostInfo(
              entryFee: 15.0,
              currency: '\$',
              mealCosts: {},
              transportCost: 5.0,
              paymentMethods: ['Card'],
              hasDiscounts: false,
            ),
            travelInfo: TravelInfo(
              fromPrevious: i == 0 ? 'Start' : 'Previous',
              travelTime: Duration(minutes: i == 0 ? 0 : 15),
              recommendedMode: TransportMode.walk,
              estimatedCost: 0.0,
              routeInstructions: 'Navigate to ${place.name}',
              isAccessible: true,
            ),
            images: place.photoUrl.isNotEmpty ? [place.photoUrl] : [],
            contextInfo: ContextualInfo(
              crowdLevel: 'Moderate',
              bestTimeToVisit: 'Morning',
              weatherTips: ['Check weather'],
              localTips: ['Rated ${place.rating}/5'],
              safetyAlerts: [],
              isIndoorActivity: false,
            ),
            actionableLinks: [
              ActionableLink(
                title: 'Directions',
                url: 'https://maps.google.com/?q=${place.name}',
                type: ActionType.map,
              ),
            ],
          ));
        }
        print('✅ Created ${activities.length} activities from real places');
        return activities;
      }
    } catch (e) {
      print('❌ Error: $e');
    }
    
    print('🎭 Using fallback activities');
    return [
      EnhancedActivity(
        id: '1',
        title: 'Explore $destination',
        description: 'Discover the highlights of $destination',
        timeSlot: '09:00-11:00',
        estimatedDuration: Duration(hours: 2),
        type: ActivityType.landmark,
        location: Location(address: destination, latitude: 0.0, longitude: 0.0),
        costInfo: CostInfo(entryFee: 10.0, currency: '\$', mealCosts: {}, transportCost: 0.0, paymentMethods: ['Card'], hasDiscounts: false),
        travelInfo: TravelInfo(fromPrevious: 'Start', travelTime: Duration.zero, recommendedMode: TransportMode.walk, estimatedCost: 0.0, routeInstructions: '', isAccessible: true),
        images: [],
        contextInfo: ContextualInfo(crowdLevel: 'Moderate', bestTimeToVisit: 'Morning', weatherTips: [], localTips: [], safetyAlerts: [], isIndoorActivity: false),
        actionableLinks: [],
      ),
    ];
  }
}