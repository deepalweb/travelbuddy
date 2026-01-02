import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'dart:math' as math;
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../models/place.dart';
import '../screens/deal_detail_screen.dart';
import '../services/deals_service.dart';
import '../services/analytics_service.dart';

class DealsScreen extends StatefulWidget {
  const DealsScreen({super.key});

  @override
  State<DealsScreen> createState() => _DealsScreenState();
}

class _DealsScreenState extends State<DealsScreen> {
  String _selectedFilter = 'all';
  String _sortBy = 'distance'; // distance, discount, newest
  final TextEditingController _searchController = TextEditingController();
  List<Deal> _deals = [];
  bool _isLoading = false;
  String? _error;
  
  // Pagination
  int _currentPage = 1;
  final int _dealsPerPage = 20;
  bool _hasMoreDeals = true;
  bool _isLoadingMore = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      AnalyticsService.logScreenView('deals_screen');
      _loadDeals();
    });
  }
  
  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }
  
  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore && _hasMoreDeals) {
        _loadMoreDeals();
      }
    }
  }
  
  Future<void> _loadDeals({bool reset = true}) async {
    if (reset) {
      setState(() {
        _isLoading = true;
        _error = null;
        _currentPage = 1;
        _hasMoreDeals = true;
        _deals.clear();
      });
    }
    
    try {
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      final location = appProvider.currentLocation;
      
      final deals = await DealsService.getDealsWithPagination(
        page: _currentPage,
        limit: _dealsPerPage,
      );
      
      // Check if loaded from cache (offline)
      final isOffline = deals.isNotEmpty && _currentPage == 1;
      
      // Calculate distance and sort by proximity if location available
      if (location != null) {
        for (var deal in deals) {
          if (deal.location?.coordinates != null && deal.location!.coordinates.length == 2) {
            final distance = _calculateDistance(
              location.latitude,
              location.longitude,
              deal.location!.coordinates[1],
              deal.location!.coordinates[0],
            );
            deal.distance = distance;
          }
        }
        deals.sort((a, b) => (a.distance ?? 999).compareTo(b.distance ?? 999));
      }
      
      setState(() {
        _deals = deals;
        _isLoading = false;
        _hasMoreDeals = deals.length >= _dealsPerPage;
      });
      
      print('✅ Loaded ${deals.length} deals into state');
      print('📊 First deal: ${deals.isNotEmpty ? deals.first.title : "none"}');
      print('📊 Last deal: ${deals.isNotEmpty ? deals.last.title : "none"}');
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }
  
  Future<void> _loadMoreDeals() async {
    if (_isLoadingMore || !_hasMoreDeals) return;
    
    setState(() {
      _isLoadingMore = true;
    });
    
    try {
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      final location = appProvider.currentLocation;
      
      _currentPage++;
      final newDeals = await DealsService.getDealsWithPagination(
        page: _currentPage,
        limit: _dealsPerPage,
      );
      
      // Calculate distance
      if (location != null) {
        for (var deal in newDeals) {
          if (deal.location?.coordinates != null && deal.location!.coordinates.length == 2) {
            final distance = _calculateDistance(
              location.latitude,
              location.longitude,
              deal.location!.coordinates[1],
              deal.location!.coordinates[0],
            );
            deal.distance = distance;
          }
        }
      }
      
      setState(() {
        _deals.addAll(newDeals);
        _isLoadingMore = false;
        _hasMoreDeals = newDeals.length >= _dealsPerPage;
      });
      
      print('✅ Loaded ${newDeals.length} more deals (total: ${_deals.length})');
    } catch (e) {
      setState(() {
        _isLoadingMore = false;
      });
      print('❌ Error loading more deals: $e');
    }
  }
  
  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295;
    final a = 0.5 - math.cos((lat2 - lat1) * p) / 2 +
        math.cos(lat1 * p) * math.cos(lat2 * p) * (1 - math.cos((lon2 - lon1) * p)) / 2;
    return 12742 * math.asin(math.sqrt(a));
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
                onPressed: _loadDeals,
              ),
            ],
          ),
          body: Column(
            children: [
              // Search Bar
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search deals...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                  ),
                  onChanged: (value) => setState(() {}),
                ),
              ),
              
              // Stats Banner
              _buildStatsBanner(),
              
              // Filter Chips with Sort
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Wrap(
                          spacing: 8,
                          children: ['all', 'restaurant', 'hotel', 'cafe', 'shop', 'attraction'].map((filter) {
                            final isSelected = _selectedFilter == filter;
                            return FilterChip(
                              label: Text(
                                filter == 'all' ? 'All' : '${filter[0].toUpperCase()}${filter.substring(1)}s',
                                style: TextStyle(
                                  color: isSelected ? Colors.white : Colors.grey[700],
                                  fontSize: 12,
                                ),
                              ),
                              selected: isSelected,
                              onSelected: (selected) {
                                setState(() => _selectedFilter = filter);
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
                    ),
                    const SizedBox(width: 8),
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.sort),
                      onSelected: (value) {
                        setState(() => _sortBy = value);
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: 'distance',
                          child: Row(
                            children: [
                              Icon(Icons.near_me, size: 18, color: _sortBy == 'distance' ? Colors.blue : Colors.grey),
                              const SizedBox(width: 8),
                              Text('Distance', style: TextStyle(color: _sortBy == 'distance' ? Colors.blue : Colors.black)),
                            ],
                          ),
                        ),
                        PopupMenuItem(
                          value: 'discount',
                          child: Row(
                            children: [
                              Icon(Icons.local_offer, size: 18, color: _sortBy == 'discount' ? Colors.blue : Colors.grey),
                              const SizedBox(width: 8),
                              Text('Discount', style: TextStyle(color: _sortBy == 'discount' ? Colors.blue : Colors.black)),
                            ],
                          ),
                        ),
                        PopupMenuItem(
                          value: 'newest',
                          child: Row(
                            children: [
                              Icon(Icons.new_releases, size: 18, color: _sortBy == 'newest' ? Colors.blue : Colors.grey),
                              const SizedBox(width: 8),
                              Text('Newest', style: TextStyle(color: _sortBy == 'newest' ? Colors.blue : Colors.black)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Deals Content
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => _loadDeals(reset: true),
                  child: ListView(
                    controller: _scrollController,
                    children: [
                      _buildDealsContent(),
                      if (_isLoadingMore)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      if (!_hasMoreDeals && _deals.isNotEmpty)
                        const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(
                            child: Text(
                              'No more deals',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatsBanner() {
    final activeDeals = _deals.where((d) => d.isActive).length;
    final avgDiscount = _deals.isEmpty ? 0 : _deals.map((d) => _extractDiscountValue(d.discount)).reduce((a, b) => a + b) / _deals.length;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange[50]!, Colors.red[50]!],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange[200]!),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(Icons.local_offer, '$activeDeals', 'Active', Colors.orange),
          Container(width: 1, height: 30, color: Colors.grey[300]),
          _buildStatItem(Icons.discount, '${avgDiscount.toInt()}%', 'Avg Save', Colors.red),
          Container(width: 1, height: 30, color: Colors.grey[300]),
          _buildStatItem(Icons.trending_up, '${_deals.length}', 'Total', Colors.blue),
        ],
      ),
    );
  }
  
  Widget _buildStatItem(IconData icon, String value, String label, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
      ],
    );
  }
  
  double _extractDiscountValue(String discount) {
    final match = RegExp(r'(\d+)').firstMatch(discount);
    return match != null ? double.parse(match.group(1)!) : 10;
  }

  Widget _buildDealsContent() {
    if (_isLoading) {
      return _buildSkeletonGrid();
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            const Text('Failed to load deals', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadDeals(reset: true),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final filteredDeals = _getFilteredDeals(_deals);
    final sortedDeals = _getSortedDeals(filteredDeals);
    
    if (sortedDeals.isNotEmpty) {
      print('🖼️ First deal images: ${sortedDeals.first.images}');
      print('🖼️ Images count: ${sortedDeals.first.images.length}');
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${_getDealsCategoryTitle()} (${sortedDeals.length})',
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
              itemCount: sortedDeals.length,
              itemBuilder: (context, index) => _buildDealCard(sortedDeals[index]),
            ),
          ],
        ),
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
  
  Widget _buildDealCard(Deal deal) {
    return Card(
      elevation: 3,
      shadowColor: Colors.black.withOpacity(0.2),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                    child: deal.images.isNotEmpty
                        ? _buildImage(deal.images.first, deal.businessType)
                        : _buildPlaceholderImage(deal.businessType),
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
                  if (deal.isPremium)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.amber,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'PREMIUM',
                          style: TextStyle(
                            color: Colors.black,
                            fontSize: 8,
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
                    'at ${deal.businessName}',
                    style: TextStyle(
                      color: Color(AppConstants.colors['textSecondary']!),
                      fontSize: 10,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (deal.distance != null)
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: Colors.blue, size: 10),
                        Text(
                          ' ${deal.distance!.toStringAsFixed(1)}km away',
                          style: const TextStyle(fontSize: 9, color: Colors.blue),
                        ),
                      ],
                    ),
                  Row(
                    children: [
                      const Icon(Icons.local_offer, color: Colors.green, size: 12),
                      Text(
                        ' \$${deal.price?.amount.toInt() ?? 25}',
                        style: const TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      const Icon(Icons.visibility, color: Colors.grey, size: 12),
                      Text(
                        ' ${deal.views}',
                        style: const TextStyle(fontSize: 10, color: Colors.grey),
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
  
  Widget _buildImage(String imageData, String businessType) {
    // Check if image is base64 encoded
    if (imageData.startsWith('data:image')) {
      try {
        final base64String = imageData.split(',')[1];
        final bytes = base64Decode(base64String);
        return Image.memory(
          bytes,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => 
              _buildPlaceholderImage(businessType),
        );
      } catch (e) {
        print('❌ Error decoding base64 image: $e');
        return _buildPlaceholderImage(businessType);
      }
    }
    
    // Regular URL image
    return Image.network(
      imageData.replaceAll('&amp;', '&'),
      fit: BoxFit.cover,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return const Center(
          child: CircularProgressIndicator(strokeWidth: 2),
        );
      },
      errorBuilder: (context, error, stackTrace) => 
          _buildPlaceholderImage(businessType),
    );
  }
  
  Widget _buildPlaceholderImage(String businessType) {
    final type = businessType.toLowerCase();
    IconData iconData;
    Color backgroundColor;
    
    if (type.contains('restaurant')) {
      iconData = Icons.restaurant;
      backgroundColor = Colors.orange[100]!;
    } else if (type.contains('hotel')) {
      iconData = Icons.hotel;
      backgroundColor = Colors.blue[100]!;
    } else if (type.contains('cafe')) {
      iconData = Icons.local_cafe;
      backgroundColor = Colors.brown[100]!;
    } else if (type.contains('shop')) {
      iconData = Icons.shopping_bag;
      backgroundColor = Colors.purple[100]!;
    } else if (type.contains('attraction') || type.contains('museum')) {
      iconData = Icons.museum;
      backgroundColor = Colors.green[100]!;
    } else {
      iconData = Icons.local_offer;
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
  
  List<Deal> _getFilteredDeals(List<Deal> deals) {
    var filtered = deals;
    
    // Apply category filter
    if (_selectedFilter != 'all') {
      filtered = deals.where((deal) {
        final businessType = deal.businessType.toLowerCase();
        switch (_selectedFilter) {
          case 'restaurant':
            return businessType.contains('restaurant');
          case 'hotel':
            return businessType.contains('hotel');
          case 'cafe':
            return businessType.contains('cafe');
          case 'shop':
            return businessType.contains('shop') || businessType.contains('store');
          case 'attraction':
            return businessType.contains('attraction') || businessType.contains('museum');
          default:
            return true;
        }
      }).toList();
    }
    
    // Apply search filter
    if (_searchController.text.isNotEmpty) {
      final query = _searchController.text.toLowerCase();
      filtered = filtered.where((deal) {
        return deal.title.toLowerCase().contains(query) ||
               deal.businessName.toLowerCase().contains(query) ||
               deal.description.toLowerCase().contains(query);
      }).toList();
    }
    
    return filtered;
  }
  
  List<Deal> _getSortedDeals(List<Deal> deals) {
    final sorted = List<Deal>.from(deals);
    
    switch (_sortBy) {
      case 'distance':
        sorted.sort((a, b) => (a.distance ?? 999).compareTo(b.distance ?? 999));
        break;
      case 'discount':
        sorted.sort((a, b) {
          final aDiscount = _extractDiscountValue(a.discount);
          final bDiscount = _extractDiscountValue(b.discount);
          return bDiscount.compareTo(aDiscount);
        });
        break;
      case 'newest':
        sorted.sort((a, b) => b.validUntil.compareTo(a.validUntil));
        break;
    }
    
    return sorted;
  }
  
  Widget _buildSkeletonGrid() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.8,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: 6,
        itemBuilder: (context, index) => Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(color: Colors.grey[300]),
              ),
              Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(height: 12, width: double.infinity, color: Colors.grey[300]),
                    const SizedBox(height: 4),
                    Container(height: 10, width: 100, color: Colors.grey[300]),
                    const SizedBox(height: 4),
                    Container(height: 10, width: 60, color: Colors.grey[300]),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  List<Deal> _getFilteredDealsOld(List<Deal> deals) {
    if (_selectedFilter == 'all') return deals;
    
    return deals.where((deal) {
      final businessType = deal.businessType.toLowerCase();
      switch (_selectedFilter) {
        case 'restaurant':
          return businessType.contains('restaurant');
        case 'hotel':
          return businessType.contains('hotel');
        case 'cafe':
          return businessType.contains('cafe');
        case 'shop':
          return businessType.contains('shop') || businessType.contains('store');
        case 'attraction':
          return businessType.contains('attraction') || businessType.contains('museum');
        default:
          return true;
      }
    }).toList();
  }
  
  void _showDealDetails(Deal deal) {
    AnalyticsService.logViewItem(deal.id, deal.title, deal.businessType);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DealDetailScreen(deal: deal),
      ),
    );
  }
}