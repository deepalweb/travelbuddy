import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/place.dart';
import '../models/context_section.dart';
import '../widgets/enhanced_place_card.dart';
import '../widgets/compact_place_card.dart';
import '../widgets/travel_style_filter.dart';
import '../widgets/search_bar_widget.dart';
import '../services/places_service.dart';
import '../utils/api_debouncer.dart';
import 'place_details_screen.dart';
import 'category_places_screen.dart';

class ExploreScreenRedesigned extends StatefulWidget {
  const ExploreScreenRedesigned({super.key});

  @override
  State<ExploreScreenRedesigned> createState() => _ExploreScreenRedesignedState();
}

class _ExploreScreenRedesignedState extends State<ExploreScreenRedesigned> {
  final TextEditingController _searchController = TextEditingController();
  final _searchDebouncer = ApiDebouncer(delay: const Duration(milliseconds: 500));
  
  List<String> _selectedTravelStyles = [];
  List<ContextSection> _contextSections = [];
  bool _isLoading = false;
  String? _weatherCondition;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadContextAwareSections();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchDebouncer.dispose();
    super.dispose();
  }

  Future<void> _loadContextAwareSections() async {
    setState(() => _isLoading = true);
    
    final appProvider = context.read<AppProvider>();
    if (appProvider.currentLocation == null) {
      await appProvider.getCurrentLocation();
    }

    // Force refresh to get new data
    final sections = await _generateContextSections(appProvider, forceRefresh: true);
    
    setState(() {
      _contextSections = sections;
      _isLoading = false;
    });
  }

  Future<List<ContextSection>> _generateContextSections(AppProvider appProvider, {bool forceRefresh = false}) async {
    final sections = <ContextSection>[];
    final now = DateTime.now();
    final hour = now.hour;
    
    // Get weather info
    _weatherCondition = appProvider.weatherInfo?.condition.toLowerCase() ?? 'clear';
    final isRainy = _weatherCondition!.contains('rain');

    // 1. Hot Places Right Now (within 500m, open now)
    final hotPlaces = await _fetchPlacesByContext(
      appProvider,
      'restaurants cafes attractions open now',
      radius: 500,
      forceRefresh: forceRefresh,
    );
    if (hotPlaces.isNotEmpty) {
      sections.add(ContextSection(
        id: 'hot_now',
        title: '🔥 Hot Places Right Now',
        subtitle: '${hotPlaces.length} places open within 500m',
        icon: '🔥',
        places: hotPlaces.take(5).toList(),
        type: SectionType.hotNow,
      ));
    }

    // 2. Tonight in [City] (evening hours)
    if (hour >= 18) {
      final nightPlaces = await _fetchPlacesByContext(
        appProvider,
        'bars restaurants nightlife entertainment',
        radius: 2000,
      );
      if (nightPlaces.isNotEmpty) {
        sections.add(ContextSection(
          id: 'tonight',
          title: '🌙 Tonight in ${_getCityName(appProvider)}',
          subtitle: 'Bars & restaurants with recent activity',
          icon: '🌙',
          places: nightPlaces.take(5).toList(),
          type: SectionType.tonightIn,
        ));
      }
    }

    // 3. Weather-Aware Section
    if (isRainy) {
      final indoorPlaces = await _fetchPlacesByContext(
        appProvider,
        'museums galleries shopping malls indoor attractions',
        radius: 3000,
      );
      if (indoorPlaces.isNotEmpty) {
        sections.add(ContextSection(
          id: 'weather_aware',
          title: '☔ Weather-Aware Picks',
          subtitle: 'Indoor places perfect for rainy weather',
          icon: '☔',
          places: indoorPlaces.take(5).toList(),
          type: SectionType.weatherAware,
        ));
      }
    }

    // 4. For Your Travel Style (if styles selected)
    if (_selectedTravelStyles.isNotEmpty) {
      final stylePlaces = await _fetchPlacesByTravelStyle(
        appProvider,
        _selectedTravelStyles,
      );
      if (stylePlaces.isNotEmpty) {
        sections.add(ContextSection(
          id: 'travel_style',
          title: '🌟 For Your Travel Style',
          subtitle: 'Curated for ${_selectedTravelStyles.join(", ")}',
          icon: '🌟',
          places: stylePlaces.take(5).toList(),
          type: SectionType.travelStyle,
        ));
      }
    }

    // 5. Traditional Categories (below context sections)
    final categories = ['food', 'landmarks', 'culture', 'nature'];
    for (final category in categories) {
      final places = await _fetchPlacesByContext(
        appProvider,
        _getCategoryQuery(category),
        radius: 5000,
      );
      if (places.isNotEmpty) {
        sections.add(ContextSection(
          id: category,
          title: _getCategoryDisplayName(category),
          subtitle: '${places.length} places nearby',
          icon: _getCategoryIcon(category),
          places: places.take(3).toList(),
          type: SectionType.category,
        ));
      }
    }

    return sections;
  }

  Future<List<Place>> _fetchPlacesByContext(
    AppProvider appProvider,
    String query, {
    int radius = 5000,
    bool forceRefresh = false,
  }) async {
    if (appProvider.currentLocation == null) return [];

    try {
      final places = await PlacesService().fetchPlacesPipeline(
        latitude: appProvider.currentLocation!.latitude,
        longitude: appProvider.currentLocation!.longitude,
        query: query,
        radius: radius,
        topN: 5,
        forceRefresh: forceRefresh, // Pass force refresh
      );
      return places;
    } catch (e) {
      return [];
    }
  }

  Future<List<Place>> _fetchPlacesByTravelStyle(
    AppProvider appProvider,
    List<String> styles,
  ) async {
    final queries = <String>[];
    
    for (final style in styles) {
      switch (style) {
        case 'Foodie':
          queries.add('top rated restaurants local cuisine food markets');
          break;
        case 'Explorer':
          queries.add('landmarks attractions hidden gems viewpoints');
          break;
        case 'Relaxer':
          queries.add('spa wellness parks gardens quiet places');
          break;
        case 'Budget':
          queries.add('free attractions affordable restaurants budget friendly');
          break;
        case 'Family':
          queries.add('family friendly parks playgrounds kid activities');
          break;
      }
    }

    if (queries.isEmpty) return [];

    return await _fetchPlacesByContext(
      appProvider,
      queries.join(' '),
      radius: 5000,
    );
  }

  String _getCityName(AppProvider appProvider) {
    // Extract city from address or use default
    return 'Your Area';
  }

  String _getCategoryQuery(String category) {
    final queries = {
      'food': 'top rated restaurants cafes local cuisine dining',
      'landmarks': 'famous landmarks monuments must see attractions',
      'culture': 'museums art galleries cultural centers',
      'nature': 'parks gardens scenic viewpoints nature trails',
    };
    return queries[category] ?? 'points of interest';
  }

  String _getCategoryDisplayName(String category) {
    final names = {
      'food': '🍽️ Restaurants & Food',
      'landmarks': '🏛️ Landmarks',
      'culture': '🎨 Culture & Museums',
      'nature': '🌳 Nature & Parks',
    };
    return names[category] ?? category;
  }

  String _getCategoryIcon(String category) {
    final icons = {
      'food': '🍽️',
      'landmarks': '🏛️',
      'culture': '🎨',
      'nature': '🌳',
    };
    return icons[category] ?? '📍';
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Explore'),
            actions: [
              IconButton(
                icon: const Icon(Icons.delete_sweep),
                tooltip: 'Clear Cache',
                onPressed: () async {
                  await PlacesService().clearOfflineStorage();
                  PlacesService().clearCache();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('✅ Cache cleared! Pull to refresh.'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                },
              ),
              IconButton(
                icon: const Icon(Icons.tune),
                onPressed: () => _showFilterSheet(context),
              ),
            ],
          ),
          body: Column(
            children: [
              // Location & Weather Context Bar
              _buildContextBar(appProvider),
              
              // Contextual Greeting
              _buildGreeting(appProvider),
              
              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: SearchBarWidget(
                  controller: _searchController,
                  onSearch: (query) {
                    _searchDebouncer.call(() {
                      if (query.trim().isNotEmpty) {
                        appProvider.performInstantSearch(query.trim());
                      }
                    });
                  },
                ),
              ),
              
              // Travel Style Filters
              TravelStyleFilter(
                selectedStyles: _selectedTravelStyles,
                onStylesChanged: (styles) {
                  setState(() => _selectedTravelStyles = styles);
                  _loadContextAwareSections();
                },
              ),
              
              // Context-Aware Sections
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : RefreshIndicator(
                        onRefresh: _loadContextAwareSections,
                        child: _buildSectionsList(appProvider),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContextBar(AppProvider appProvider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF4361EE).withOpacity(0.1),
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_on, size: 16, color: Color(0xFF4361EE)),
          const SizedBox(width: 4),
          Text(
            _getCityName(appProvider),
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 12),
          const Text('•', style: TextStyle(color: Colors.grey)),
          const SizedBox(width: 12),
          Icon(_getWeatherIcon(), size: 16, color: const Color(0xFFFF6B35)),
          const SizedBox(width: 4),
          Text(
            appProvider.weatherInfo?.temperature.toString() ?? '28°C',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getWeatherIcon() {
    if (_weatherCondition == null) return Icons.wb_sunny;
    if (_weatherCondition!.contains('rain')) return Icons.umbrella;
    if (_weatherCondition!.contains('cloud')) return Icons.cloud;
    return Icons.wb_sunny;
  }

  Widget _buildGreeting(AppProvider appProvider) {
    final hour = DateTime.now().hour;
    final username = appProvider.currentUser?.username ?? 'Explorer';
    
    String greeting;
    String suggestion;
    
    if (hour < 12) {
      greeting = 'Good Morning, $username!';
      suggestion = '☕ Perfect morning for cafes & culture';
    } else if (hour < 18) {
      greeting = 'Good Afternoon, $username!';
      suggestion = '🌳 Great time for outdoor exploration';
    } else {
      greeting = 'Good Evening, $username!';
      suggestion = '🌆 Evening vibes: restaurants & nightlife';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            greeting,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            suggestion,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionsList(AppProvider appProvider) {
    if (_contextSections.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.explore_off, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('No places found nearby'),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadContextAwareSections,
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _contextSections.length,
      itemBuilder: (context, index) {
        final section = _contextSections[index];
        return _buildSection(section, appProvider);
      },
    );
  }

  Widget _buildSection(ContextSection section, AppProvider appProvider) {
    // Use horizontal scrolling for category sections, vertical for context sections
    final useHorizontal = section.type == SectionType.category;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 0),
          child: Row(
            children: [
              Text(
                section.title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              if (section.type == SectionType.category)
                TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CategoryPlacesScreen(
                          title: section.title,
                          query: _getCategoryQuery(section.id),
                        ),
                      ),
                    );
                  },
                  child: const Text('See More'),
                ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 0),
          child: Text(
            section.subtitle,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[600],
            ),
          ),
        ),
        const SizedBox(height: 16),
        
        // Places List - Horizontal for categories, Vertical for context sections
        if (useHorizontal)
          SizedBox(
            height: 220,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: section.places.length,
              itemBuilder: (context, index) {
                final place = section.places[index];
                return Padding(
                  padding: EdgeInsets.only(
                    right: index < section.places.length - 1 ? 12 : 0,
                  ),
                  child: CompactPlaceCard(
                    place: place,
                    isFavorite: appProvider.favoriteIds.contains(place.id),
                    onFavoriteToggle: () async {
                      await appProvider.toggleFavorite(place.id);
                    },
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => PlaceDetailsScreen(place: place),
                        ),
                      );
                    },
                    userLocation: appProvider.currentLocation,
                  ),
                );
              },
            ),
          )
        else
          ...section.places.map((place) {
            return EnhancedPlaceCard(
              place: place,
              isFavorite: appProvider.favoriteIds.contains(place.id),
              onFavoriteToggle: () async {
                await appProvider.toggleFavorite(place.id);
              },
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PlaceDetailsScreen(place: place),
                  ),
                );
              },
              userLocation: appProvider.currentLocation,
            );
          }).toList(),
        
        const SizedBox(height: 24),
      ],
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Filters',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              const Text('More filters coming soon...'),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
