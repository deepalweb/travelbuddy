import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../models/place.dart';
import '../screens/deal_detail_screen.dart';
import '../services/places_service.dart';
import '../services/location_service.dart';

class DealsScreen extends StatefulWidget {
  const DealsScreen({super.key});

  @override
  State<DealsScreen> createState() => _DealsScreenState();
}

class _DealsScreenState extends State<DealsScreen> {
  String _selectedFilter = 'all';
  List<Place> _places = [];
  bool _isLoadingPlaces = false;
  String? _placesError;
  Map<String, int> _categoryLimits = {};
  int _allDealsLimit = 12;
  static const int _initialLimit = 4;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadRealPlacesData();
    });
  }
  
  Future<void> _loadRealPlacesData() async {
    setState(() {
      _isLoadingPlaces = true;
      _placesError = null;
    });
    
    try {
      final locationService = LocationService();
      final position = await locationService.getCurrentLocation();
      
      if (position != null) {
        final placesService = PlacesService();
        final query = _getQueryForFilter(_selectedFilter);
        
        List<Place> allPlaces = [];
        
        if (_selectedFilter == 'all') {
          // For 'all', fetch multiple categories separately
          final queries = ['restaurant', 'cafe', 'shopping mall', 'tourist attraction', 'hotel'];
          
          for (final q in queries) {
            try {
              final places = await placesService.fetchPlacesPipeline(
                latitude: position.latitude,
                longitude: position.longitude,
                query: q,
                radius: 25000,
                topN: 20,
              );
              allPlaces.addAll(places);
              print('🎯 Query "$q" returned ${places.length} places');
            } catch (e) {
              print('❌ Query "$q" failed: $e');
            }
          }
        } else {
          // For specific filters, use single query
          allPlaces = await placesService.fetchPlacesPipeline(
            latitude: position.latitude,
            longitude: position.longitude,
            query: query,
            radius: 25000,
            topN: 50,
          );
        }
        
        // Remove duplicates
        final uniquePlaces = <String, Place>{};
        for (final place in allPlaces) {
          uniquePlaces[place.id] = place;
        }
        final places = uniquePlaces.values.toList();
        
        print('🎯 Total unique places: ${places.length}');
        if (places.isNotEmpty) {
          print('📍 Sample places: ${places.take(3).map((p) => p.name).join(", ")}');
        }
        
        setState(() {
          _places = places;
          _isLoadingPlaces = false;
        });
      } else {
        throw Exception('Location not available');
      }
    } catch (e) {
      setState(() {
        _placesError = e.toString();
        _isLoadingPlaces = false;
      });
    }
  }
  
  String _getQueryForFilter(String filter) {
    switch (filter) {
      case 'restaurant': return 'restaurant';
      case 'hotel': return 'hotel';
      case 'cafe': return 'cafe';
      case 'shop': return 'shopping mall';
      case 'attraction': return 'tourist attraction';
      default: return 'restaurant'; // Start with restaurants for 'all'
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Deals'),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadRealPlacesData,
              ),
            ],
          ),
          body: Column(
            children: [
              // Filter Buttons
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['all', 'restaurant', 'hotel', 'cafe', 'shop', 'attraction'].map((filter) {
                    final isSelected = _selectedFilter == filter;
                    return FilterChip(
                      label: Text(
                        filter == 'all' ? 'All Deals' : '${filter[0].toUpperCase()}${filter.substring(1)}s',
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.grey[700],
                          fontSize: 14,
                        ),
                      ),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() => _selectedFilter = filter);
                        _loadRealPlacesData();
                      },
                      backgroundColor: isSelected ? Color(AppConstants.colors['primary']!) : Colors.white,
                      selectedColor: Color(AppConstants.colors['primary']!),
                      side: BorderSide(
                        color: isSelected ? Color(AppConstants.colors['primary']!) : Colors.grey[300]!,
                      ),
                    );
                  }).toList(),
                ),
              ),
              
              // Deals Content
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _loadRealPlacesData,
                  child: _buildDealsContent(appProvider),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDealsContent(AppProvider appProvider) {
    if (_isLoadingPlaces) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Finding the best deals for you...'),
          ],
        ),
      );
    }

    if (_placesError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            const Text('Failed to load deals', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(_placesError!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadRealPlacesData(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final filteredPlaces = _getFilteredPlaces(_places);
    final placesByCategory = _groupPlacesByCategory(filteredPlaces);
    
    print('📋 Total places loaded: ${_places.length}');
    print('🔍 Filtered places for "$_selectedFilter": ${filteredPlaces.length}');
    print('📁 Categories found: ${placesByCategory.keys.join(", ")}');

    if (filteredPlaces.isNotEmpty) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
            if (_selectedFilter == 'all') ...[
              // Show all deals in a single grid
              Text(
                'All Deals (${filteredPlaces.length} available)',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.8,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: _allDealsLimit > filteredPlaces.length ? filteredPlaces.length : _allDealsLimit,
                itemBuilder: (context, index) => _buildDealCard(filteredPlaces[index]),
              ),
              if (_allDealsLimit < filteredPlaces.length) ...[
                const SizedBox(height: 12),
                Center(
                  child: OutlinedButton.icon(
                    onPressed: _showMoreAllDeals,
                    icon: const Icon(Icons.expand_more),
                    label: const Text('Show More Deals'),
                  ),
                ),
              ],
            ] else ...[
              // Show filtered places
              Text(
                _getDealsCategoryTitle(),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.8,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: _getCategoryDisplayCount(_selectedFilter, filteredPlaces.length),
                itemBuilder: (context, index) => _buildDealCard(filteredPlaces[index]),
              ),
              if (_shouldShowMoreButton(_selectedFilter, filteredPlaces.length)) ...[
                const SizedBox(height: 12),
                Center(
                  child: OutlinedButton.icon(
                    onPressed: () => _showMoreDeals(_selectedFilter),
                    icon: const Icon(Icons.expand_more),
                    label: Text('Show More ${_getDealsCategoryTitle()}'),
                  ),
                ),
              ],
            ],
        ],
      );
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.local_offer_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          const Text(
            'No deals found',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Try a different category or check back later!',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDealCard(Place place) {
    final deal = _convertPlaceToDeal(place);
    
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _showDealDetails(deal),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    color: Colors.grey[300],
                    child: place.photoUrl.isNotEmpty
                        ? Image.network(
                            place.photoUrl,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return const Center(
                                child: CircularProgressIndicator(strokeWidth: 2),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) => 
                                _buildPlaceholderImage(place.type),
                          )
                        : _buildPlaceholderImage(place.type),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        deal.discount,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    deal.title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'at ${place.name}',
                    style: TextStyle(
                      color: Color(AppConstants.colors['textSecondary']!),
                      fontSize: 10,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Row(
                    children: [
                      const Icon(Icons.local_offer, color: Colors.green, size: 12),
                      Text(
                        ' \$${deal.price?.amount.toInt() ?? 25}',
                        style: const TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      const Icon(Icons.star, color: Colors.amber, size: 12),
                      Text(
                        ' ${place.rating.toStringAsFixed(1)}',
                        style: const TextStyle(fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Deal _convertPlaceToDeal(Place place) {
    final discounts = ['20% OFF', '30% OFF', '25% OFF', 'Buy 1 Get 1', '15% OFF', '40% OFF'];
    final discount = discounts[place.name.hashCode % discounts.length];
    
    String dealTitle = _generateDealTitle(place.type, discount);
    double price = _generateDealPrice(place.type);
    
    return Deal(
      id: 'deal_${place.id}',
      title: dealTitle,
      description: place.description,
      discount: discount,
      placeName: place.name,
      businessType: _getBusinessType(place.type),
      businessName: place.name,
      images: place.photoUrl.isNotEmpty ? [place.photoUrl] : [],
      validUntil: DateTime.now().add(Duration(days: 7 + (place.name.hashCode % 14))),
      views: 50 + (place.name.hashCode % 200),
      claims: 5 + (place.name.hashCode % 25),
      price: PriceInfo(amount: price, currencyCode: 'USD'),
    );
  }
  
  String _generateDealTitle(String placeType, String discount) {
    final type = placeType.toLowerCase();
    
    if (type.contains('restaurant') || type.contains('food')) {
      return '$discount Dining Experience';
    } else if (type.contains('hotel') || type.contains('lodging')) {
      return '$discount Hotel Stay';
    } else if (type.contains('cafe') || type.contains('coffee')) {
      return '$discount Coffee & Pastries';
    } else if (type.contains('shop') || type.contains('store')) {
      return '$discount Shopping Deal';
    } else if (type.contains('museum') || type.contains('attraction')) {
      return '$discount Admission Ticket';
    } else {
      return '$discount Special Offer';
    }
  }
  
  double _generateDealPrice(String placeType) {
    final type = placeType.toLowerCase();
    
    if (type.contains('restaurant') || type.contains('food')) {
      return 25.0 + (type.hashCode % 30);
    } else if (type.contains('hotel') || type.contains('lodging')) {
      return 80.0 + (type.hashCode % 50);
    } else if (type.contains('cafe') || type.contains('coffee')) {
      return 8.0 + (type.hashCode % 12);
    } else if (type.contains('shop') || type.contains('store')) {
      return 15.0 + (type.hashCode % 35);
    } else if (type.contains('museum') || type.contains('attraction')) {
      return 12.0 + (type.hashCode % 18);
    } else {
      return 20.0 + (type.hashCode % 25);
    }
  }
  
  String _getBusinessType(String placeType) {
    final type = placeType.toLowerCase();
    
    if (type.contains('restaurant') || type.contains('food')) {
      return 'restaurant';
    } else if (type.contains('hotel') || type.contains('lodging')) {
      return 'hotel';
    } else if (type.contains('cafe') || type.contains('coffee')) {
      return 'cafe';
    } else if (type.contains('shop') || type.contains('store')) {
      return 'shop';
    } else if (type.contains('museum') || type.contains('attraction')) {
      return 'attraction';
    } else {
      return 'general';
    }
  }
  
  Widget _buildPlaceholderImage(String placeType) {
    final type = placeType.toLowerCase();
    IconData iconData;
    Color backgroundColor;
    
    if (type.contains('restaurant') || type.contains('food')) {
      iconData = Icons.restaurant;
      backgroundColor = Colors.orange[100]!;
    } else if (type.contains('hotel') || type.contains('lodging')) {
      iconData = Icons.hotel;
      backgroundColor = Colors.blue[100]!;
    } else if (type.contains('cafe') || type.contains('coffee')) {
      iconData = Icons.local_cafe;
      backgroundColor = Colors.brown[100]!;
    } else if (type.contains('shop') || type.contains('store')) {
      iconData = Icons.shopping_bag;
      backgroundColor = Colors.purple[100]!;
    } else if (type.contains('museum') || type.contains('attraction')) {
      iconData = Icons.museum;
      backgroundColor = Colors.green[100]!;
    } else {
      iconData = Icons.place;
      backgroundColor = Colors.grey[200]!;
    }
    
    return Container(
      color: backgroundColor,
      child: Icon(
        iconData,
        size: 40,
        color: Colors.grey[600],
      ),
    );
  }
  
  Map<String, List<Place>> _groupPlacesByCategory(List<Place> places) {
    final grouped = <String, List<Place>>{};
    
    for (final place in places) {
      final category = _getPlaceCategory(place);
      if (!grouped.containsKey(category)) {
        grouped[category] = [];
      }
      grouped[category]!.add(place);
    }
    
    return grouped;
  }
  
  String _getPlaceCategory(Place place) {
    final type = place.type.toLowerCase();
    final name = place.name.toLowerCase();
    
    // Restaurants & Food
    if (type.contains('restaurant') || type.contains('food') || type.contains('dining') || 
        name.contains('restaurant') || name.contains('grill') || name.contains('bistro')) {
      return 'Restaurants';
    }
    
    // Hotels & Accommodation
    if (type.contains('hotel') || type.contains('lodging') || type.contains('motel') || 
        type.contains('resort') || name.contains('hotel') || name.contains('inn')) {
      return 'Hotels';
    }
    
    // Cafes & Coffee
    if (type.contains('cafe') || type.contains('coffee') || type.contains('bakery') || 
        name.contains('cafe') || name.contains('coffee') || name.contains('starbucks')) {
      return 'Cafes';
    }
    
    // Shopping & Retail
    if (type.contains('shop') || type.contains('store') || type.contains('mall') || 
        type.contains('market') || type.contains('supermarket') || type.contains('pharmacy') ||
        name.contains('shop') || name.contains('store') || name.contains('mall')) {
      return 'Shopping';
    }
    
    // Attractions & Entertainment
    if (type.contains('museum') || type.contains('attraction') || type.contains('park') || 
        type.contains('theater') || type.contains('cinema') || type.contains('entertainment') ||
        name.contains('museum') || name.contains('park') || name.contains('theater')) {
      return 'Attractions';
    }
    
    // Services & Others
    if (type.contains('bank') || type.contains('gym') || type.contains('spa') || 
        type.contains('gas') || type.contains('hospital') || type.contains('school')) {
      return 'Services';
    }
    
    return 'Other Places';
  }
  
  List<Place> _getFilteredPlaces(List<Place> places) {
    if (_selectedFilter == 'all') return places;
    
    final filterMap = {
      'restaurant': ['restaurant', 'dining', 'food'],
      'hotel': ['hotel', 'lodging', 'accommodation'],
      'cafe': ['cafe', 'coffee', 'bakery'],
      'shop': ['shop', 'store', 'mall', 'boutique'],
      'attraction': ['museum', 'attraction', 'park', 'landmark'],
    };
    
    final keywords = filterMap[_selectedFilter] ?? [];
    return places.where((place) {
      final type = place.type.toLowerCase();
      final name = place.name.toLowerCase();
      return keywords.any((keyword) => 
          type.contains(keyword) || name.contains(keyword));
    }).toList();
  }
  
  String _getDealsCategoryTitle() {
    final categoryTitles = {
      'restaurant': 'Restaurant Deals',
      'hotel': 'Hotel Deals',
      'cafe': 'Cafe Deals',
      'shop': 'Shopping Deals',
      'attraction': 'Attraction Deals',
      'all': 'All Deals',
    };
    
    return categoryTitles[_selectedFilter] ?? 'Deals';
  }
  
  String _getDealsCategoryName(String category) {
    final categoryNames = {
      'Restaurants': 'Restaurant Deals',
      'Hotels': 'Hotel Deals',
      'Cafes': 'Cafe Deals',
      'Shopping': 'Shopping Deals',
      'Attractions': 'Attraction Deals',
      'Services': 'Service Deals',
      'Other Places': 'Other Deals',
    };
    
    return categoryNames[category] ?? '$category Deals';
  }
  
  int _getCategoryDisplayCount(String category, int totalCount) {
    final limit = _categoryLimits[category] ?? _initialLimit;
    return limit > totalCount ? totalCount : limit;
  }
  
  bool _shouldShowMoreButton(String category, int totalCount) {
    final currentLimit = _categoryLimits[category] ?? _initialLimit;
    return totalCount > currentLimit;
  }
  
  void _showMoreDeals(String category) {
    setState(() {
      final currentLimit = _categoryLimits[category] ?? _initialLimit;
      _categoryLimits[category] = currentLimit + 4;
    });
    
    // Load more places if we're running low
    if (_shouldLoadMorePlaces(category)) {
      _loadMorePlacesFromAPI();
    }
  }
  
  void _showMoreAllDeals() {
    setState(() {
      _allDealsLimit += 8; // Load 8 more deals for "All" view
    });
    
    // Load more places if we're running low
    if (_allDealsLimit >= _places.length - 4) {
      _loadMorePlacesFromAPI();
    }
  }
  
  bool _shouldLoadMorePlaces(String category) {
    final currentLimit = _categoryLimits[category] ?? _initialLimit;
    final filteredPlaces = _getFilteredPlaces(_places);
    return currentLimit >= filteredPlaces.length - 2;
  }
  
  Future<void> _loadMorePlacesFromAPI() async {
    if (_isLoadingPlaces) return;
    
    setState(() {
      _isLoadingPlaces = true;
    });
    
    try {
      final locationService = LocationService();
      final position = await locationService.getCurrentLocation();
      
      if (position != null) {
        final placesService = PlacesService();
        final query = _getQueryForFilter(_selectedFilter);
        
        final newPlaces = await placesService.fetchPlacesPipeline(
          latitude: position.latitude,
          longitude: position.longitude,
          query: query,
          radius: 30000, // Wider radius for more results
          topN: 20, // Load 20 more places
        );
        
        setState(() {
          // Add new places that aren't already in the list
          final existingIds = _places.map((p) => p.id).toSet();
          final uniqueNewPlaces = newPlaces.where((p) => !existingIds.contains(p.id)).toList();
          _places.addAll(uniqueNewPlaces);
        });
      }
    } catch (e) {
      print('Error loading more places: $e');
    } finally {
      setState(() {
        _isLoadingPlaces = false;
      });
    }
  }
  
  void _showDealDetails(Deal deal) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DealDetailScreen(deal: deal),
      ),
    );
  }
}