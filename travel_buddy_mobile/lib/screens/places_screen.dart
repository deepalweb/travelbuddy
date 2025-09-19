import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../widgets/place_card.dart';
import '../widgets/search_bar_widget.dart';
import 'place_details_screen.dart';
import 'subscription_plans_screen.dart';

class PlacesScreen extends StatefulWidget {
  const PlacesScreen({super.key});

  @override
  State<PlacesScreen> createState() => _PlacesScreenState();
}

class _PlacesScreenState extends State<PlacesScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    // Load places when screen initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      _loadPlacesWithLocation(appProvider);
    });
  }
  
  Future<void> _loadPlacesWithLocation(AppProvider appProvider) async {
    // Ensure location is available first
    if (appProvider.currentLocation == null) {
      print('🔄 Getting location first...');
      await appProvider.getCurrentLocation();
    }
    
    // Then load places
    if (appProvider.places.isEmpty && !appProvider.isPlacesLoading) {
      print('🔄 Loading places...');
      await appProvider.loadNearbyPlaces();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Explore Places'),
            actions: [
              IconButton(
                icon: const Icon(Icons.filter_list),
                onPressed: () => _showFilterBottomSheet(context, appProvider),
              ),
            ],
          ),
          body: Column(
            children: [
              // Search Bar
              Padding(
                padding: const EdgeInsets.all(16),
                child: SearchBarWidget(
                  controller: _searchController,
                  onSearch: (query) {
                    print('🔍 Search triggered: "$query"');
                    appProvider.searchPlaces(query);
                  },
                ),
              ),
              
              // Smart category filter with time-based suggestions
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
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
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.orange[100],
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _getTimeBasedSuggestion(),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange[800],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 50,
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
                            label: Text(category['label']!),
                            selected: isSelected,
                            onSelected: (selected) {
                              appProvider.setSelectedCategory(category['value']!);
                            },
                            selectedColor: Color(AppConstants.colors['primary']!).withOpacity(0.2),
                            checkmarkColor: Color(AppConstants.colors['primary']!),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // User guidance and helpful info
              if (appProvider.places.isEmpty && !appProvider.isPlacesLoading)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.blue[200]!),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.info_outline, color: Colors.blue[600], size: 32),
                            const SizedBox(height: 8),
                            Text(
                              'Discover Amazing Places',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue[800],
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'We\'ll show you the best attractions, restaurants, and experiences based on your location and time of day.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.blue[700]),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => _loadPlacesWithLocation(appProvider),
                        icon: const Icon(Icons.explore),
                        label: const Text('Find Places Near Me'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(AppConstants.colors['primary']!),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const SizedBox(height: 16),
              
              // Places List with Pull-to-Refresh
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => appProvider.loadNearbyPlaces(),
                  child: _buildPlacesListWithLoadMore(appProvider),
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
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      physics: const AlwaysScrollableScrollPhysics(), // Enable pull-to-refresh even with few items
      itemCount: appProvider.places.length + (appProvider.hasMorePlaces ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == appProvider.places.length) {
          // Load more button
          return _buildLoadMoreButton(appProvider);
        }
        
        final place = appProvider.places[index];
        return PlaceCard(
          place: place,
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
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
              SizedBox(
                width: double.infinity,
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
            ],
          ),
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
}