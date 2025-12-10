import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:async';
import '../providers/app_provider.dart';
import '../providers/language_provider.dart';
import '../widgets/safe_widget.dart';
import '../widgets/subscription_status_widget.dart';
import '../models/travel_style.dart';
import '../models/trip.dart';
import '../screens/language_assistant_screen.dart';
import '../screens/deal_detail_screen.dart';
import '../screens/trip_plan_detail_screen.dart';
import '../screens/transport_screen.dart';
import '../screens/travel_agent_screen.dart';
import '../screens/events_screen.dart';
import '../config/environment.dart';


class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  PageController _dealsPageController = PageController();
  Timer? _dealsTimer;
  int _currentDealIndex = 0;
  
  // Cache for location names to prevent repeated API calls
  final Map<String, String> _locationCache = {};
  String? _lastLocationKey;

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
    _startDealsAutoScrollWithCount(3); // Default count
  }

  void _startDealsAutoScrollWithCount(int dealCount) {
    _dealsTimer?.cancel();
    if (dealCount > 1) {
      _dealsTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
        if (_dealsPageController.hasClients) {
          final nextIndex = (_currentDealIndex + 1) % dealCount;
          _dealsPageController.animateToPage(
            nextIndex,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

  String _getTimeRemaining(DateTime expiresAt) {
    final now = DateTime.now();
    final difference = expiresAt.difference(now);
    
    if (difference.isNegative) {
      return 'Expired';
    }
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d left';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h left';
    } else {
      return '${difference.inMinutes}m left';
    }
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
    // Create a cache key with rounded coordinates to avoid minor differences
    final locationKey = '${lat.toStringAsFixed(4)}_${lng.toStringAsFixed(4)}';
    
    // Return cached result if available
    if (_locationCache.containsKey(locationKey)) {
      return _locationCache[locationKey]!;
    }
    
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
          final result = '$suburb, $country';
          _locationCache[locationKey] = result;
          return result;
        } else if (city.isNotEmpty && country.isNotEmpty) {
          final result = '$city, $country';
          _locationCache[locationKey] = result;
          return result;
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
          final result = '$city, $country';
          _locationCache[locationKey] = result;
          return result;
        }
      }
    } catch (e) {
      print('❌ BigData geocoding error: $e');
    }
    
    // Offline fallback for Sri Lankan coordinates
    final result = _getOfflineLocationName(lat, lng);
    _locationCache[locationKey] = result;
    return result;
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
  
  String _getWeatherTip(int temp, String condition) {
    if (condition.toLowerCase().contains('rain')) return 'Indoor spots';
    if (temp > 32) return 'Beach time!';
    if (temp > 28) return 'Great outdoors';
    return 'Perfect day';
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
            SizedBox(
              height: 120,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 3,
                itemBuilder: (context, index) {
                  final now = DateTime.now();
                  final forecastTime = now.add(Duration(hours: (index + 1) * 3));
                  final temp = 28 + (index * 2); // Mock data - replace with real API
                  final condition = index == 0 ? 'sunny' : index == 1 ? 'cloudy' : 'rainy';
                  
                  return Container(
                    width: 80,
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '${forecastTime.hour}:00',
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
                },
              ),
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
              // Language Quick Access Button
              Consumer<LanguageProvider>(
                builder: (context, languageProvider, child) {
                  return IconButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const LanguageAssistantScreen(),
                        ),
                      );
                    },
                    icon: Stack(
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              languageProvider.currentLanguageInfo.flag,
                              style: const TextStyle(fontSize: 16),
                            ),
                            const SizedBox(width: 2),
                            const Icon(Icons.translate, size: 16),
                          ],
                        ),
                        if (languageProvider.showLocationSuggestion)
                          Positioned(
                            right: 0,
                            top: 0,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                      ],
                    ),
                  );
                },
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
                    _buildInProgressTrips(appProvider),
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
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              // Background image - nearby place or fallback
              Positioned.fill(
                child: appProvider.places.isNotEmpty && appProvider.places.first.photoUrl.isNotEmpty
                    ? Image.network(
                        appProvider.places.first.photoUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                          );
                        },
                      )
                    : Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                      ),
              ),
              // Dark overlay for text readability
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.black.withOpacity(0.5),
                        Colors.black.withOpacity(0.7),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
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
                              : Container(
                                  width: 50,
                                  height: 50,
                                  color: Colors.white.withOpacity(0.1),
                                  child: Icon(
                                    Icons.person,
                                    color: Colors.white.withOpacity(0.8),
                                    size: 24,
                                  ),
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
        'label': 'Live Weather',
        'icon': Icons.cloud,
        'color': const Color(0xFF0A84FF),
        'gradient': [const Color(0xFF0A84FF), const Color(0xFF0066CC)],
        'action': 'weather',
      },
      {
        'label': 'Safety Hub',
        'icon': Icons.emergency_share,
        'color': const Color(0xFFFF3B30),
        'gradient': [const Color(0xFFFF3B30), const Color(0xFFD70015)],
        'action': 'safety',
      },
      {
        'label': 'Language Assistant',
        'icon': Icons.translate,
        'color': const Color(0xFF30B0C7),
        'gradient': [const Color(0xFF30B0C7), const Color(0xFF2596A8)],
        'action': 'translator',
      },
      {
        'label': 'Transport Hub',
        'icon': Icons.airport_shuttle,
        'color': const Color(0xFF8E44AD),
        'gradient': [const Color(0xFF8E44AD), const Color(0xFF6C3483)],
        'action': 'transport',
      },
      {
        'label': 'Travel Assistance',
        'icon': Icons.support_agent,
        'color': const Color(0xFFFFB300),
        'gradient': [const Color(0xFFFFB300), const Color(0xFFFF8F00)],
        'action': 'travel_agent',
      },
      {
        'label': 'Events & Festivals',
        'icon': Icons.celebration,
        'color': const Color(0xFFBF5AF2),
        'gradient': [const Color(0xFFBF5AF2), const Color(0xFF9D3FD1)],
        'action': 'events',
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
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: actions.length > 3 ? 3 : actions.length,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.85,
          ),
          itemCount: actions.length,
          itemBuilder: (context, index) {
            final action = actions[index];
            
            return GestureDetector(
              onTap: () => _handleQuickAction(action['label'] as String, appProvider),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: action['gradient'] as List<Color>,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: (action['color'] as Color).withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      action['icon'] as IconData,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    action['label'] as String,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                      color: Colors.black87,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
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

  Widget _buildInProgressTrips(AppProvider appProvider) {
    try {
      final allTrips = [...appProvider.tripPlans, ...appProvider.itineraries];
      if (allTrips.isEmpty) {
        return const SizedBox.shrink();
      }

      // Calculate progress for each trip
      final inProgressTrips = allTrips.where((trip) {
        final activities = trip is TripPlan 
            ? trip.dailyPlans.expand((day) => day.activities).toList()
            : (trip as OneDayItinerary).dailyPlan;
        
        final visitedCount = activities.where((a) => a.isVisited).length;
        final totalCount = activities.length;
        
        return visitedCount > 0 && visitedCount < totalCount; // Has progress but not complete
      }).take(3).toList();

      if (inProgressTrips.isEmpty) {
        return const SizedBox.shrink();
      }

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.pending_actions,
                  color: Colors.orange[600],
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'In Progress Trip Plans',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 140,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: inProgressTrips.length,
              itemBuilder: (context, index) {
                final trip = inProgressTrips[index];
                final activities = trip is TripPlan 
                    ? trip.dailyPlans.expand((day) => day.activities).toList()
                    : (trip as OneDayItinerary).dailyPlan;
                
                final visitedCount = activities.where((a) => a.isVisited).length;
                final totalCount = activities.length;
                final progress = visitedCount / totalCount;
                
                final title = trip is TripPlan ? trip.tripTitle : (trip as OneDayItinerary).title;
                
                return Container(
                  width: 200,
                  margin: const EdgeInsets.only(right: 12),
                  child: Card(
                    child: InkWell(
                      onTap: () {
                        if (trip is TripPlan) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => TripPlanDetailScreen(tripPlan: trip),
                            ),
                          );
                        } else {
                          // Convert itinerary to trip plan for navigation
                          final itinerary = trip as OneDayItinerary;
                          final tripPlan = TripPlan(
                            id: itinerary.id,
                            tripTitle: itinerary.title,
                            destination: 'Day Trip',
                            duration: '1 Day',
                            introduction: itinerary.introduction,
                            dailyPlans: [
                              DailyTripPlan(
                                day: 1,
                                title: itinerary.title,
                                activities: itinerary.dailyPlan,
                              ),
                            ],
                            conclusion: itinerary.conclusion,
                          );
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => TripPlanDetailScreen(tripPlan: tripPlan),
                            ),
                          );
                        }
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  trip is TripPlan ? Icons.map : Icons.today,
                                  color: Colors.orange[600],
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    title ?? 'Trip Plan',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '$visitedCount of $totalCount places visited',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                            const SizedBox(height: 8),
                            LinearProgressIndicator(
                              value: progress,
                              backgroundColor: Colors.grey[300],
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.orange[600]!,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${(progress * 100).toInt()}% complete',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.orange[600],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
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

    // Show loading state while deals are being fetched
    if (appProvider.isDealsLoading) {
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
            ],
          ),
          const SizedBox(height: 16),
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 12),
                  Text('Loading deals...'),
                ],
              ),
            ),
          ),
        ],
      );
    }

    final activeDeals = appProvider.deals.where((deal) => deal.isActive).toList();
    
    // If no deals available, show empty state
    if (activeDeals.isEmpty) {
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
            ],
          ),
          const SizedBox(height: 16),
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.local_offer_outlined, size: 48, color: Colors.grey[400]),
                  const SizedBox(height: 12),
                  Text(
                    'No deals available right now',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: () => appProvider.loadDeals(),
                    child: const Text('Refresh'),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    // Take up to 5 deals for slideshow
    final dealsToShow = activeDeals.take(5).toList();
    
    // Update auto-scroll timer based on actual deal count
    _dealsTimer?.cancel();
    _startDealsAutoScrollWithCount(dealsToShow.length);

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
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${dealsToShow.length} Active',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.red[600],
                  fontWeight: FontWeight.w500,
                ),
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
              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => DealDetailScreen(deal: deal),
                    ),
                  );
                },
                child: Container(
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
                      deal.images.isNotEmpty
                          ? Image.network(
                              deal.images.first,
                              width: double.infinity,
                              height: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  color: Colors.grey[300],
                                  child: Icon(Icons.local_offer, size: 48, color: Colors.grey[600]),
                                );
                              },
                            )
                          : Container(
                              color: Colors.grey[300],
                              child: Icon(Icons.local_offer, size: 48, color: Colors.grey[600]),
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
                            color: _getDealColor(deal.discount),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            deal.discount,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 16,
                        left: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.orange.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.timer, color: Colors.white, size: 12),
                              const SizedBox(width: 4),
                              Text(
                                _getTimeRemaining(deal.validUntil),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
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
                              deal.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              deal.businessName,
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () async {
                                final success = await appProvider.claimDeal(deal.id);
                                
                                if (success) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Claimed: ${deal.title}'),
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
                                foregroundColor: _getDealColor(deal.discount),
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

  void _handleQuickAction(String action, AppProvider appProvider) {
    switch (action) {
      case 'Safety Hub':
      case 'safety':
        _showEmergencyDialog();
        break;
      case 'Language Assistant':
      case 'Translator':
      case 'translator':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const LanguageAssistantScreen(),
          ),
        );
        break;
      case 'Live Weather':
      case 'Weather':
      case 'weather':
        _showWeatherModal(appProvider);
        break;
      case 'Transport Hub':
      case 'Transport':
      case 'transport':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const TransportScreen(),
          ),
        );
        break;
      case 'Travel Assistance':
      case 'Travel Agent':
      case 'travel_agent':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const TravelAgentScreen(),
          ),
        );
        break;
      case 'Events & Festivals':
      case 'Events':
      case 'events':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const EventsScreen(),
          ),
        );
        break;
      default:
        appProvider.setCurrentTabIndex(1);
        break;
    }
  }

  void _showEmergencyDialog() async {
    final appProvider = context.read<AppProvider>();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.emergency, color: Colors.red, size: 24),
            SizedBox(width: 8),
            Text('Emergency Services'),
          ],
        ),
        content: FutureBuilder<Map<String, dynamic>>(
          future: _getLocationBasedEmergencyNumbers(appProvider),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Getting emergency numbers for your location...'),
                ],
              );
            }
            
            final emergencyData = snapshot.data ?? _getDefaultEmergencyNumbers();
            
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Emergency Services - ${emergencyData['country']}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.red,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _buildEmergencyButton(
                  'Call Police (${emergencyData['police']})',
                  Icons.local_police,
                  Colors.blue,
                  () => _makeEmergencyCall(emergencyData['police']),
                ),
                const SizedBox(height: 8),
                _buildEmergencyButton(
                  'Call Ambulance (${emergencyData['ambulance']})',
                  Icons.local_hospital,
                  Colors.red,
                  () => _makeEmergencyCall(emergencyData['ambulance']),
                ),
                const SizedBox(height: 8),
                _buildEmergencyButton(
                  'Call Fire Dept (${emergencyData['fire']})',
                  Icons.local_fire_department,
                  Colors.orange,
                  () => _makeEmergencyCall(emergencyData['fire']),
                ),
                const SizedBox(height: 16),
                _buildEmergencyButton(
                  'Share Location',
                  Icons.share_location,
                  Colors.green,
                  () => _shareEmergencyLocation(),
                ),
              ],
            );
          },
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

  Widget _buildEmergencyButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onPressed,
  ) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, color: Colors.white),
        label: Text(label, style: const TextStyle(color: Colors.white)),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  void _makeEmergencyCall(String number) async {
    Navigator.pop(context);
    try {
      final Uri phoneUri = Uri(scheme: 'tel', path: number);
      if (await canLaunchUrl(phoneUri)) {
        await launchUrl(phoneUri);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Cannot make call to $number'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error calling $number: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<Map<String, dynamic>> _getLocationBasedEmergencyNumbers(AppProvider appProvider) async {
    if (appProvider.currentLocation == null) {
      return _getDefaultEmergencyNumbers();
    }
    
    try {
      final lat = appProvider.currentLocation!.latitude;
      final lng = appProvider.currentLocation!.longitude;
      
      // Get location name first
      final locationName = await _getLocationName(lat, lng);
      
      // Use real emergency numbers database
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/emergency/numbers?lat=$lat&lng=$lng'),
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'country': data['country'] ?? 'Unknown',
          'police': data['police'] ?? '911',
          'ambulance': data['ambulance'] ?? '911',
          'fire': data['fire'] ?? '911',
        };
      }
    } catch (e) {
      print('Error getting emergency numbers: $e');
    }
    
    return _getDefaultEmergencyNumbers();
  }
  
  Map<String, dynamic> _getDefaultEmergencyNumbers() {
    return {
      'country': 'Sri Lanka',
      'police': '119',
      'ambulance': '110', 
      'fire': '111',
    };
  }
  
  Widget _build9HourForecast(AppProvider appProvider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '9-Hour Forecast',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.8,
            ),
            itemCount: 3,
            itemBuilder: (context, index) {
              final now = DateTime.now();
              final forecastTime = now.add(Duration(hours: (index + 1) * 3));
              final temp = 28 + (index * 2); // Mock data
              final condition = index == 0 ? 'sunny' : index == 1 ? 'cloudy' : 'rainy';
              
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '${forecastTime.hour}:00',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Icon(
                      _getWeatherIcon(condition),
                      color: Colors.blue[600],
                      size: 32,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${temp}°C',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      condition.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[600],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showWeatherModal(AppProvider appProvider) {
    final temp = appProvider.weatherInfo?.temperature.round() ?? 28;
    final condition = appProvider.weatherInfo?.condition ?? 'sunny';
    final humidity = appProvider.weatherInfo?.humidity.round() ?? 65;
    final windSpeed = appProvider.weatherInfo?.windSpeed.round() ?? 12;
    final feelsLike = temp + 2;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: _getWeatherGradient(condition),
                ),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Travel Weather', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                      IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(_getWeatherIcon(condition), color: Colors.white, size: 60),
                      const SizedBox(width: 20),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${temp}°C', style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.bold)),
                          Text('Feels like ${feelsLike}°', style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                    child: Text(_getAISummary(temp, condition), style: const TextStyle(color: Colors.white, fontSize: 14), textAlign: TextAlign.center),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (appProvider.currentLocation != null)
                      FutureBuilder<String>(
                        future: _getLocationName(appProvider.currentLocation!.latitude, appProvider.currentLocation!.longitude),
                        builder: (context, snapshot) => Row(children: [const Icon(Icons.location_on, color: Colors.grey, size: 16), const SizedBox(width: 4), Text(snapshot.data ?? 'Getting location...', style: const TextStyle(fontSize: 14))]),
                      ),
                    const SizedBox(height: 20),
                    const Text('Weather Metrics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _buildMetricCard('💨 Wind', '$windSpeed km/h', Colors.blue)),
                        const SizedBox(width: 8),
                        Expanded(child: _buildMetricCard('☁ Humidity', '$humidity%', Colors.cyan)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: _buildMetricCard('🔆 UV Index', _getUVIndex(temp).toString(), _getUVColor(_getUVIndex(temp)))),
                        const SizedBox(width: 8),
                        Expanded(child: _buildMetricCard('🌧️ Rain', '${_getRainChance(condition)}%', Colors.indigo)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    const Text('Weather Timeline', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    SizedBox(height: 140, child: _buildWeatherTimeline(temp, condition)),
                    const SizedBox(height: 20),
                    const Text('🎯 Best Activities Now', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ..._getActivityRecommendations(temp, condition).map((activity) => _buildActivityChip(activity)),
                    const SizedBox(height: 20),
                    const Text('👕 What to Wear', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(12)),
                      child: Text(_getClothingRecommendation(temp, condition), style: const TextStyle(fontSize: 14)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  List<Color> _getWeatherGradient(String condition) {
    if (condition.toLowerCase().contains('rain')) return [const Color(0xFF4A5568), const Color(0xFF2D3748)];
    if (condition.toLowerCase().contains('cloud')) return [const Color(0xFF718096), const Color(0xFF4A5568)];
    return [const Color(0xFF3B82F6), const Color(0xFF2563EB)];
  }
  
  String _getAISummary(int temp, String condition) {
    if (condition.toLowerCase().contains('rain')) return 'Light rain expected — great day for museums, cafes, and indoor activities.';
    if (temp > 32) return 'High UV index — best to explore early morning or after 4 PM.';
    return 'Perfect outdoor day: Low wind, low chance of rain.';
  }
  
  Widget _buildMetricCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.3))),
      child: Column(children: [Text(label, style: TextStyle(fontSize: 12, color: color)), const SizedBox(height: 4), Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color))]),
    );
  }
  
  int _getUVIndex(int temp) => temp > 30 ? 8 : temp > 25 ? 6 : 4;
  
  Color _getUVColor(int uv) => uv > 7 ? Colors.red : uv > 5 ? Colors.orange : Colors.green;
  
  int _getRainChance(String condition) => condition.toLowerCase().contains('rain') ? 60 : condition.toLowerCase().contains('cloud') ? 30 : 10;
  
  Widget _buildWeatherTimeline(int baseTemp, String condition) {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      itemCount: 3,
      itemBuilder: (context, index) {
        final hour = DateTime.now().add(Duration(hours: (index + 1) * 3)).hour;
        final temp = baseTemp + (index == 1 ? 2 : index == 2 ? -1 : 0);
        final uv = _getUVIndex(temp);
        final rain = index == 2 ? 60 : 10;
        return Container(
          width: 110,
          margin: const EdgeInsets.only(right: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.blue[200]!)),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('$hour:00', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Icon(_getWeatherIcon(index == 2 ? 'rainy' : condition), color: Colors.blue[600], size: 28),
              const SizedBox(height: 8),
              Text('${temp}°', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('UV: $uv', style: TextStyle(fontSize: 10, color: _getUVColor(uv))),
              Text('Rain: $rain%', style: TextStyle(fontSize: 10, color: Colors.grey[600])),
            ],
          ),
        );
      },
    );
  }
  
  List<String> _getActivityRecommendations(int temp, String condition) {
    if (condition.toLowerCase().contains('rain')) return ['☕ Visit cafes', '🏛️ Museums', '🛍️ Shopping malls'];
    if (temp > 32) return ['🏖️ Beach', '🏊 Swimming', '🌅 Sunset viewing'];
    return ['🚶 City walking tour', '📸 Photography', '🌳 Parks & gardens'];
  }
  
  Widget _buildActivityChip(String activity) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(color: Colors.green[50], borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.green[200]!)),
      child: Row(children: [Text(activity, style: TextStyle(fontSize: 14, color: Colors.green[700]))]),
    );
  }
  
  String _getClothingRecommendation(int temp, String condition) {
    if (condition.toLowerCase().contains('rain')) return '🌂 Carry an umbrella. Light jacket recommended.';
    if (temp > 32) return '👕 Light cotton shirt. Sunglasses and sunscreen essential.';
    if (temp < 25) return '🧥 Bring a light jacket for evening.';
    return '👕 Comfortable casual wear. Perfect weather!';
  }

  void _showTransportModal() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TransportScreen(),
      ),
    );
  }

  void _showTravelAgentModal() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TravelAgentScreen(),
      ),
    );
  }

  Widget _buildTransportOption(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
            ],
          ),
        ),
      ),
    );
  }

  void _showComingSoon(String feature) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature coming soon!'),
        backgroundColor: Colors.blue,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _shareEmergencyLocation() async {
    Navigator.pop(context);
    final appProvider = context.read<AppProvider>();
    if (appProvider.currentLocation != null) {
      final lat = appProvider.currentLocation!.latitude;
      final lng = appProvider.currentLocation!.longitude;
      final locationText = 'Emergency! My location: https://maps.google.com/?q=$lat,$lng';
      
      try {
        final Uri smsUri = Uri(
          scheme: 'sms',
          queryParameters: {'body': locationText},
        );
        if (await canLaunchUrl(smsUri)) {
          await launchUrl(smsUri);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Location copied to clipboard'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error sharing location'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Location not available'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  Widget _buildProfileImage(String imageUrl) {
    if (imageUrl.isEmpty) {
      return Container(
        width: 50,
        height: 50,
        color: Colors.white.withOpacity(0.1),
        child: Icon(
          Icons.person,
          color: Colors.white.withOpacity(0.8),
          size: 24,
        ),
      );
    }
    
    if (imageUrl.startsWith('data:image/')) {
      // Handle base64 data URI
      try {
        final base64String = imageUrl.split(',')[1];
        final Uint8List bytes = base64Decode(base64String);
        return Image.memory(
          bytes,
          width: 50,
          height: 50,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              width: 50,
              height: 50,
              color: Colors.white.withOpacity(0.1),
              child: Icon(
                Icons.person,
                color: Colors.white.withOpacity(0.8),
                size: 24,
              ),
            );
          },
        );
      } catch (e) {
        return Container(
          width: 50,
          height: 50,
          color: Colors.white.withOpacity(0.1),
          child: Icon(
            Icons.person,
            color: Colors.white.withOpacity(0.8),
            size: 24,
          ),
        );
      }
    } else {
      // Handle network URL
      return Image.network(
        imageUrl,
        width: 50,
        height: 50,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Container(
            width: 50,
            height: 50,
            color: Colors.white.withOpacity(0.1),
            child: Center(
              child: CircularProgressIndicator(
                value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                    : null,
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white.withOpacity(0.8)),
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) {
          return Container(
            width: 50,
            height: 50,
            color: Colors.white.withOpacity(0.1),
            child: Icon(
              Icons.person,
              color: Colors.white.withOpacity(0.8),
              size: 24,
            ),
          );
        },
      );
    }
  }
}

  // AI-curated deal ranking
  List<dynamic> _curateDeals(List<dynamic> deals, AppProvider appProvider) {
    final userStyle = appProvider.userTravelStyle;
    final sortedDeals = deals.toList();
    
    sortedDeals.sort((a, b) {
      double aScore = _calculateDealScore(a, appProvider, userStyle);
      double bScore = _calculateDealScore(b, appProvider, userStyle);
      return bScore.compareTo(aScore);
    });
    
    return sortedDeals;
  }
  
  double _calculateDealScore(dynamic deal, AppProvider appProvider, TravelStyle? userStyle) {
    double score = 0;
    
    // Discount value score
    final discountValue = _extractDiscountValue(deal.discount);
    score += discountValue * 2;
    
    // Time urgency score
    final hoursLeft = deal.validUntil.difference(DateTime.now()).inHours;
    if (hoursLeft < 24) score += 30; // Limited time boost
    if (hoursLeft < 6) score += 20; // Extra urgency
    
    // Distance score (closer = better)
    if (appProvider.currentLocation != null) {
      final distance = _calculateDealDistanceKm(deal, appProvider);
      if (distance != null && distance < 5) score += 25;
      else if (distance != null && distance < 10) score += 15;
    }
    
    // User behavior score
    if (userStyle != null) {
      final businessType = deal.businessType.toLowerCase();
      if (userStyle == TravelStyle.foodie && (businessType.contains('restaurant') || businessType.contains('food'))) {
        score += 40;
      } else if (userStyle == TravelStyle.explorer && businessType.contains('attraction')) {
        score += 40;
      } else if (userStyle == TravelStyle.relaxer && businessType.contains('spa')) {
        score += 40;
      }
    }
    
    // Popularity score
    score += deal.claims * 0.5;
    score += deal.views * 0.1;
    
    return score;
  }
  
  double _extractDiscountValue(String discount) {
    final match = RegExp(r'(\d+)').firstMatch(discount);
    return match != null ? double.parse(match.group(1)!) : 10;
  }
  
  String _getDealRank(dynamic deal, AppProvider appProvider) {
    final score = _calculateDealScore(deal, appProvider, appProvider.userTravelStyle);
    final hoursLeft = deal.validUntil.difference(DateTime.now()).inHours;
    final discountValue = _extractDiscountValue(deal.discount);
    
    if (hoursLeft < 6) return 'Limited Time';
    if (discountValue >= 40) return 'Best Value';
    if (score > 80) return 'Trending';
    if (deal.claims > 50) return 'Popular';
    return 'Featured';
  }
  
  String? _calculateDealDistance(dynamic deal, AppProvider appProvider) {
    final distanceKm = _calculateDealDistanceKm(deal, appProvider);
    if (distanceKm == null) return null;
    
    if (distanceKm < 1) {
      return '${(distanceKm * 1000).toInt()}m away';
    }
    return '${distanceKm.toStringAsFixed(1)}km away';
  }
  
  double? _calculateDealDistanceKm(dynamic deal, AppProvider appProvider) {
    if (appProvider.currentLocation == null) return null;
    
    // Mock coordinates - replace with actual deal location from backend
    final dealLat = 6.9271; // Colombo center
    final dealLng = 79.8612;
    
    final distance = Geolocator.distanceBetween(
      appProvider.currentLocation!.latitude,
      appProvider.currentLocation!.longitude,
      dealLat,
      dealLng,
    );
    
    return distance / 1000;
  }
  
  Color _getRankColor(String rank) {
    switch (rank) {
      case 'Best Value':
        return Colors.red;
      case 'Limited Time':
        return Colors.deepOrange;
      case 'Trending':
        return Colors.purple;
      case 'Popular':
        return Colors.blue;
      default:
        return Colors.green;
    }
  }
  
  IconData _getRankIcon(String rank) {
    switch (rank) {
      case 'Best Value':
        return Icons.star;
      case 'Limited Time':
        return Icons.flash_on;
      case 'Trending':
        return Icons.trending_up;
      case 'Popular':
        return Icons.favorite;
      default:
        return Icons.local_offer;
    }
  }
  
  int _getNewDealsCount(List<dynamic> deals) {
    final lastVisit = DateTime.now().subtract(const Duration(hours: 24));
    return deals.where((deal) {
      // Mock: assume deals created in last 24h are "new"
      return deal.validUntil.isAfter(DateTime.now().add(const Duration(days: 6)));
    }).length;
  }
