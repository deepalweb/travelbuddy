import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/safe_widget.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() {
    try {
      final appProvider = context.read<AppProvider>();
      appProvider.getCurrentLocation();
      appProvider.loadHomeData();
      appProvider.loadNearbyPlaces();
    } catch (e) {
      print('Error loading home data: $e');
    }
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('For You'),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadData,
              ),
            ],
          ),
          body: SafeWidget(
            child: RefreshIndicator(
              onRefresh: () async => _loadData(),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildWelcomeCard(appProvider),
                    const SizedBox(height: 16),
                    _buildLocationCard(appProvider),
                    const SizedBox(height: 16),
                    _buildQuickActions(appProvider),
                    const SizedBox(height: 16),
                    _buildSafetySection(appProvider),
                    const SizedBox(height: 16),
                    _buildLocalDishes(appProvider),
                    const SizedBox(height: 16),
                    _buildNearbyPlaces(appProvider),
                    const SizedBox(height: 16),
                    _buildRecentActivity(appProvider),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildWelcomeCard(AppProvider appProvider) {
    try {
      return Card(
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.blue[400]!, Colors.blue[600]!],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${_getGreeting()}, ${appProvider.currentUser?.username ?? 'Traveler'}!',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Ready to explore today?',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Text('Welcome to Travel Buddy!'),
        ),
      );
    }
  }

  Widget _buildLocationCard(AppProvider appProvider) {
    if (appProvider.locationError != null) {
      return Card(
        color: Colors.orange[50],
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Icon(Icons.location_off, color: Colors.orange[700]),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Location access needed for better recommendations',
                      style: TextStyle(fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: () => appProvider.getCurrentLocation(),
                icon: const Icon(Icons.location_on, size: 16),
                label: const Text('Enable Location'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }

  Widget _buildQuickActions(AppProvider appProvider) {
    final actions = [
      {'label': 'Plan Trip', 'icon': Icons.map, 'color': Colors.green, 'tab': 3},
      {'label': 'Deals', 'icon': Icons.local_offer, 'color': Colors.orange, 'tab': 2},
      {'label': 'Community', 'icon': Icons.people, 'color': Colors.purple, 'tab': 4},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.0,
          children: actions.map((action) {
            return Card(
              child: InkWell(
                onTap: () => appProvider.setCurrentTabIndex(action['tab'] as int),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: action['color'] as Color,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          action['icon'] as IconData,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        action['label'] as String,
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                          fontSize: 12,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildNearbyPlaces(AppProvider appProvider) {
    try {
      final places = appProvider.places.take(6).toList();
      
      if (places.isEmpty) {
        if (appProvider.isPlacesLoading) {
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 12),
                  Text('Finding nearby places...', style: TextStyle(color: Colors.grey[600])),
                ],
              ),
            ),
          );
        }
        
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Icon(Icons.location_searching, size: 48, color: Colors.grey[400]),
                const SizedBox(height: 12),
                Text('No nearby places found', style: TextStyle(color: Colors.grey[600])),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => appProvider.loadNearbyPlaces(),
                  child: const Text('Search Places'),
                ),
              ],
            ),
          ),
        );
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Nearby Places',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.8,
            children: places.map((place) {
              return Card(
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => appProvider.setCurrentTabIndex(1),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 3,
                        child: Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.grey[300],
                            image: place.photoUrl.isNotEmpty
                                ? DecorationImage(
                                    image: NetworkImage(place.photoUrl),
                                    fit: BoxFit.cover,
                                    onError: (_, __) {},
                                  )
                                : null,
                          ),
                          child: place.photoUrl.isEmpty
                              ? Icon(Icons.place, size: 32, color: Colors.grey[600])
                              : null,
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Padding(
                          padding: const EdgeInsets.all(8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                place.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.star, size: 12, color: Colors.amber),
                                  const SizedBox(width: 2),
                                  Text(
                                    place.rating.toStringAsFixed(1),
                                    style: const TextStyle(fontSize: 10),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                place.type,
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.grey[600],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Center(
            child: ElevatedButton.icon(
              onPressed: () => appProvider.setCurrentTabIndex(1),
              icon: const Icon(Icons.explore),
              label: const Text('Explore More Places'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ),
        ],
      );
    } catch (e) {
      return const SizedBox.shrink();
    }
  }

  Widget _buildRecentActivity(AppProvider appProvider) {
    try {
      final hasTrips = appProvider.recentTrips.isNotEmpty;
      final hasFavorites = appProvider.favoriteIds.isNotEmpty;
      
      if (!hasTrips && !hasFavorites) {
        return const SizedBox.shrink();
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recent Activity',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          if (hasTrips)
            Card(
              child: ListTile(
                leading: const Icon(Icons.map, color: Colors.green),
                title: Text('${appProvider.recentTrips.length} Recent Trips'),
                subtitle: const Text('View your travel plans'),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () => appProvider.setCurrentTabIndex(3),
              ),
            ),
          if (hasFavorites)
            Card(
              child: ListTile(
                leading: const Icon(Icons.favorite, color: Colors.red),
                title: Text('${appProvider.favoriteIds.length} Favorite Places'),
                subtitle: const Text('Your saved locations'),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () => appProvider.setCurrentTabIndex(1),
              ),
            ),
        ],
      );
    } catch (e) {
      return const SizedBox.shrink();
    }
  }

  Widget _buildSafetySection(AppProvider appProvider) {
    try {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Safety & SOS',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          _buildEmergencyServices(appProvider),
          const SizedBox(height: 12),
          _buildSafetyActions(appProvider),
        ],
      );
    } catch (e) {
      return const SizedBox.shrink();
    }
  }

  Widget _buildEmergencyServices(AppProvider appProvider) {
    if (appProvider.isSafetyLoading) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [
              CircularProgressIndicator(strokeWidth: 2),
              SizedBox(width: 12),
              Text('Loading emergency services...'),
            ],
          ),
        ),
      );
    }

    final policeStations = appProvider.nearbyPoliceStations;
    final hospitals = appProvider.nearbyHospitals;

    if (policeStations.isEmpty && hospitals.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(Icons.location_off, color: Colors.grey[600], size: 32),
              const SizedBox(height: 8),
              Text(
                'Emergency services not available',
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => appProvider.loadEmergencyServices(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Emergency Services Nearby',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
            ),
            const SizedBox(height: 12),
            ...policeStations.map((station) => _buildEmergencyServiceTile(
              station.name,
              station.phoneNumber.isNotEmpty ? station.phoneNumber : '911',
              Icons.local_police,
              Colors.blue,
              appProvider,
            )),
            ...hospitals.map((hospital) => _buildEmergencyServiceTile(
              hospital.name,
              hospital.phoneNumber.isNotEmpty ? hospital.phoneNumber : '911',
              Icons.local_hospital,
              Colors.red,
              appProvider,
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildEmergencyServiceTile(
    String name,
    String phoneNumber,
    IconData icon,
    Color color,
    AppProvider appProvider,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                GestureDetector(
                  onTap: () => appProvider.makeEmergencyCall(phoneNumber),
                  child: Text(
                    phoneNumber,
                    style: TextStyle(
                      color: Colors.blue[700],
                      fontSize: 11,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => appProvider.makeEmergencyCall(phoneNumber),
            icon: const Icon(Icons.phone, size: 18),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyActions(AppProvider appProvider) {
    final actions = [
      {
        'label': 'SOS Alert',
        'icon': Icons.emergency,
        'color': Colors.red,
        'onTap': () => appProvider.sendSOSAlert(),
      },
      {
        'label': 'Share Location',
        'icon': Icons.share_location,
        'color': Colors.orange,
        'onTap': () => appProvider.shareCurrentLocation(),
      },
      {
        'label': 'Emergency Contacts',
        'icon': Icons.contact_phone,
        'color': Colors.green,
        'onTap': () => _showEmergencyContactsDialog(appProvider),
      },
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.2,
      children: actions.map((action) {
        return Card(
          child: InkWell(
            onTap: action['onTap'] as VoidCallback,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: action['color'] as Color,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      action['icon'] as IconData,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    action['label'] as String,
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 10,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  void _showEmergencyContactsDialog(AppProvider appProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Emergency Contacts'),
        content: const Text('Emergency contacts feature coming soon!'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Widget _buildLocalDishes(AppProvider appProvider) {
    try {
      if (appProvider.isDishesLoading) {
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Local Dishes',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                const Row(
                  children: [
                    CircularProgressIndicator(strokeWidth: 2),
                    SizedBox(width: 12),
                    Text('Discovering local flavors...'),
                  ],
                ),
              ],
            ),
          ),
        );
      }

      final dishes = appProvider.localDishes;
      if (dishes.isEmpty) {
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Icon(Icons.restaurant, color: Colors.grey[600], size: 32),
                const SizedBox(height: 8),
                Text(
                  'No local dishes found',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => appProvider.loadLocalDishes(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        );
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Local Dishes 🍴',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: dishes.length,
              itemBuilder: (context, index) {
                final dish = dishes[index];
                return Container(
                  width: 160,
                  margin: const EdgeInsets.only(right: 12),
                  child: Card(
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () => _showDishDetails(dish),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 2,
                            child: Container(
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: Colors.orange[100],
                                image: dish.imageUrl.isNotEmpty
                                    ? DecorationImage(
                                        image: NetworkImage(dish.imageUrl),
                                        fit: BoxFit.cover,
                                        onError: (_, __) {},
                                      )
                                    : null,
                              ),
                              child: dish.imageUrl.isEmpty
                                  ? Icon(Icons.restaurant, size: 32, color: Colors.orange[700])
                                  : null,
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: Padding(
                              padding: const EdgeInsets.all(8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    dish.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    dish.averagePrice,
                                    style: TextStyle(
                                      color: Colors.green[700],
                                      fontWeight: FontWeight.w600,
                                      fontSize: 11,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    dish.restaurantName,
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: Colors.grey[600],
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: _getPriceRangeColor(dish.priceRange),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      dish.priceRange.toUpperCase(),
                                      style: const TextStyle(
                                        fontSize: 8,
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      );
    } catch (e) {
      return const SizedBox.shrink();
    }
  }

  Color _getPriceRangeColor(String priceRange) {
    switch (priceRange.toLowerCase()) {
      case 'budget':
        return Colors.green;
      case 'mid-range':
        return Colors.orange;
      case 'fine-dining':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  void _showDishDetails(dynamic dish) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(dish.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Price: ${dish.averagePrice}'),
            const SizedBox(height: 8),
            Text('Restaurant: ${dish.restaurantName}'),
            const SizedBox(height: 8),
            Text('Description: ${dish.description}'),
            if (dish.culturalNote.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('Cultural Note: ${dish.culturalNote}'),
            ]
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}