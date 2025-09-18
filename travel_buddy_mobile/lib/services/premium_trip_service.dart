import '../models/enhanced_activity.dart';

class PremiumTripService {
  static Future<List<EnhancedActivity>> generatePremiumDayPlan({
    required String destination,
    required String interests,
    required String pace,
    required List<String> dietaryPreferences,
    required bool isAccessible,
    String? weather,
  }) async {
    // Enhanced AI generation with premium features
    final activities = <EnhancedActivity>[];
    
    // Morning Activity (9:00-11:00)
    activities.add(EnhancedActivity(
      id: '1',
      title: 'Colosseum',
      description: 'Ancient Roman amphitheater and iconic landmark. Skip the crowds with early morning visit.',
      timeSlot: '09:00-11:00',
      estimatedDuration: const Duration(hours: 2),
      type: ActivityType.landmark,
      location: Location(
        address: 'Piazza del Colosseo, 1, 00184 Roma RM, Italy',
        latitude: 41.8902,
        longitude: 12.4922,
      ),
      costInfo: CostInfo(
        entryFee: 16.0,
        currency: '€',
        mealCosts: {},
        transportCost: 0.0,
        paymentMethods: ['Card', 'Cash', 'Mobile'],
        hasDiscounts: true,
      ),
      travelInfo: TravelInfo(
        fromPrevious: 'Starting Point',
        travelTime: const Duration(minutes: 0),
        recommendedMode: TransportMode.walk,
        estimatedCost: 0.0,
        routeInstructions: 'Meet at main entrance',
        isAccessible: true,
      ),
      images: [
        'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e',
      ],
      contextInfo: ContextualInfo(
        crowdLevel: 'Low (early morning)',
        bestTimeToVisit: '9:00-10:00 AM to avoid crowds',
        weatherTips: weather == 'rainy' 
          ? ['Bring umbrella', 'Underground areas available']
          : ['Bring sun hat', 'Carry water'],
        localTips: [
          'Book skip-the-line tickets in advance',
          'Audio guide highly recommended',
          'Best photo spots: north and west sides',
        ],
        safetyAlerts: ['Watch for pickpockets in tourist areas'],
        isIndoorActivity: false,
      ),
      actionableLinks: [
        ActionableLink(
          title: 'Skip Line',
          url: 'https://www.coopculture.it/en/colosseum-and-roman-forum.cfm',
          type: ActionType.skipLine,
        ),
        ActionableLink(
          title: 'Audio Guide',
          url: 'https://www.headout.com/rome/colosseum-tours/',
          type: ActionType.booking,
        ),
        ActionableLink(
          title: 'Directions',
          url: 'https://maps.google.com/?q=Colosseum,Rome',
          type: ActionType.map,
        ),
      ],
    ));

    // Lunch Activity (12:30-14:00)
    activities.add(EnhancedActivity(
      id: '2',
      title: 'Lunch in Trastevere',
      description: 'Authentic Roman cuisine in charming neighborhood. Multiple options for different budgets.',
      timeSlot: '12:30-14:00',
      estimatedDuration: const Duration(hours: 1, minutes: 30),
      type: ActivityType.restaurant,
      location: Location(
        address: 'Trastevere, Rome, Italy',
        latitude: 41.8896,
        longitude: 12.4695,
      ),
      costInfo: CostInfo(
        entryFee: 0.0,
        currency: '€',
        mealCosts: {
          'budget': 15.0,
          'mid-range': 25.0,
          'luxury': 45.0,
        },
        transportCost: 2.5,
        paymentMethods: ['Card', 'Cash'],
        hasDiscounts: false,
      ),
      travelInfo: TravelInfo(
        fromPrevious: 'Colosseum',
        travelTime: const Duration(minutes: 20),
        recommendedMode: TransportMode.metro,
        estimatedCost: 1.5,
        routeInstructions: 'Metro Line B to Piramide, then tram 8',
        isAccessible: isAccessible,
      ),
      images: [
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
        'https://images.unsplash.com/photo-1551218808-94e220e084d2',
      ],
      contextInfo: ContextualInfo(
        crowdLevel: 'Moderate',
        bestTimeToVisit: '12:30-13:30 for lunch',
        weatherTips: ['Outdoor seating available', 'Indoor options if raining'],
        localTips: [
          'Try carbonara or cacio e pepe',
          'Book ahead for popular spots',
          'Tipping 10% is appreciated',
        ],
        safetyAlerts: [],
        isIndoorActivity: true,
      ),
      actionableLinks: [
        ActionableLink(
          title: 'Reserve Table',
          url: 'https://www.opentable.com/rome',
          type: ActionType.reservation,
        ),
        ActionableLink(
          title: 'Menu & Reviews',
          url: 'https://www.tripadvisor.com/restaurants-trastevere-rome',
          type: ActionType.booking,
        ),
      ],
    ));

    // Afternoon Activity (16:00-18:30)
    if (weather == 'rainy') {
      // Weather-aware swap to indoor activity
      activities.add(_createVaticanMuseumActivity(isAccessible));
    } else {
      activities.add(_createVillaGiuliaSunsetActivity(isAccessible));
    }

    return activities;
  }

