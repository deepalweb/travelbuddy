import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:typed_data';
import 'dart:async';
import '../providers/app_provider.dart';
import '../widgets/safe_widget.dart';
import '../widgets/subscription_status_widget.dart';
import '../models/travel_style.dart';


class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  PageController _dealsPageController = PageController();
  Timer? _dealsTimer;
  int _currentDealIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
      _startDealsAutoScroll();
    });
  }

  @override
  void dispose() {
    _dealsTimer?.cancel();
    _dealsPageController.dispose();
    super.dispose();
  }

  void _startDealsAutoScroll() {
    _dealsTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (_dealsPageController.hasClients) {
        final nextIndex = (_currentDealIndex + 1) % 3; // Assuming 3 deals
        _dealsPageController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        );
      }
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

  List<Color> _getDynamicGradient() {
    final hour = DateTime.now().hour;
    if (hour >= 6 && hour < 12) {
      return [Color(0xFFFFDEE9), Color(0xFFB5FFFC)]; // Morning
    } else if (hour >= 12 && hour < 18) {
      return [Color(0xFF667eea), Color(0xFF764ba2)]; // Afternoon
    } else {
      return [Color(0xFF141E30), Color(0xFF243B55)]; // Evening/Night
    }
  }

  String _getMotivationalQuote() {
    final quotes = [
      "Adventure awaits just beyond your doorstep 🌍",
      "Perfect day to explore the hidden gems nearby!",
      "Every journey begins with a single step 🚶‍♂️",
      "The world is your playground today! 🎯",
    ];
    return quotes[DateTime.now().day % quotes.length];
  }
  
  String _getCurrentLocationName(AppProvider appProvider) {
    if (appProvider.currentLocation == null) {
      return 'Location not available';
    }
    
    return 'Getting location name...';
  }

  Future<String> _getLocationName(double lat, double lng) async {
    print('🔍 Geocoding: $lat, $lng');
    
    // Try Nominatim (OpenStreetMap) first - more accurate for Sri Lanka
    try {
      final osmUrl = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&zoom=18&addressdetails=1';
      final osmResponse = await http.get(
        Uri.parse(osmUrl),
        headers: {'User-Agent': 'TravelBuddy-Mobile/1.0'},
      );
      
      if (osmResponse.statusCode == 200) {
        final osmData = json.decode(osmResponse.body);
        final address = osmData['address'] ?? {};
        
        final suburb = address['suburb'] ?? '';
        final city = address['city'] ?? address['town'] ?? address['village'] ?? '';
        final country = address['country'] ?? '';
        
        print('🌍 OSM result: suburb=$suburb, city=$city, country=$country');
        
        if (suburb.isNotEmpty && country.isNotEmpty) {
          return '$suburb, $country';
        } else if (city.isNotEmpty && country.isNotEmpty) {
          return '$city, $country';
        }
      }
    } catch (e) {
      print('⚠️ OSM geocoding failed: $e');
    }
    
    // Fallback to BigDataCloud
    try {
      final url = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=$lat&longitude=$lng&localityLanguage=en';
      final response = await http.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final city = data['city'] ?? data['locality'] ?? '';
        final country = data['countryName'] ?? '';
        
        print('📍 BigData result: city=$city, country=$country');
        
        if (city.isNotEmpty && country.isNotEmpty) {
          return '$city, $country';
        }
      }
    } catch (e) {
      print('❌ BigData geocoding error: $e');
    }
    
    // Offline fallback for Sri Lankan coordinates
    return _getOfflineLocationName(lat, lng);
  }

  String _getOfflineLocationName(double lat, double lng) {
    // Sri Lankan major cities/areas (approximate boundaries)
    if (lat >= 6.88 && lat <= 6.92 && lng >= 79.90 && lng <= 79.92) {
      return 'Sri Jayawardenepura Kotte, Sri Lanka';
    } else if (lat >= 6.84 && lat <= 6.86 && lng >= 79.92 && lng <= 79.94) {
      return 'Maharagama, Sri Lanka';
    } else if (lat >= 6.90 && lat <= 6.96 && lng >= 79.84 && lng <= 79.88) {
      return 'Colombo, Sri Lanka';
    } else if (lat >= 7.28 && lat <= 7.32 && lng >= 80.62 && lng <= 80.66) {
      return 'Kandy, Sri Lanka';
    } else if (lat >= 6.04 && lat <= 6.08 && lng >= 80.21 && lng <= 80.25) {
      return 'Galle, Sri Lanka';
    } else if (lat >= 6.0 && lat <= 8.0 && lng >= 79.5 && lng <= 81.5) {
      return 'Sri Lanka';
    }
    
    return 'Current Location';
  }
  
  Widget _buildWeatherInfo(AppProvider appProvider) {
    final weather = appProvider.weatherInfo;
    final temp = weather?.temperature.round() ?? 28;
    final condition = weather?.condition ?? 'sunny';
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          _getWeatherIcon(condition),
          color: Colors.white,
          size: 20,
        ),
        const SizedBox(width: 6),
        Text(
          '${temp}°',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
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
  
  Widget _buildWeatherForecast(AppProvider appProvider) {
    if (appProvider.currentLocation == null) {
      return const SizedBox.shrink();
    }

    return FutureBuilder<Map<String, dynamic>>(
      future: _fetchRealWeatherForecast(appProvider.currentLocation!),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const SizedBox.shrink();
        }

        final forecastData = snapshot.data!;
        final hourlyList = forecastData['hourly'] as List<dynamic>? ?? [];
        
        if (hourlyList.isEmpty) {
          return const SizedBox.shrink();
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Today\'s Forecast',
              style: TextStyle(
                color: Colors.white.withOpacity(0.9),
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: hourlyList.take(3).map<Widget>((hourly) {
                final time = DateTime.parse(hourly['time']);
                final temp = (hourly['temperature'] as num).round();
                final condition = hourly['condition'] as String;
                
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.2)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '${time.hour}:00',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Icon(
                        _getWeatherIcon(condition),
                        color: Colors.white,
                        size: 24,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${temp}°',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        );
      },
    );
  }

  Future<Map<String, dynamic>> _fetchRealWeatherForecast(Position location) async {
    try {
      final response = await http.get(
        Uri.parse('http://localhost:3001/api/weather/forecast?lat=${location.latitude}&lng=${location.longitude}'),
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Weather forecast API error: $e');
    }
    
    return {'hourly': []};
  }







  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.travel_explore,
                size: 24,
                color: Color(0xFF6366F1),
              ),
            ),
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
                    const SubscriptionStatusWidget(),
                    _buildWelcomeCard(appProvider),
                    const SizedBox(height: 16),
                    _buildLocationCard(appProvider),
                    const SizedBox(height: 16),
                    _buildHotDealsSlideshow(appProvider),
                    const SizedBox(height: 16),
                    _buildQuickActions(appProvider),
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
  


  Widget _buildWelcomeCard(AppProvider appProvider) {
    try {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: _getDynamicGradient(),
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Background pattern
            Positioned(
              top: -50,
              right: -50,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
            ),
            Positioned(
              bottom: -30,
              left: -30,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.05),
                ),
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header with avatar and greeting
                  Row(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.2),
                          border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
                        ),
                        child: ClipOval(
                          child: appProvider.currentUser?.profilePicture?.isNotEmpty == true
                              ? _buildProfileImage(appProvider.currentUser!.profilePicture!)
                              : Icon(
                                  Icons.person,
                                  color: Colors.white.withOpacity(0.8),
                                  size: 24,
                                ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getGreeting(),
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              appProvider.currentUser?.username ?? 'Traveler',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Weather widget
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withOpacity(0.3)),
                        ),
                        child: _buildWeatherInfo(appProvider),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Location with better styling
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.location_on, color: Colors.white.withOpacity(0.9), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FutureBuilder<String>(
                            future: appProvider.currentLocation != null 
                                ? _getLocationName(
                                    appProvider.currentLocation!.latitude,
                                    appProvider.currentLocation!.longitude,
                                  )
                                : Future.value('Location not available'),
                            builder: (context, snapshot) {
                              return Text(
                                snapshot.data ?? _getCurrentLocationName(appProvider),
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.95),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Motivational Quote
                  const SizedBox(height: 12),
                  Text(
                    _getMotivationalQuote(),
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                    ),
                  ),

                ],
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.blue[100],
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Text('Welcome to Travel Buddy!'),
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
      {
        'label': 'Plan Trip',
        'icon': Icons.map_outlined,
        'activeIcon': Icons.map,
        'color': const Color(0xFF4CAF50),
        'gradient': [const Color(0xFF4CAF50), const Color(0xFF45A049)],
        'tab': 3,
      },
      {
        'label': 'Deals',
        'icon': Icons.local_offer_outlined,
        'activeIcon': Icons.local_offer,
        'color': const Color(0xFFFF9800),
        'gradient': [const Color(0xFFFF9800), const Color(0xFFFF8F00)],
        'tab': 2,
      },
      {
        'label': 'Community',
        'icon': Icons.group_outlined,
        'activeIcon': Icons.group,
        'color': const Color(0xFF9C27B0),
        'gradient': [const Color(0xFF9C27B0), const Color(0xFF8E24AA)],
        'tab': 4,
      },
      {
        'label': 'Weather',
        'icon': Icons.wb_sunny_outlined,
        'activeIcon': Icons.wb_sunny,
        'color': const Color(0xFF2196F3),
        'gradient': [const Color(0xFF2196F3), const Color(0xFF1976D2)],
        'tab': 1,
      },
      {
        'label': 'Emergency',
        'icon': Icons.local_hospital_outlined,
        'activeIcon': Icons.local_hospital,
        'color': const Color(0xFFF44336),
        'gradient': [const Color(0xFFF44336), const Color(0xFFD32F2F)],
        'tab': 1,
      },
      {
        'label': 'Favorites',
        'icon': Icons.favorite_outline,
        'activeIcon': Icons.favorite,
        'color': const Color(0xFFE91E63),
        'gradient': [const Color(0xFFE91E63), const Color(0xFFC2185B)],
        'tab': 1,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.flash_on,
                color: Colors.blue[600],
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Quick Actions',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.1,
          ),
          itemCount: actions.length,
          itemBuilder: (context, index) {
            final action = actions[index];
            
            return Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: InkWell(
                onTap: () => appProvider.setCurrentTabIndex(action['tab'] as int),
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: action['gradient'] as List<Color>,
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          action['activeIcon'] as IconData,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Flexible(
                        child: Text(
                          action['label'] as String,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                            color: Colors.black87,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildNearbyPlaces(AppProvider appProvider) {
    try {
      // Get personalized places based on travel style
      final places = _getPersonalizedPlaces(appProvider).take(6).toList();
      
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
          Row(
            children: [
              const Text(
                'Places for You',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              if (appProvider.userTravelStyle != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${appProvider.userTravelStyle!.emoji} ${appProvider.userTravelStyle!.displayName}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
            ],
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
                                  fontSize: 15,
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
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
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
                onTap: () => _navigateToFavorites(appProvider),
              ),
            ),
        ],
      );
    } catch (e) {
      return const SizedBox.shrink();
    }
  }
  
  List<dynamic> _getPersonalizedPlaces(AppProvider appProvider) {
    final places = appProvider.places;
    final userStyle = appProvider.userTravelStyle;
    
    if (userStyle == null || places.isEmpty) {
      return places;
    }
    
    // Sort places based on travel style preferences
    final sortedPlaces = places.toList();
    sortedPlaces.sort((a, b) {
      final aScore = _getPlaceScore(a, userStyle);
      final bScore = _getPlaceScore(b, userStyle);
      return bScore.compareTo(aScore);
    });
    
    return sortedPlaces;
  }
  
  double _getPlaceScore(dynamic place, TravelStyle style) {
    final type = place.type.toLowerCase();
    final weights = style.placeWeights;
    
    double score = place.rating; // Base score from rating
    
    // Apply style-specific weights
    for (final entry in weights.entries) {
      if (type.contains(entry.key)) {
        score *= entry.value;
        break;
      }
    }
    
    return score;
  }

  Widget _buildQuickActionIcon(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHotDealsSlideshow(AppProvider appProvider) {
    // Load real deals
    if (appProvider.deals.isEmpty && !appProvider.isDealsLoading) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        appProvider.loadDeals();
      });
    }

    final realDeals = appProvider.deals.where((deal) => deal.isActive).take(3).toList();
    final hasRealDeals = realDeals.isNotEmpty;
    
    final dealsToShow = hasRealDeals ? realDeals.map((deal) => {
      'title': deal.title,
      'business': deal.businessName,
      'discount': deal.discount,
      'image': deal.images.isNotEmpty ? deal.images.first : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      'color': _getDealColor(deal.discount),
      'dealId': deal.id,
    }).toList() : [
      {
        'title': '50% OFF Local Restaurant',
        'business': 'Spice Garden',
        'discount': '50% OFF',
        'image': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        'color': Colors.red,
        'dealId': 'mock_1',
      },
      {
        'title': 'Free Dessert with Meal',
        'business': 'Cafe Mocha',
        'discount': 'FREE',
        'image': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
        'color': Colors.green,
        'dealId': 'mock_2',
      },
      {
        'title': '30% OFF Spa Treatment',
        'business': 'Wellness Center',
        'discount': '30% OFF',
        'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
        'color': Colors.purple,
        'dealId': 'mock_3',
      },
    ];

    print('🔥 Hot Deals: ${hasRealDeals ? 'REAL' : 'MOCK'} data (${dealsToShow.length} deals)');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.local_fire_department,
                color: Colors.red,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'Hot Deals',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            Text(
              'Limited Time',
              style: TextStyle(
                fontSize: 12,
                color: Colors.red[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 200,
          child: PageView.builder(
            controller: _dealsPageController,
            onPageChanged: (index) {
              setState(() {
                _currentDealIndex = index;
              });
            },
            itemCount: dealsToShow.length,
            itemBuilder: (context, index) {
              final deal = dealsToShow[index];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    children: [
                      Container(
                        width: double.infinity,
                        height: double.infinity,
                        decoration: BoxDecoration(
                          image: DecorationImage(
                            image: NetworkImage(deal['image'] as String),
                            fit: BoxFit.cover,
                            onError: (_, __) {},
                          ),
                          color: Colors.grey[300],
                        ),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withOpacity(0.7),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        top: 16,
                        right: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: deal['color'] as Color,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            deal['discount'] as String,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 16,
                        left: 16,
                        right: 16,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              deal['title'] as String,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              deal['business'] as String,
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () async {
                                final dealId = deal['dealId'] as String;
                                final success = hasRealDeals 
                                    ? await appProvider.claimDeal(dealId)
                                    : true;
                                
                                if (success) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Claimed: ${deal['title']}'),
                                      backgroundColor: Colors.green,
                                    ),
                                  );
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Failed to claim deal'),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: deal['color'] as Color,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                              ),
                              child: const Text(
                                'Claim Deal',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
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
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            dealsToShow.length,
            (index) => Container(
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: _currentDealIndex == index ? 12 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: _currentDealIndex == index 
                    ? Colors.red 
                    : Colors.grey.withOpacity(0.4),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Color _getDealColor(String discount) {
    if (discount.contains('50%') || discount.contains('FREE')) {
      return Colors.red;
    } else if (discount.contains('30%') || discount.contains('25%')) {
      return Colors.orange;
    } else if (discount.contains('20%') || discount.contains('15%')) {
      return Colors.purple;
    }
    return Colors.blue;
  }

  void _navigateToFavorites(AppProvider appProvider) {
    appProvider.setShowFavoritesOnly();
    appProvider.setCurrentTabIndex(1);
  }

  Widget _buildProfileImage(String imageUrl) {
    if (imageUrl.startsWith('data:image/')) {
      // Handle base64 data URI
      try {
        final base64String = imageUrl.split(',')[1];
        final Uint8List bytes = base64Decode(base64String);
        return Image.memory(
          bytes,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Icon(
              Icons.person,
              color: Colors.white.withOpacity(0.8),
              size: 24,
            );
          },
        );
      } catch (e) {
        return Icon(
          Icons.person,
          color: Colors.white.withOpacity(0.8),
          size: 24,
        );
      }
    } else {
      // Handle network URL
      return Image.network(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Icon(
            Icons.person,
            color: Colors.white.withOpacity(0.8),
            size: 24,
          );
        },
      );
    }
  }
}