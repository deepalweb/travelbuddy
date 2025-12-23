import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'dart:math' as math;
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../models/place.dart';
import '../screens/deal_detail_screen.dart';
import '../services/deals_service.dart';

class DealsScreen extends StatefulWidget {
  const DealsScreen({super.key});

  @override
  State<DealsScreen> createState() => _DealsScreenState();
}

class _DealsScreenState extends State<DealsScreen> {
  String _selectedFilter = 'all';
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
      _loadDeals();
    });
  }
  
  @override
  void dispose() {
    _scrollController.dispose();
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
                        // Don't reload - just filter locally
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

  Widget _buildDealsContent() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
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
    
    if (filteredDeals.isNotEmpty) {
      print('🖼️ First deal images: ${filteredDeals.first.images}');
      print('🖼️ Images count: ${filteredDeals.first.images.length}');
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${_getDealsCategoryTitle()} (${filteredDeals.length})',
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
              itemCount: filteredDeals.length,
              itemBuilder: (context, index) => _buildDealCard(filteredDeals[index]),
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
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => DealDetailScreen(deal: deal),
      ),
    );
  }
}