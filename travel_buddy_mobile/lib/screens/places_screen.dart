import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../widgets/place_card.dart';
import '../widgets/search_bar_widget.dart';
import '../widgets/place_section_widget.dart';
import '../services/places_service.dart';
import '../utils/api_debouncer.dart';
import 'place_details_screen.dart';
import 'subscription_plans_screen.dart';
import 'route_plan_screen.dart';

class PlacesScreen extends StatefulWidget {
  const PlacesScreen({super.key});

  @override
  State<PlacesScreen> createState() => _PlacesScreenState();
}

class _PlacesScreenState extends State<PlacesScreen> {
  final TextEditingController _searchController = TextEditingController();
  final _searchDebouncer = ApiDebouncer(delay: Duration(milliseconds: 500));

  @override
  void dispose() {
    _searchController.dispose();
    _searchDebouncer.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // Load sectioned places when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      _loadSectionedPlaces(appProvider);
    });
  }
  
  Future<void> _loadSectionedPlaces(AppProvider appProvider) async {
    // Ensure location is available first
    if (appProvider.currentLocation == null) {
      print('🔄 Getting location first...');
      await appProvider.getCurrentLocation();
    }
    
    // Load sectioned places
    if (appProvider.placeSections.isEmpty && !appProvider.isSectionsLoading) {
      print('🔄 Loading sectioned places...');
      await appProvider.loadPlaceSections();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: Text(appProvider.showFavoritesOnly ? 'Favorite Places' : 'Explore Places'),
            leading: appProvider.showFavoritesOnly 
                ? IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () {
                      appProvider.clearFavoritesFilter();
                    },
                  )
                : null,
            actions: [
              if (!appProvider.showFavoritesOnly)
                IconButton(
                  icon: const Icon(Icons.filter_list),
                  onPressed: () => _showFilterBottomSheet(context, appProvider),
                ),
            ],
          ),
          body: Column(
            children: [
              // Personalized Header (hide in favorites mode)
              if (!appProvider.showFavoritesOnly)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getPersonalizedGreeting(appProvider),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (_getSmartSuggestion().isNotEmpty)
                        GestureDetector(
                          onTap: () => _applySuggestionFilter(appProvider),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.blue[50],
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.blue[200]!),
                            ),
                            child: Text(
                              _getSmartSuggestion(),
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.blue[700],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              
              // Search Bar (hide in favorites mode)
              if (!appProvider.showFavoritesOnly)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SearchBarWidget(
                    controller: _searchController,
                    onSearch: (query) {
                      _searchDebouncer.call(() {
                        if (query.trim().isNotEmpty) {
                          appProvider.performInstantSearch(query.trim());
                        } else {
                          appProvider.clearSearchAndShowSections();
                        }
                      });
                    },
                  ),
                ),
              
              // Smart category filter with time-based suggestions (hide in favorites mode)
              if (!appProvider.showFavoritesOnly)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            'Categories',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Color(AppConstants.colors['text']!),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (_getTimeBasedSuggestion().isNotEmpty)
                            Flexible(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.orange[100],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  _getTimeBasedSuggestion(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.orange[800],
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              if (!appProvider.showFavoritesOnly)
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: AppConstants.placeCategories.length,
                    itemBuilder: (context, index) {
                      final category = AppConstants.placeCategories[index];
                      final isSelected = appProvider.selectedCategory == category['value'];
                      
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(
                            category['label']!,
                            style: const TextStyle(fontSize: 13),
                          ),
                          selected: isSelected,
                          onSelected: (selected) {
                            appProvider.setSelectedCategory(category['value']!);
                          },
                          selectedColor: Color(AppConstants.colors['primary']!).withOpacity(0.2),
                          checkmarkColor: Color(AppConstants.colors['primary']!),
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          visualDensity: VisualDensity.compact,
                        ),
                      );
                    },
                  ),
                ),
              
              const SizedBox(height: 20),
              
              // User guidance and helpful info
              if (appProvider.placeSections.isEmpty && !appProvider.isSectionsLoading)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.blue[200]!),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.info_outline, color: Colors.blue[600], size: 36),
                            const SizedBox(height: 12),
                            Text(
                              'Discover Amazing Places',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue[800],
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'We\'ll show you personalized sections of places based on your interests and location.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.blue[700],
                                fontSize: 14,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: ElevatedButton.icon(
                              onPressed: () => _loadSectionedPlaces(appProvider),
                              icon: const Icon(Icons.explore, size: 20),
                              label: const Text('Find Places'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Color(AppConstants.colors['primary']!),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton(
                              onPressed: () => _testApiConnection(),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Text('Test API', style: TextStyle(fontSize: 13)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              
              // Search Results, Sectioned Places List, or Favorites List
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async {
                    if (appProvider.showFavoritesOnly) {
                      // Refresh favorites by reloading places
                      await appProvider.loadNearbyPlaces();
                    } else if (_searchController.text.isNotEmpty) {
                      await appProvider.performInstantSearch(_searchController.text.trim());
                    } else {
                      await appProvider.forceRefreshPlaces();
                      await appProvider.loadPlaceSections();
                    }
                  },
                  child: appProvider.showFavoritesOnly
                      ? _buildFavoritesList(appProvider)
                      : _searchController.text.isNotEmpty 
                          ? _buildSearchResults(appProvider)
                          : appProvider.selectedCategory != 'all'
                              ? _buildCategoryResults(appProvider)
                              : _buildSectionedPlacesList(appProvider),
                ),
              ),
            ],
          ),

        );
      },
    );
  }

  Widget _buildPlacesList(AppProvider appProvider) {
    if (appProvider.isPlacesLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (appProvider.placesError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              'Error loading places',
              style: TextStyle(
                fontSize: 18,
                color: Color(AppConstants.colors['textSecondary']!),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              appProvider.placesError!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(AppConstants.colors['textSecondary']!),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => appProvider.loadNearbyPlaces(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (appProvider.places.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.explore_off,
              size: 64,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              'No places found nearby',
              style: TextStyle(
                fontSize: 18,
                color: Color(AppConstants.colors['textSecondary']!),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Try expanding your search radius or\nchoose a different category',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                OutlinedButton.icon(
                  onPressed: () => _showFilterBottomSheet(context, appProvider),
                  icon: const Icon(Icons.tune),
                  label: const Text('Adjust Filters'),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () => appProvider.loadNearbyPlaces(),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Try Again'),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return _buildPlacesListView(appProvider);
  }

  Widget _buildPlacesListWithLoadMore(AppProvider appProvider) {
    if (appProvider.isPlacesLoading && appProvider.places.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (appProvider.placesError != null && appProvider.places.isEmpty) {
      return _buildErrorState(appProvider);
    }

    if (appProvider.places.isEmpty) {
      return _buildEmptyState(appProvider);
    }

    return _buildPlacesListView(appProvider);
  }
  
  Widget _buildPlacesListView(AppProvider appProvider) {
    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.75,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final place = appProvider.places[index];
                return PlaceCard(
                  place: place,
                  compact: true,
                  isFavorite: appProvider.favoriteIds.contains(place.id),
                  onFavoriteToggle: () async {
                    final success = await appProvider.toggleFavorite(place.id);
                    if (!success && mounted) {
                      _showUpgradeDialog(context);
                    }
                  },
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => PlaceDetailsScreen(place: place),
                      ),
                    );
                  },
                );
              },
              childCount: appProvider.places.length,
            ),
          ),
        ),
        if (appProvider.hasMorePlaces)
          SliverToBoxAdapter(
            child: _buildLoadMoreButton(appProvider),
          ),
      ],
    );
  }
  
  Widget _buildLoadMoreButton(AppProvider appProvider) {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (appProvider.isPlacesLoading)
            const Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            )
          else
            ElevatedButton.icon(
              onPressed: () => appProvider.loadMorePlaces(),
              icon: const Icon(Icons.expand_more),
              label: Text('Show More Places (${appProvider.places.length} shown)'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(AppConstants.colors['primary']!),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
          const SizedBox(height: 8),
          Text(
            'Page ${appProvider.currentPage} • Tap to load more',
            style: TextStyle(
              fontSize: 12,
              color: Color(AppConstants.colors['textSecondary']!),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildErrorState(AppProvider appProvider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            'Error loading places',
            style: TextStyle(
              fontSize: 18,
              color: Color(AppConstants.colors['textSecondary']!),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            appProvider.placesError!,
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(AppConstants.colors['textSecondary']!)),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => appProvider.loadNearbyPlaces(),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildEmptyState(AppProvider appProvider) {
    return ListView( // Make it scrollable for pull-to-refresh
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.3),
        Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.explore_off, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              Text(
                'No places found nearby',
                style: TextStyle(
                  fontSize: 18,
                  color: Color(AppConstants.colors['textSecondary']!),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Pull down to refresh or try different filters',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _showFilterBottomSheet(context, appProvider),
                    icon: const Icon(Icons.tune),
                    label: const Text('Adjust Filters'),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton.icon(
                    onPressed: () => appProvider.loadNearbyPlaces(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Try Again'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getPersonalizedGreeting(AppProvider appProvider) {
    final hour = DateTime.now().hour;
    final username = appProvider.currentUser?.username ?? 'Explorer';
    
    String timeGreeting;
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 18) {
      timeGreeting = 'Good afternoon';
    } else {
      timeGreeting = 'Good evening';
    }
    
    return '$timeGreeting, $username 👋 Ready to explore?';
  }
  
  String _getSmartSuggestion() {
    final hour = DateTime.now().hour;
    final weather = 'sunny'; // Could get from weather service
    
    if (hour < 12) {
      return 'Perfect morning for cafes & culture ☕';
    } else if (hour < 18) {
      return 'Sunny afternoon: perfect for parks 🌳';
    } else {
      return 'Evening vibes: restaurants & nightlife 🌆';
    }
  }
  
  void _applySuggestionFilter(AppProvider appProvider) {
    final hour = DateTime.now().hour;
    
    if (hour < 12) {
      appProvider.setSelectedCategory('culture');
    } else if (hour < 18) {
      appProvider.setSelectedCategory('nature');
    } else {
      appProvider.setSelectedCategory('food');
    }
  }
  
  String _getTimeBasedSuggestion() {
    final now = DateTime.now();
    final hour = now.hour;
    final isWeekend = now.weekday >= 6;
    final appProvider = context.read<AppProvider>();
    final weather = appProvider.weatherInfo?.condition.toLowerCase() ?? 'clear';
    final isRainy = weather.contains('rain') || weather.contains('storm');
    
    if (hour >= 18) {
      if (isWeekend) {
        return isRainy ? 'Weekend evening: Indoor dining & entertainment' : 'Weekend evening: Nightlife & outdoor dining';
      } else {
        return isRainy ? 'Evening: Cozy indoor restaurants' : 'Evening: Try restaurants & nightlife';
      }
    } else if (hour >= 12) {
      if (isRainy) {
        return isWeekend ? 'Weekend afternoon: Museums & shopping' : 'Afternoon: Indoor attractions & cafes';
      } else {
        return isWeekend ? 'Weekend afternoon: Outdoor attractions' : 'Afternoon: Perfect for sightseeing';
      }
    } else {
      if (isWeekend) {
        return isRainy ? 'Weekend morning: Museums & indoor culture' : 'Weekend morning: Parks & outdoor attractions';
      } else {
        return isRainy ? 'Morning: Cozy cafes & museums' : 'Morning: Great for cafes & culture';
      }
    }
  }
  
  void _showFilterBottomSheet(BuildContext context, AppProvider appProvider) {
    showModalBottomSheet(
      context: context,
      useSafeArea: true,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Text(
                'Filters',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              // Radius Filter with helpful info
              Row(
                children: [
                  const Text(
                    'Search Radius',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${(appProvider.selectedRadius / 1000).round()} km',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              
              Slider(
                value: appProvider.selectedRadius.toDouble(),
                min: 5000,
                max: 50000,
                divisions: 9,
                onChanged: (value) {
                  appProvider.setSelectedRadius(value.round());
                },
              ),
              
              Text(
                'Larger radius finds more places but may include distant locations',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Apply Button with place count estimate
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        // Clear search and reload with new filters
                        _searchController.clear();
                        appProvider.loadNearbyPlaces();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(AppConstants.colors['primary']!),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Apply & Search'),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  
  Widget _buildSectionedPlacesList(AppProvider appProvider) {
    if (appProvider.isSectionsLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (appProvider.placeSections.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
          Center(
            child: Column(
              children: [
                const Icon(Icons.explore_off, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                const Text('No places found nearby', style: TextStyle(fontSize: 18, color: Colors.grey)),
                const SizedBox(height: 8),
                const Text('Pull down to refresh or try different location'),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => _loadSectionedPlaces(appProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ],
      );
    }
    
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: appProvider.placeSections.length,
      itemBuilder: (context, index) {
        final section = appProvider.placeSections[index];
        return PlaceSectionWidget(
          section: section,
          onFavoriteToggle: (placeId) async {
            final success = await appProvider.toggleFavorite(placeId);
            if (!success && mounted) {
              _showUpgradeDialog(context);
            }
          },
        );
      },
    );
  }
  
  void _showUpgradeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Upgrade Required'),
        content: const Text('You\'ve reached the favorites limit for free users. Upgrade to add unlimited favorites!'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const SubscriptionPlansScreen(),
                ),
              );
            },
            child: const Text('Upgrade'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _testApiConnection() async {
    final placesService = PlacesService();
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🔍 Testing API connections...'),
        backgroundColor: Colors.orange,
      ),
    );
    
    // Test backend connection
    // Skip connection test for now
    final isConnected = true;
    
    // Test Gemini AI
    await _testGeminiAI();
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isConnected ? '✅ API tests completed - check console' : '❌ API connection failed - check console'),
        backgroundColor: isConnected ? Colors.green : Colors.red,
      ),
    );
  }
  
  Widget _buildSearchResults(AppProvider appProvider) {
    if (appProvider.isPlacesLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (appProvider.placesError != null) {
      return _buildErrorState(appProvider);
    }

    if (appProvider.places.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
          Center(
            child: Column(
              children: [
                const Icon(Icons.search_off, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                Text(
                  'No results for "${_searchController.text}"',
                  style: const TextStyle(fontSize: 18, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                const Text('Try different keywords or clear search'),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    _searchController.clear();
                    appProvider.clearSearchAndShowSections();
                  },
                  icon: const Icon(Icons.clear),
                  label: const Text('Clear Search'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Search results header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Text(
                'Results for "${_searchController.text}"',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Text(
                '${appProvider.places.length} found',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
        ),
        // Search results list
        Expanded(
          child: _buildPlacesListView(appProvider),
        ),
      ],
    );
  }

  Widget _buildFavoritesList(AppProvider appProvider) {
    final favoritePlaces = appProvider.filteredPlaces;
    
    if (favoritePlaces.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
          Center(
            child: Column(
              children: [
                Icon(Icons.favorite_border, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                const Text(
                  'No Favorite Places Yet',
                  style: TextStyle(fontSize: 18, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Start exploring and save places you love!',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    appProvider.clearFavoritesFilter();
                  },
                  icon: const Icon(Icons.explore),
                  label: const Text('Explore Places'),
                ),
              ],
            ),
          ),
        ],
      );
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Favorites header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Icon(Icons.favorite, color: Colors.red[600], size: 20),
              const SizedBox(width: 8),
              Text(
                'Your Favorites (${favoritePlaces.length})',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        // Favorites grid
        Expanded(
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final place = favoritePlaces[index];
                      return PlaceCard(
                        place: place,
                        compact: true,
                        isFavorite: true, // All places in this list are favorites
                        onFavoriteToggle: () async {
                          await appProvider.toggleFavorite(place.id);
                        },
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => PlaceDetailsScreen(place: place),
                            ),
                          );
                        },
                      );
                    },
                    childCount: favoritePlaces.length,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryResults(AppProvider appProvider) {
    if (appProvider.isPlacesLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (appProvider.placesError != null) {
      return _buildErrorState(appProvider);
    }

    if (appProvider.places.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
          Center(
            child: Column(
              children: [
                const Icon(Icons.category_outlined, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                Text(
                  'No ${_getCategoryDisplayName(appProvider.selectedCategory)} found nearby',
                  style: const TextStyle(fontSize: 18, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                const Text('Try expanding search radius or choose different category'),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () => appProvider.setSelectedCategory('all'),
                      icon: const Icon(Icons.clear),
                      label: const Text('Show All'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      onPressed: () => appProvider.loadNearbyPlaces(),
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try Again'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category results header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Text(
                _getCategoryDisplayName(appProvider.selectedCategory),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              Text(
                '${appProvider.places.length} found',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
        ),
        // Category results list
        Expanded(
          child: _buildPlacesListView(appProvider),
        ),
      ],
    );
  }
  
  String _getCategoryDisplayName(String category) {
    final categoryMap = {
      'food': 'Restaurants & Food',
      'landmarks': 'Landmarks & Attractions', 
      'culture': 'Culture & Museums',
      'nature': 'Nature & Parks',
      'shopping': 'Shopping',
      'spa': 'Spa & Wellness',
      'all': 'All Places'
    };
    return categoryMap[category] ?? category.toUpperCase();
  }

  void _openRoutePlan(AppProvider appProvider) {
    if (appProvider.places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No places available for route planning'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RoutePlanScreen(
          places: appProvider.places,
          title: 'Places Route Plan',
        ),
      ),
    );
  }

  Future<void> _testGeminiAI() async {
    try {
      // Test Azure backend URL first
      print('🌐 Testing Azure backend: ${AppConstants.baseUrl}');
      final healthResponse = await http.get(
        Uri.parse('${AppConstants.baseUrl}/health'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      print('🌐 Azure health check: ${healthResponse.statusCode}');
      print('🌐 Health response: ${healthResponse.body}');
      
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/api/ai/test-key'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      print('🤖 Gemini Key test: ${response.statusCode}');
      print('🤖 Response: ${response.body}');
      
      // Test actual generation
      final genResponse = await http.get(
        Uri.parse('${AppConstants.baseUrl}/api/ai/test-generate'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 15));
      print('🤖 Gemini Generate test: ${genResponse.statusCode}');
      print('🤖 Generate Response: ${genResponse.body}');
    } catch (e) {
      print('❌ Backend/Gemini AI test failed: $e');
      if (e.toString().contains('TimeoutException')) {
        print('❌ Azure backend is not responding - check if server is running');
      }
    }
  }
}