  static EnhancedActivity _createVaticanMuseumActivity(bool isAccessible) {
    return EnhancedActivity(
      id: '3',
      title: 'Vatican Museums',
      description: 'World-class art collection including Sistine Chapel. Perfect indoor activity.',
      timeSlot: '16:00-18:30',
      estimatedDuration: const Duration(hours: 2, minutes: 30),
      type: ActivityType.museum,
      location: Location(
        address: 'Vatican City',
        latitude: 41.9065,
        longitude: 12.4536,
      ),
      costInfo: CostInfo(
        entryFee: 20.0,
        currency: '€',
        mealCosts: {},
        transportCost: 3.0,
        paymentMethods: ['Card', 'Cash'],
        hasDiscounts: true,
      ),
      travelInfo: TravelInfo(
        fromPrevious: 'Trastevere',
        travelTime: const Duration(minutes: 25),
        recommendedMode: TransportMode.metro,
        estimatedCost: 1.5,
        routeInstructions: 'Metro Line A to Ottaviano',
        isAccessible: isAccessible,
      ),
      images: [
        'https://images.unsplash.com/photo-1531572753322-ad063cecc140',
      ],
      contextInfo: ContextualInfo(
        crowdLevel: 'High',
        bestTimeToVisit: 'Late afternoon less crowded',
        weatherTips: ['Perfect for rainy weather', 'Climate controlled'],
        localTips: [
          'Book timed entry tickets',
          'Allow 3+ hours for full experience',
          'Dress code: covered shoulders and knees',
        ],
        safetyAlerts: ['Very crowded, watch belongings'],
        isIndoorActivity: true,
      ),
      actionableLinks: [
        ActionableLink(
          title: 'Book Tickets',
          url: 'https://www.museivaticani.va/content/museivaticani/en.html',
          type: ActionType.tickets,
        ),
      ],
    );
  }

  static EnhancedActivity _createVillaGiuliaSunsetActivity(bool isAccessible) {
    return EnhancedActivity(
      id: '3',
      title: 'Villa Giulia Sunset',
      description: 'Beautiful gardens and sunset views. Perfect for clear weather.',
      timeSlot: '17:00-19:00',
      estimatedDuration: const Duration(hours: 2),
      type: ActivityType.nature,
      location: Location(
        address: 'Villa Giulia, Rome',
        latitude: 41.9171,
        longitude: 12.4793,
      ),
      costInfo: CostInfo(
        entryFee: 8.0,
        currency: '€',
        mealCosts: {},
        transportCost: 2.0,
        paymentMethods: ['Card', 'Cash'],
        hasDiscounts: false,
      ),
      travelInfo: TravelInfo(
        fromPrevious: 'Trastevere',
        travelTime: const Duration(minutes: 30),
        recommendedMode: TransportMode.bus,
        estimatedCost: 1.5,
        routeInstructions: 'Bus 116 to Villa Giulia',
        isAccessible: isAccessible,
      ),
      images: [
        'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
      ],
      contextInfo: ContextualInfo(
        crowdLevel: 'Low',
        bestTimeToVisit: '1 hour before sunset',
        weatherTips: ['Bring camera for sunset', 'Light jacket for evening'],
        localTips: [
          'Best sunset spot: main terrace',
          'Nearby café for aperitivo',
          'Free WiFi available',
        ],
        safetyAlerts: [],
        isIndoorActivity: false,
      ),
      actionableLinks: [
        ActionableLink(
          title: 'Directions',
          url: 'https://maps.google.com/?q=Villa+Giulia,Rome',
          type: ActionType.map,
        ),
      ],
    );
  }
}