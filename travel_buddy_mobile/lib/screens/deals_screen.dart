import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../widgets/deal_card.dart';
import '../models/place.dart';
import 'category_deals_screen.dart';

class DealsScreen extends StatefulWidget {
  const DealsScreen({super.key});

  @override
  State<DealsScreen> createState() => _DealsScreenState();
}

class _DealsScreenState extends State<DealsScreen> {
  String _selectedCategory = 'all';
  String _selectedFilter = 'all';
  
  final Map<String, List<Map<String, String>>> _filterCategories = {
    'all': [{'key': 'all', 'label': '🌟 All Deals', 'icon': '🌟'}],
    'stay': [
      {'key': 'hotels', 'label': 'Hotels', 'icon': '🏨'},
      {'key': 'resorts', 'label': 'Resorts & Villas', 'icon': '🏖️'},
      {'key': 'hostels', 'label': 'Hostels & Budget', 'icon': '🛏️'},
      {'key': 'flights', 'label': 'Flights', 'icon': '✈️'},
      {'key': 'cars', 'label': 'Car Rentals', 'icon': '🚗'},
      {'key': 'transport', 'label': 'Transport Passes', 'icon': '🚌'},
    ],
    'food': [
      {'key': 'restaurants', 'label': 'Restaurants', 'icon': '🍽️'},
      {'key': 'bars', 'label': 'Bars & Pubs', 'icon': '🍺'},
      {'key': 'street_food', 'label': 'Street Food', 'icon': '🌮'},
      {'key': 'desserts', 'label': 'Desserts & Bakeries', 'icon': '🧁'},
      {'key': 'fast_food', 'label': 'Fast Food', 'icon': '🍔'},
      {'key': 'fine_dining', 'label': 'Fine Dining', 'icon': '🥂'},
    ],
    'shopping': [
      {'key': 'malls', 'label': 'Malls & Boutiques', 'icon': '🛍️'},
      {'key': 'souvenirs', 'label': 'Souvenir Shops', 'icon': '🎁'},
      {'key': 'electronics', 'label': 'Electronics', 'icon': '📱'},
      {'key': 'fashion', 'label': 'Fashion', 'icon': '👗'},
      {'key': 'beauty', 'label': 'Wellness & Beauty', 'icon': '💄'},
    ],
    'experiences': [
      {'key': 'tours', 'label': 'Tours & Activities', 'icon': '🗺️'},
      {'key': 'theme_parks', 'label': 'Theme Parks', 'icon': '🎢'},
      {'key': 'museums', 'label': 'Museums & Galleries', 'icon': '🏛️'},
      {'key': 'events', 'label': 'Events & Festivals', 'icon': '🎪'},
      {'key': 'concerts', 'label': 'Concerts & Shows', 'icon': '🎭'},
      {'key': 'adventure', 'label': 'Adventure Sports', 'icon': '🏔️'},
    ],
    'wellness': [
      {'key': 'spas', 'label': 'Spas & Wellness', 'icon': '💆'},
      {'key': 'gyms', 'label': 'Gyms & Yoga', 'icon': '🧘'},
      {'key': 'medical', 'label': 'Medical & Pharmacy', 'icon': '💊'},
      {'key': 'convenience', 'label': 'Convenience Stores', 'icon': '🏪'},
    ],
  };
  
