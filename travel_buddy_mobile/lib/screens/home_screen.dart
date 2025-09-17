import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/app_provider.dart';
import '../widgets/safe_widget.dart';
import '../models/emergency_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _selectedDietaryFilter = 'All';
  
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
  
  String _getCurrentLocationName(AppProvider appProvider) {
    if (appProvider.currentLocation == null) {
      return 'Location not available';
    }
    
    // For Sri Lankan coordinates, show Colombo
    final lat = appProvider.currentLocation!.latitude;
    final lng = appProvider.currentLocation!.longitude;
    
    if (lat > 6.0 && lat < 7.5 && lng > 79.0 && lng < 81.0) {
      return 'Colombo, Sri Lanka';
    }
    
    // Default location display
    return 'Current Location';
  }
  
  Widget _buildWeatherInfo(AppProvider appProvider) {
    final weather = appProvider.weatherInfo;
    if (weather == null) {
      return Row(
        children: [
          Icon(Icons.wb_sunny, color: Colors.white.withOpacity(0.9), size: 16),
          const SizedBox(width: 2),
          Text(
            '28°C',
            style: TextStyle(
              color: Colors.white.withOpacity(0.9),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      );
    }
    
    return Row(
      children: [
        Icon(
          _getWeatherIcon(weather.condition),
          color: Colors.white.withOpacity(0.9),
          size: 16,
        ),
        const SizedBox(width: 2),
        Text(
          '${weather.temperature.round()}°C',
          style: TextStyle(
            color: Colors.white.withOpacity(0.9),
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
  
  IconData _getWeatherIcon(String condition) {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return Icons.wb_sunny;
      case 'cloudy':
      case 'overcast':
        return Icons.cloud;
      case 'rainy':
      case 'rain':
        return Icons.grain;
      default:
        return Icons.wb_sunny;
    }
  }
  
  String _getFavoriteActivity(AppProvider appProvider) {
    final dishes = appProvider.localDishes;
    final places = appProvider.places;
    
    if (dishes.isNotEmpty) {
      return 'Try ${dishes.first.name} nearby';
    }
    
    if (places.isNotEmpty) {
      return 'Visit ${places.first.name}';
    }
    
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Perfect morning for exploring!';
    } else if (hour < 18) {
      return 'Great afternoon for sightseeing!';
    } else {
      return 'Evening dining recommendations available!';
    }
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
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () => _showNotifications(appProvider),
              ),
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
                    _buildNearbyPlaces(appProvider),
                    const SizedBox(height: 16),
                    _buildLocalDishes(appProvider),
                    const SizedBox(height: 16),
                    _buildRecentActivity(appProvider),
                    const SizedBox(height: 16),
                    _buildSafetySection(appProvider),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
  
  void _showNotifications(AppProvider appProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.notifications, size: 20),
            SizedBox(width: 8),
            Text('Notifications'),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  children: [
                    _buildNotificationTile(
                      'Welcome to Travel Buddy!',
                      'Start exploring amazing places around you',
                      Icons.explore,
                      Colors.blue,
                      '2 min ago',
                    ),
                    _buildNotificationTile(
                      'New Local Dishes Found',
                      'Discover ${appProvider.localDishes.length} local dishes in your area',
                      Icons.restaurant,
                      Colors.orange,
                      '5 min ago',
                    ),
                    _buildNotificationTile(
                      'Safety Services Updated',
                      'Emergency services information refreshed',
                      Icons.security,
                      Colors.red,
                      '10 min ago',
                    ),
                    if (appProvider.places.isNotEmpty)
                      _buildNotificationTile(
                        'Places Near You',
                        'Found ${appProvider.places.length} interesting places nearby',
                        Icons.place,
                        Colors.green,
                        '15 min ago',
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('All notifications cleared'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildNotificationTile(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    String time,
  ) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 11),
      ),
      trailing: Text(
        time,
        style: TextStyle(
          fontSize: 10,
          color: Colors.grey[600],
        ),
      ),
      dense: true,
    );
  }
  
  Widget _buildCompactEmergencyTile(
    EmergencyService service,
    IconData icon,
    Color color,
    AppProvider appProvider,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, color: color, size: 14),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service.name,
                  style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${service.distance} • ${service.phoneNumber}',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 9,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => appProvider.makeEmergencyCall(service.phoneNumber),
            icon: const Icon(Icons.phone, size: 16),
            style: IconButton.styleFrom(
              backgroundColor: Colors.green.withOpacity(0.1),
              foregroundColor: Colors.green,
              minimumSize: const Size(28, 28),
            ),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
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
              const SizedBox(height: 12),
              // Location and Weather Row
              Row(
                children: [
                  Icon(Icons.location_on, color: Colors.white.withOpacity(0.9), size: 16),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      _getCurrentLocationName(appProvider),
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 12),
                  _buildWeatherInfo(appProvider),
                ],
              ),
              const SizedBox(height: 8),
              // Favorite Activity
              Row(
                children: [
                  Icon(Icons.favorite, color: Colors.white.withOpacity(0.9), size: 16),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      _getFavoriteActivity(appProvider),
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
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
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(width: 8),
              Text('Loading emergency services...', style: TextStyle(fontSize: 12)),
            ],
          ),
        ),
      );
    }

    final policeStations = appProvider.nearbyPoliceStations.take(2).toList();
    final hospitals = appProvider.nearbyHospitals.take(2).toList();

    if (policeStations.isEmpty && hospitals.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(Icons.location_off, color: Colors.grey[600], size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Emergency services not available',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ),
              TextButton(
                onPressed: () => appProvider.loadEmergencyServices(),
                child: const Text('Retry', style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Emergency Services',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                const Spacer(),
                Text(
                  '${policeStations.length + hospitals.length} nearby',
                  style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...policeStations.map((station) => _buildCompactEmergencyTile(
              station,
              Icons.local_police,
              Colors.blue,
              appProvider,
            )),
            ...hospitals.map((hospital) => _buildCompactEmergencyTile(
              hospital,
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
    EmergencyService service,
    IconData icon,
    Color color,
    AppProvider appProvider,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.name,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    service.address,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 11,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 12, color: Colors.grey[500]),
                      const SizedBox(width: 2),
                      Text(
                        '${service.distance.toStringAsFixed(1)} km away',
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 10,
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (service.rating > 0) ...[
                        Icon(Icons.star, size: 12, color: Colors.amber),
                        const SizedBox(width: 2),
                        Text(
                          service.rating.toStringAsFixed(1),
                          style: const TextStyle(fontSize: 10),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Column(
              children: [
                IconButton(
                  onPressed: () => appProvider.makeEmergencyCall(service.phoneNumber),
                  icon: const Icon(Icons.phone, size: 20),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.green.withOpacity(0.1),
                    foregroundColor: Colors.green,
                  ),
                ),
                Text(
                  'Call',
                  style: TextStyle(
                    fontSize: 9,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
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
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (appProvider.emergencyContacts.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No emergency contacts added yet.'),
                )
              else
                ...appProvider.emergencyContacts.map((contact) => ListTile(
                  leading: const Icon(Icons.person, size: 20),
                  title: Text(contact.name, style: const TextStyle(fontSize: 14)),
                  subtitle: Text('${contact.phoneNumber} • ${contact.relationship}', 
                    style: const TextStyle(fontSize: 12)),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete, size: 18),
                    onPressed: () {
                      appProvider.removeEmergencyContact(contact.id);
                      Navigator.pop(context);
                      _showEmergencyContactsDialog(appProvider);
                    },
                  ),
                )),
              const SizedBox(height: 8),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _showAddContactDialog(appProvider);
                },
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Add Contact'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
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
  
  void _showAddContactDialog(AppProvider appProvider) {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    String selectedRelationship = 'Family';
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add Emergency Contact'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Name',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: selectedRelationship,
                decoration: const InputDecoration(
                  labelText: 'Relationship',
                  border: OutlineInputBorder(),
                ),
                items: ['Family', 'Friend', 'Colleague', 'Other']
                    .map((rel) => DropdownMenuItem(
                          value: rel,
                          child: Text(rel),
                        ))
                    .toList(),
                onChanged: (value) {
                  setState(() {
                    selectedRelationship = value!;
                  });
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (nameController.text.isNotEmpty && phoneController.text.isNotEmpty) {
                  appProvider.addEmergencyContact(
                    nameController.text,
                    phoneController.text,
                    selectedRelationship,
                  );
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Emergency contact added successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _openDirections(dynamic dish) async {
    try {
      final restaurantName = Uri.encodeComponent(dish.restaurantName);
      final restaurantAddress = Uri.encodeComponent(dish.restaurantAddress);
      
      // Create Google Maps URL for directions
      final url = 'https://www.google.com/maps/dir/?api=1&destination=$restaurantName,$restaurantAddress';
      
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(
          Uri.parse(url),
          mode: LaunchMode.externalApplication,
        );
      } else {
        // Fallback: show error message
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not open directions. Please check if Google Maps is installed.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      print('Error opening directions: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error opening directions'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
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
                  'Local Dishes 🍴',
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Local Dishes 🍴',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Text(
                '${dishes.length} dishes',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _buildDietaryFilters(),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _getFilteredDishes(dishes).length,
              itemBuilder: (context, index) {
                final dish = _getFilteredDishes(dishes)[index];
                return Container(
                  width: 180,
                  margin: const EdgeInsets.only(right: 12),
                  child: Card(
                    elevation: 3,
                    clipBehavior: Clip.antiAlias,
                    child: InkWell(
                      onTap: () => _showDishDetails(dish),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header with cuisine badge
                          Container(
                            width: double.infinity,
                            height: 80,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Colors.orange[300]!, Colors.orange[500]!],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                            child: Stack(
                              children: [
                                Center(
                                  child: Icon(
                                    Icons.restaurant_menu,
                                    size: 40,
                                    color: Colors.white.withOpacity(0.8),
                                  ),
                                ),
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      dish.cuisine,
                                      style: const TextStyle(
                                        fontSize: 8,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.orange,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Content
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Dish name
                                  Text(
                                    dish.name,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  // Rating
                                  Row(
                                    children: [
                                      ...List.generate(5, (i) => Icon(
                                        i < dish.rating.floor() ? Icons.star : Icons.star_border,
                                        size: 12,
                                        color: Colors.amber,
                                      )),
                                      const SizedBox(width: 4),
                                      Text(
                                        dish.rating.toStringAsFixed(1),
                                        style: const TextStyle(fontSize: 10),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  // Price
                                  Row(
                                    children: [
                                      Icon(Icons.attach_money, size: 12, color: Colors.green[700]),
                                      Text(
                                        dish.averagePrice,
                                        style: TextStyle(
                                          color: Colors.green[700],
                                          fontWeight: FontWeight.w600,
                                          fontSize: 11,
                                        ),
                                      ),
                                      const Spacer(),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: _getPriceRangeColor(dish.priceRange),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          dish.priceRange.toUpperCase(),
                                          style: const TextStyle(
                                            fontSize: 7,
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  // Restaurant
                                  Row(
                                    children: [
                                      Icon(Icons.store, size: 10, color: Colors.grey[600]),
                                      const SizedBox(width: 2),
                                      Expanded(
                                        child: Text(
                                          dish.restaurantName,
                                          style: TextStyle(
                                            fontSize: 9,
                                            color: Colors.grey[600],
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  // Dietary tags
                                  if (dish.dietaryTags.isNotEmpty)
                                    Wrap(
                                      spacing: 2,
                                      children: dish.dietaryTags.take(2).map<Widget>((tag) => Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                        decoration: BoxDecoration(
                                          color: _getDietaryTagColor(tag),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          _getDietaryTagIcon(tag),
                                          style: const TextStyle(
                                            fontSize: 8,
                                            color: Colors.white,
                                          ),
                                        ),
                                      )).toList(),
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

  Widget _buildDietaryFilters() {
    final filters = ['All', 'Vegetarian', 'Vegan', 'Gluten-Free'];
    
    return SizedBox(
      height: 32,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = _selectedDietaryFilter == filter;
          
          return Container(
            margin: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(
                filter,
                style: TextStyle(
                  fontSize: 11,
                  color: isSelected ? Colors.white : Colors.grey[700],
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  _selectedDietaryFilter = filter;
                });
              },
              selectedColor: Colors.orange,
              backgroundColor: Colors.grey[200],
              padding: const EdgeInsets.symmetric(horizontal: 8),
            ),
          );
        },
      ),
    );
  }
  
  List<dynamic> _getFilteredDishes(List<dynamic> dishes) {
    if (_selectedDietaryFilter == 'All') return dishes;
    
    return dishes.where((dish) {
      final tags = List<String>.from(dish.dietaryTags ?? []);
      switch (_selectedDietaryFilter) {
        case 'Vegetarian':
          return tags.any((tag) => tag.toLowerCase().contains('vegetarian'));
        case 'Vegan':
          return tags.any((tag) => tag.toLowerCase().contains('vegan'));
        case 'Gluten-Free':
          return tags.any((tag) => tag.toLowerCase().contains('gluten'));
        default:
          return true;
      }
    }).toList();
  }
  
  Color _getDietaryTagColor(String tag) {
    if (tag.toLowerCase().contains('vegetarian')) return Colors.green;
    if (tag.toLowerCase().contains('vegan')) return Colors.lightGreen;
    if (tag.toLowerCase().contains('gluten')) return Colors.blue;
    if (tag.toLowerCase().contains('halal')) return Colors.purple;
    return Colors.grey;
  }
  
  String _getDietaryTagIcon(String tag) {
    if (tag.toLowerCase().contains('vegetarian')) return 'VEG';
    if (tag.toLowerCase().contains('vegan')) return 'VGN';
    if (tag.toLowerCase().contains('gluten')) return 'GF';
    if (tag.toLowerCase().contains('halal')) return 'HL';
    return 'TAG';
  }

  void _showDishDetails(dynamic dish) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Expanded(
              child: Text(
                dish.name,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getPriceRangeColor(dish.priceRange),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                dish.priceRange.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Rating and Price
              Row(
                children: [
                  ...List.generate(5, (i) => Icon(
                    i < dish.rating.floor() ? Icons.star : Icons.star_border,
                    size: 16,
                    color: Colors.amber,
                  )),
                  const SizedBox(width: 8),
                  Text(
                    dish.rating.toStringAsFixed(1),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  Text(
                    dish.averagePrice,
                    style: TextStyle(
                      color: Colors.green[700],
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Restaurant and Cuisine
              Row(
                children: [
                  Icon(Icons.store, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          dish.restaurantName,
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                        Text(
                          dish.restaurantAddress,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      dish.cuisine,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Description
              Text(
                'Description:',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                ),
              ),
              const SizedBox(height: 4),
              Text(dish.description),
              const SizedBox(height: 12),
              // Cultural Note
              if (dish.culturalNote.isNotEmpty) ...[
                Text(
                  'Cultural Note:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.withOpacity(0.3)),
                  ),
                  child: Text(
                    dish.culturalNote,
                    style: TextStyle(color: Colors.blue[800], fontStyle: FontStyle.italic),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              // Dietary Tags
              if (dish.dietaryTags.isNotEmpty) ...[
                Text(
                  'Dietary Information:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: dish.dietaryTags.map<Widget>((tag) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getDietaryTagColor(tag),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      tag,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  )).toList(),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () => _openDirections(dish),
            icon: const Icon(Icons.directions, size: 18),
            label: const Text('Get Directions'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}