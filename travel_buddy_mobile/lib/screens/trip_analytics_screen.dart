import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../services/trip_analytics_service.dart';
import '../constants/app_constants.dart';

class TripAnalyticsScreen extends StatefulWidget {
  const TripAnalyticsScreen({super.key});

  @override
  State<TripAnalyticsScreen> createState() => _TripAnalyticsScreenState();
}

class _TripAnalyticsScreenState extends State<TripAnalyticsScreen> {
  Map<String, dynamic>? _userStats;
  List<Map<String, dynamic>> _popularDestinations = [];
  List<Map<String, dynamic>> _trendingActivities = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    setState(() => _isLoading = true);

    try {
      final appProvider = context.read<AppProvider>();
      final userId = appProvider.currentUser?.mongoId;

      final results = await Future.wait([
        if (userId != null) TripAnalyticsService.getUserTripStats(userId),
        TripAnalyticsService.getPopularDestinations(limit: 5),
        TripAnalyticsService.getTrendingActivities(limit: 5),
      ]);

      setState(() {
        if (userId != null) _userStats = results[0] as Map<String, dynamic>;
        _popularDestinations = results[userId != null ? 1 : 0] as List<Map<String, dynamic>>;
        _trendingActivities = results[userId != null ? 2 : 1] as List<Map<String, dynamic>>;
      });
    } catch (e) {
      print('Error loading analytics: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip Analytics'),
        backgroundColor: Color(AppConstants.colors['primary']!),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAnalytics,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_userStats != null) ...[
                      _buildUserStatsSection(),
                      const SizedBox(height: 24),
                    ],
                    _buildPopularDestinationsSection(),
                    const SizedBox(height: 24),
                    _buildTrendingActivitiesSection(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildUserStatsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Your Travel Stats',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(AppConstants.colors['primary']!), Colors.purple[400]!],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  _buildStatItem(
                    '${_userStats!['totalTrips']}',
                    'Total Trips',
                    Icons.map,
                  ),
                  _buildStatItem(
                    '${_userStats!['completedActivities']}',
                    'Activities Done',
                    Icons.check_circle,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _buildStatItem(
                    '${(_userStats!['completionRate'] * 100).toInt()}%',
                    'Completion Rate',
                    Icons.trending_up,
                  ),
                  _buildStatItem(
                    '${_userStats!['totalDistance']} km',
                    'Distance Traveled',
                    Icons.directions_walk,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildInfoCard(
                'Favorite Destination',
                _userStats!['favoriteDestination'] ?? 'None yet',
                Icons.favorite,
                Colors.red[100]!,
                Colors.red[600]!,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildInfoCard(
                'Favorite Category',
                _userStats!['favoriteCategory'] ?? 'None yet',
                Icons.category,
                Colors.blue[100]!,
                Colors.blue[600]!,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatItem(String value, String label, IconData icon) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, String value, IconData icon, Color bgColor, Color iconColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPopularDestinationsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Popular Destinations',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: _popularDestinations.map((destination) {
              final index = _popularDestinations.indexOf(destination);
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: _getRankColor(index),
                  child: Text(
                    '${index + 1}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                title: Text(destination['destination']),
                subtitle: Text('${destination['tripCount']} trips planned'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.star, color: Colors.amber, size: 16),
                    Text(' ${destination['avgRating']}'),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildTrendingActivitiesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Trending Activities',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: _trendingActivities.map((activity) {
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: _getCategoryColor(activity['category']),
                  child: Icon(
                    _getCategoryIcon(activity['category']),
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                title: Text(activity['activity']),
                subtitle: Text(activity['category']),
                trailing: Text(
                  '${activity['completionCount']}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Color _getRankColor(int index) {
    switch (index) {
      case 0: return Colors.amber;
      case 1: return Colors.grey;
      case 2: return Colors.brown;
      default: return Colors.blue;
    }
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'culture': return Colors.purple;
      case 'food': return Colors.orange;
      case 'sightseeing': return Colors.blue;
      case 'nature': return Colors.green;
      case 'shopping': return Colors.pink;
      default: return Colors.grey;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'culture': return Icons.museum;
      case 'food': return Icons.restaurant;
      case 'sightseeing': return Icons.camera_alt;
      case 'nature': return Icons.nature;
      case 'shopping': return Icons.shopping_bag;
      default: return Icons.place;
    }
  }
}