  final List<Map<String, String>> _mainCategories = [
    {'key': 'all', 'label': 'All', 'icon': '🌟'},
    {'key': 'stay', 'label': 'Stay & Travel', 'icon': '🏨'},
    {'key': 'food', 'label': 'Food & Drink', 'icon': '🍴'},
    {'key': 'shopping', 'label': 'Shopping', 'icon': '🛍️'},
    {'key': 'experiences', 'label': 'Experiences', 'icon': '🎉'},
    {'key': 'wellness', 'label': 'Wellness', 'icon': '💆'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadDeals();
    });
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
                onPressed: () => appProvider.loadDeals(),
              ),
            ],
          ),
          body: Column(
            children: [
              // Category Filters
              Column(
                children: [
                  // Main Categories
                  Container(
                    height: 50,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _mainCategories.length,
                      itemBuilder: (context, index) {
                        final category = _mainCategories[index];
                        final isSelected = _selectedCategory == category['key'];
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            avatar: Text(category['icon']!, style: const TextStyle(fontSize: 14)),
                            label: Text(category['label']!, style: const TextStyle(fontSize: 12)),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() {
                                _selectedCategory = category['key']!;
                                _selectedFilter = 'all';
                              });
                            },
                            selectedColor: Color(AppConstants.colors['primary']!).withOpacity(0.2),
                            checkmarkColor: Color(AppConstants.colors['primary']!),
                          ),
                        );
                      },
                    ),
                  ),
                  
                  // Sub-category Filters
                  if (_selectedCategory != 'all')
                    Container(
                      height: 45,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _filterCategories[_selectedCategory]!.length,
                        itemBuilder: (context, index) {
                          final filter = _filterCategories[_selectedCategory]![index];
                          final isSelected = _selectedFilter == filter['key'];
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ActionChip(
                              avatar: Text(filter['icon']!, style: const TextStyle(fontSize: 12)),
                              label: Text(filter['label']!, style: const TextStyle(fontSize: 11)),
                              backgroundColor: isSelected 
                                  ? Color(AppConstants.colors['primary']!).withOpacity(0.1)
                                  : Colors.grey[100],
                              side: BorderSide(
                                color: isSelected 
                                    ? Color(AppConstants.colors['primary']!)
                                    : Colors.grey[300]!,
                              ),
                              onPressed: () {
                                setState(() => _selectedFilter = filter['key']!);
                              },
                            ),
                          );
                        },
                      ),
                    ),
                ],
              ),
              
              // Deals Content
              Expanded(
                child: _buildDealsContent(appProvider),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDealsContent(AppProvider appProvider) {
    if (appProvider.isDealsLoading) {
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

    if (appProvider.dealsError != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            const Text('Failed to load deals', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(appProvider.dealsError!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => appProvider.loadDeals(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final deals = appProvider.deals;
    final places = _getFilteredPlaces(appProvider.places);

    if (deals.isNotEmpty) {
      final groupedDeals = _groupDealsByCategory(deals);
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: groupedDeals.length,
        itemBuilder: (context, index) {
          final category = groupedDeals.keys.elementAt(index);
          final categoryDeals = groupedDeals[category]!;
          return _buildDealSection(category, categoryDeals);
        },
      );
    }

    if (places.isNotEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              _getCategoryTitle(),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.9,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: places.length,
              itemBuilder: (context, index) {
                final place = places[index];
                return Card(
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () {},
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Container(
                            width: double.infinity,
                            color: Colors.grey[300],
                            child: place.photoUrl.isNotEmpty
                                ? Image.network(
                                    place.photoUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => 
                                        const Icon(Icons.image, size: 40, color: Colors.grey),
                                  )
                                : const Icon(Icons.image, size: 40, color: Colors.grey),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                place.name,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                place.type,
                                style: TextStyle(
                                  color: Color(AppConstants.colors['textSecondary']!),
                                  fontSize: 10,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Row(
                                children: [
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
              },
            ),
          ),
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
            'No deals available',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Check back later for amazing deals!',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  List<dynamic> _getFilteredPlaces(List<dynamic> places) {
    if (_selectedFilter == 'all') return places;
    
    final filterMap = {
      // Stay & Travel
      'hotels': ['hotel', 'lodging', 'accommodation'],
      'resorts': ['resort', 'villa', 'vacation_rental'],
      'hostels': ['hostel', 'budget', 'backpacker'],
      'flights': ['airline', 'flight', 'airport'],
      'cars': ['car_rental', 'vehicle', 'transport'],
      'transport': ['bus', 'train', 'metro', 'transit'],
      
      // Food & Drink
      'restaurants': ['restaurant', 'dining'],
      'bars': ['bar', 'pub', 'brewery', 'nightlife'],
      'street_food': ['street_food', 'food_truck', 'market'],
      'desserts': ['bakery', 'dessert', 'ice_cream', 'pastry'],
      'fast_food': ['fast_food', 'quick_service'],
      'fine_dining': ['fine_dining', 'upscale', 'gourmet'],
      
      // Shopping & Lifestyle
      'malls': ['shopping_mall', 'mall', 'boutique'],
      'souvenirs': ['souvenir', 'gift_shop', 'craft'],
      'electronics': ['electronics', 'tech', 'gadget'],
      'fashion': ['clothing', 'fashion', 'apparel'],
      'beauty': ['beauty', 'cosmetics', 'wellness'],
      
      // Experiences & Entertainment
      'tours': ['tour', 'activity', 'excursion'],
      'theme_parks': ['amusement_park', 'theme_park', 'rides'],
      'museums': ['museum', 'gallery', 'exhibition'],
      'events': ['event', 'festival', 'celebration'],
      'concerts': ['concert', 'show', 'performance'],
      'adventure': ['adventure', 'sports', 'outdoor'],
      
      // Relaxation & Essentials
      'spas': ['spa', 'massage', 'wellness'],
      'gyms': ['gym', 'fitness', 'yoga'],
      'medical': ['pharmacy', 'medical', 'health'],
      'convenience': ['convenience', 'grocery', 'store'],
    };
    
    final keywords = filterMap[_selectedFilter] ?? [];
    return places.where((place) {
      final type = place.type?.toLowerCase() ?? '';
      final name = place.name?.toLowerCase() ?? '';
      return keywords.any((keyword) => 
          type.contains(keyword) || name.contains(keyword));
    }).toList();
  }
  
  String _getCategoryTitle() {
    if (_selectedCategory == 'all') {
      return 'Nearby Places & Services';
    }
    
    final categoryTitles = {
      'stay': 'Nearby Hotels, Resorts & Transport',
      'food': 'Nearby Restaurants, Bars & Cafes',
      'shopping': 'Nearby Malls, Shops & Boutiques',
      'experiences': 'Nearby Tours, Museums & Activities',
      'wellness': 'Nearby Spas, Gyms & Services',
    };
    
    return categoryTitles[_selectedCategory] ?? 'Nearby Places';
  }
  
  Map<String, List<Deal>> _groupDealsByCategory(List<Deal> deals) {
    final grouped = <String, List<Deal>>{};
    
    for (final deal in deals) {
      final category = _getDealCategory(deal);
      if (!grouped.containsKey(category)) {
        grouped[category] = [];
      }
      grouped[category]!.add(deal);
    }
    
    // Sort categories by deal count (most deals first)
    final sortedEntries = grouped.entries.toList()
      ..sort((a, b) => b.value.length.compareTo(a.value.length));
    
    return Map.fromEntries(sortedEntries);
  }
  
  String _getDealCategory(Deal deal) {
    final title = deal.title.toLowerCase();
    final description = deal.description.toLowerCase();
    final category = deal.category?.toLowerCase() ?? '';
    
    // Stay & Travel
    if (category.contains('hotel') || title.contains('hotel') || title.contains('stay')) {
      return 'Stay & Travel';
    }
    if (category.contains('flight') || title.contains('flight') || title.contains('airline')) {
      return 'Stay & Travel';
    }
    
    // Food & Drink
    if (category.contains('restaurant') || title.contains('restaurant') || title.contains('dining')) {
      return 'Food & Drink';
    }
    if (category.contains('bar') || title.contains('bar') || title.contains('cafe')) {
      return 'Food & Drink';
    }
    
    // Shopping
    if (category.contains('shopping') || title.contains('shop') || title.contains('mall')) {
      return 'Shopping';
    }
    if (category.contains('fashion') || title.contains('clothing') || title.contains('electronics')) {
      return 'Shopping';
    }
    
    // Experiences
    if (category.contains('tour') || title.contains('tour') || title.contains('activity')) {
      return 'Experiences';
    }
    if (category.contains('museum') || title.contains('show') || title.contains('event')) {
      return 'Experiences';
    }
    
    // Wellness
    if (category.contains('spa') || title.contains('spa') || title.contains('wellness')) {
      return 'Wellness';
    }
    if (category.contains('gym') || title.contains('fitness') || title.contains('yoga')) {
      return 'Wellness';
    }
    
    return 'Other Deals';
  }
  
  String _getCategoryEmoji(String category) {
    switch (category) {
      case 'Stay & Travel': return '🏨';
      case 'Food & Drink': return '🍴';
      case 'Shopping': return '🛍️';
      case 'Experiences': return '🎉';
      case 'Wellness': return '💆';
      default: return '🎯';
    }
  }
  
  Widget _buildDealSection(String category, List<Deal> deals) {
    final displayDeals = deals.take(5).toList(); // Show max 5 deals per section
    
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Row(
            children: [
              Text(_getCategoryEmoji(category), style: const TextStyle(fontSize: 24)),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${deals.length} deals available',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              if (deals.length > 5)
                TextButton(
                  onPressed: () => _showMoreDeals(category, deals),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Show More'),
                      SizedBox(width: 4),
                      Icon(Icons.arrow_forward_ios, size: 12),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Horizontal Deals List
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: displayDeals.length,
              itemBuilder: (context, index) {
                final deal = displayDeals[index];
                return Container(
                  width: 160,
                  margin: const EdgeInsets.only(right: 12),
                  child: DealCard(
                    deal: deal,
                    onTap: () => _showDealDetails(deal),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
  
  void _showMoreDeals(String category, List<Deal> deals) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CategoryDealsScreen(
          category: category,
          deals: deals,
        ),
      ),
    );
  }
  
  void _showDealDetails(Deal deal) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              
              // Deal details
              Text(
                deal.title,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'at ${deal.placeName}',
                style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              ),
              const SizedBox(height: 16),
              
              // Price
              Row(
                children: [
                  Text(
                    '\$${deal.originalPrice.toInt()}',
                    style: const TextStyle(
                      decoration: TextDecoration.lineThrough,
                      fontSize: 18,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '\$${deal.discountedPrice.toInt()}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${((deal.originalPrice - deal.discountedPrice) / deal.originalPrice * 100).round()}% OFF',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Description
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Text(
                    deal.description,
                    style: const TextStyle(fontSize: 16, height: 1.5),
                  ),
                ),
              ),
              
              // Action buttons
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _purchaseDeal(deal);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(AppConstants.colors['primary']!),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Get Deal'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _purchaseDeal(Deal deal) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Purchase ${deal.title}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Original Price: \$${deal.originalPrice.toInt()}'),
            Text('Deal Price: \$${deal.discountedPrice.toInt()}'),
            const SizedBox(height: 16),
            const Text('This feature requires a subscription plan.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Purchase feature coming soon!'),
                  backgroundColor: Colors.blue,
                ),
              );
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}