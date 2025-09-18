import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/enhanced_activity.dart';

class PremiumActivityCard extends StatelessWidget {
  final EnhancedActivity activity;
  final bool isWeatherAware;
  final String currentWeather;

  const PremiumActivityCard({
    super.key,
    required this.activity,
    this.isWeatherAware = false,
    this.currentWeather = 'sunny',
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 3,
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          _buildImageGallery(),
          _buildContent(),
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue[400]!, Colors.blue[600]!],
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(_getActivityIcon(), color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '${activity.timeSlot} • ${_formatDuration(activity.estimatedDuration)}',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          _buildCostBadge(),
        ],
      ),
    );
  }

  Widget _buildImageGallery() {
    if (activity.images.isEmpty) return const SizedBox();
    
    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: activity.images.length,
        itemBuilder: (context, index) {
          return Container(
            width: 160,
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              image: DecorationImage(
                image: NetworkImage(activity.images[index]),
                fit: BoxFit.cover,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            activity.description,
            style: const TextStyle(fontSize: 14, height: 1.4),
          ),
          const SizedBox(height: 12),
          _buildContextualInfo(),
          const SizedBox(height: 12),
          _buildTravelInfo(),
        ],
      ),
    );
  }

  Widget _buildContextualInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb, color: Colors.orange[700], size: 16),
              const SizedBox(width: 6),
              Text(
                'Smart Tips',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.orange[700],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _buildTipItem('👥', 'Crowd Level: ${activity.contextInfo.crowdLevel}'),
          _buildTipItem('⏰', 'Best Time: ${activity.contextInfo.bestTimeToVisit}'),
          if (isWeatherAware && currentWeather == 'rainy' && !activity.contextInfo.isIndoorActivity)
            _buildTipItem('🌧️', 'Weather Alert: Consider indoor alternative'),
          ...activity.contextInfo.localTips.take(2).map((tip) => _buildTipItem('💡', tip)),
        ],
      ),
    );
  }

  Widget _buildTipItem(String emoji, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTravelInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Row(
        children: [
          Icon(_getTravelIcon(), color: Colors.green[700], size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'From ${activity.travelInfo.fromPrevious}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green[700],
                    fontSize: 12,
                  ),
                ),
                Text(
                  '${_formatDuration(activity.travelInfo.travelTime)} • ${activity.costInfo.currency}${activity.travelInfo.estimatedCost}',
                  style: const TextStyle(fontSize: 11),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => _openDirections(),
            icon: Icon(Icons.directions, color: Colors.green[700], size: 20),
            style: IconButton.styleFrom(
              backgroundColor: Colors.green[100],
              minimumSize: const Size(32, 32),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
      ),
      child: Row(
        children: [
          ...activity.actionableLinks.take(3).map((link) => Expanded(
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              child: ElevatedButton.icon(
                onPressed: () => _launchUrl(link.url),
                icon: Icon(_getActionIcon(link.type), size: 16),
                label: Text(link.title, style: const TextStyle(fontSize: 11)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _getActionColor(link.type),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                ),
              ),
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildCostBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '${activity.costInfo.currency}${activity.costInfo.entryFee}',
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  IconData _getActivityIcon() {
    switch (activity.type) {
      case ActivityType.landmark: return Icons.location_city;
      case ActivityType.restaurant: return Icons.restaurant;
      case ActivityType.museum: return Icons.museum;
      case ActivityType.shopping: return Icons.shopping_bag;
      case ActivityType.nature: return Icons.nature;
      case ActivityType.entertainment: return Icons.theater_comedy;
    }
  }

  IconData _getTravelIcon() {
    switch (activity.travelInfo.recommendedMode) {
      case TransportMode.walk: return Icons.directions_walk;
      case TransportMode.metro: return Icons.train;
      case TransportMode.bus: return Icons.directions_bus;
      case TransportMode.taxi: return Icons.local_taxi;
      case TransportMode.bike: return Icons.directions_bike;
    }
  }

  IconData _getActionIcon(ActionType type) {
    switch (type) {
      case ActionType.booking: return Icons.book_online;
      case ActionType.tickets: return Icons.confirmation_number;
      case ActionType.reservation: return Icons.restaurant_menu;
      case ActionType.map: return Icons.map;
      case ActionType.skipLine: return Icons.fast_forward;
    }
  }

  Color _getActionColor(ActionType type) {
    switch (type) {
      case ActionType.booking: return Colors.blue;
      case ActionType.tickets: return Colors.orange;
      case ActionType.reservation: return Colors.green;
      case ActionType.map: return Colors.purple;
      case ActionType.skipLine: return Colors.red;
    }
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes}m';
  }

  void _openDirections() async {
    final url = 'https://www.google.com/maps/dir/?api=1&destination=${Uri.encodeComponent(activity.location.address)}';
    _launchUrl(url);
  }

  void _launchUrl(String url) async {
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    }
  }
}

