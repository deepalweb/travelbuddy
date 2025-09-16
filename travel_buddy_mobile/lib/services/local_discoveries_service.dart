import '../models/local_discovery.dart' as models;

class LocalDiscovery {
  final String name;
  final String description;
  final String location;
  final String type;
  final double rating;
  final double? latitude;
  final double? longitude;
  final String? imageUrl;
  final String? tip;
  final bool isFeatured;
  final String status;
  final double reviewCount;

  LocalDiscovery({
    required this.name,
    required this.description,
    required this.location,
    required this.type,
    required this.rating,
    this.latitude,
    this.longitude,
    this.imageUrl,
    this.tip,
    this.isFeatured = false,
    this.status = 'open',
    this.reviewCount = 0,
  });

  // Convert to model LocalDiscovery
  models.LocalDiscovery toModelLocalDiscovery() {
    return models.LocalDiscovery(
      title: name,
      description: description,
      hiddenGem: {
        'name': name,
        'location': location,
        'type': type,
        'rating': rating,
        'latitude': latitude,
        'longitude': longitude,
        'imageUrl': imageUrl,
      },
      localFoodCulture: {},  // Not available in service model
      insiderTips: tip != null ? [tip!] : [],
      events: [],  // Not available in service model
      traditions: [],  // Not available in service model
      seasonalHighlights: [],  // Not available in service model
    );
  }
}

class LocalDiscoveriesService {
  static final LocalDiscoveriesService _instance = LocalDiscoveriesService._internal();
  factory LocalDiscoveriesService() => _instance;
  LocalDiscoveriesService._internal();

  Future<List<LocalDiscovery>> generateLocalDiscoveries(String cityName) async {
    await Future.delayed(const Duration(milliseconds: 300)); // Simulate API call
    
    return [
      LocalDiscovery(
        name: 'Local Art Gallery',
        description: 'A vibrant gallery showcasing local artists and modern art installations.',
        location: '$cityName Arts District',
        type: 'Culture',
        rating: 4.6,
        isFeatured: true,
        status: 'open',
        reviewCount: 128,
      ),
      LocalDiscovery(
        name: 'Secret Garden',
        description: 'A hidden gem with beautiful landscaping and peaceful atmosphere.',
        location: '$cityName Botanical Gardens',
        type: 'Nature',
        rating: 4.8,
        isFeatured: true,
        status: 'open',
        reviewCount: 256,
      ),
    ];
  }

  Future<List<LocalDiscovery>> discover({
    required double latitude,
    required double longitude,
  }) async {
    await Future.delayed(const Duration(milliseconds: 300)); // Simulate API call

    return [
      LocalDiscovery(
        name: 'Hidden Garden Café',
        description: 'A serene garden café tucked away from the tourist crowds, known for its peaceful atmosphere and artisanal coffees.',
        location: 'Behind the Old Library, 45 Garden Street',
        type: 'Café',
        rating: 4.7,
        latitude: latitude + 0.001,
        longitude: longitude + 0.001,
        imageUrl: 'https://example.com/garden-cafe.jpg',
        tip: 'Try their signature lavender latte and house-made pastries. Best time to visit is early morning.',
        isFeatured: true,
        status: 'open',
        reviewCount: 128,
      ),
      LocalDiscovery(
        name: 'Local Artisan Market',
        description: 'Vibrant indoor market featuring local craftspeople and unique handmade goods.',
        location: 'Market Square, 12 Crafts Lane',
        type: 'Shopping',
        rating: 4.5,
        latitude: latitude - 0.002,
        longitude: longitude - 0.001,
        imageUrl: 'https://example.com/artisan-market.jpg',
        tip: 'Visit on weekends when all vendors are present. Cash preferred by most vendors.',
        status: 'open',
        reviewCount: 256,
      ),
      LocalDiscovery(
        name: 'Traditional Ramen House',
        description: 'Family-run ramen shop serving authentic recipes passed down through generations.',
        location: 'Noodle House, 78 Fifth Street',
        type: 'Restaurant',
        rating: 4.8,
        latitude: latitude + 0.002,
        longitude: longitude + 0.002,
        imageUrl: 'https://example.com/ramen-house.jpg',
        tip: 'Order their signature spicy miso ramen. They don\'t take reservations, so come early.',
        isFeatured: true,
        status: 'open',
        reviewCount: 342,
      ),
    ];
  }

  Future<List<LocalDiscovery>> searchDiscoveries(String query, {
    double? latitude,
    double? longitude,
    String? type,
  }) async {
    final discoveries = await discover(
      latitude: latitude ?? 0.0,
      longitude: longitude ?? 0.0,
    );
    
    return discoveries
        .where((discovery) =>
            discovery.name.toLowerCase().contains(query.toLowerCase()) ||
            discovery.description.toLowerCase().contains(query.toLowerCase()) ||
            (type == null || discovery.type.toLowerCase() == type.toLowerCase()))
        .toList();
  }

  Future<List<LocalDiscovery>> getFeaturedDiscoveries({
    required double latitude,
    required double longitude,
  }) async {
    final discoveries = await discover(
      latitude: latitude,
      longitude: longitude,
    );
    
    return discoveries.where((discovery) => discovery.isFeatured).toList();
  }
}