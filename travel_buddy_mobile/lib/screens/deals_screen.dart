import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../widgets/deal_card.dart';

class DealsScreen extends StatefulWidget {
  const DealsScreen({super.key});

  @override
  State<DealsScreen> createState() => _DealsScreenState();
}

class _DealsScreenState extends State<DealsScreen> {
  String _selectedFilter = 'all';
  final List<String> _filters = ['all', 'hotels', 'restaurants', 'cafes', 'shops'];

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
              // Filter Chips
              Container(
                height: 60,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _filters.length,
                  itemBuilder: (context, index) {
                    final filter = _filters[index];
                    final isSelected = _selectedFilter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(filter.toUpperCase()),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() => _selectedFilter = filter);
                        },
                        selectedColor: Color(AppConstants.colors['primary']!).withOpacity(0.2),
                        checkmarkColor: Color(AppConstants.colors['primary']!),
                      ),
                    );
                  },
                ),
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
      return GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.8,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: deals.length,
        itemBuilder: (context, index) {
          return DealCard(
            deal: deals[index],
            onTap: () {},
          );
        },
      );
    }

    if (places.isNotEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Nearby Hotels, Restaurants, Cafes & Shops',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
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
      'hotels': ['lodging', 'hotel'],
      'restaurants': ['restaurant', 'food'],
      'cafes': ['cafe', 'coffee'],
      'shops': ['shopping', 'store', 'shop'],
    };
    
    final keywords = filterMap[_selectedFilter] ?? [];
    return places.where((place) {
      final type = place.type?.toLowerCase() ?? '';
      return keywords.any((keyword) => type.contains(keyword));
    }).toList();
  }
}