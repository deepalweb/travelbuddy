import 'package:flutter/material.dart';
import '../services/route_tracking_service.dart';

class RouteProgressWidget extends StatelessWidget {
  final RouteTrackingService trackingService;

  const RouteProgressWidget({
    super.key,
    required this.trackingService,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: trackingService,
      builder: (context, child) {
        if (trackingService.status == RouteStatus.notStarted) {
          return const SizedBox.shrink();
        }

        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _getStatusColor().withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _getStatusColor()),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildHeader(),
              const SizedBox(height: 12),
              _buildProgressBar(),
              const SizedBox(height: 12),
              _buildStats(),
              if (trackingService.currentTarget != null) ...[
                const SizedBox(height: 12),
                _buildCurrentTarget(),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Icon(_getStatusIcon(), color: _getStatusColor()),
        const SizedBox(width: 8),
        Text(
          _getStatusText(),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: _getStatusColor(),
          ),
        ),
        const Spacer(),
        if (trackingService.status == RouteStatus.completed)
          const Icon(Icons.celebration, color: Colors.amber),
      ],
    );
  }

  Widget _buildProgressBar() {
    final progress = trackingService.progressPercentage / 100;
    
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${trackingService.completedCount}/${trackingService.places.length} places',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
            ),
            Text(
              '${trackingService.progressPercentage.toInt()}%',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress,
          backgroundColor: Colors.grey[300],
          valueColor: AlwaysStoppedAnimation<Color>(_getStatusColor()),
          minHeight: 8,
        ),
      ],
    );
  }

  Widget _buildStats() {
    final stats = trackingService.getRouteStats();
    final duration = stats['duration'] as Duration?;
    
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildStatItem(
          icon: Icons.timer,
          label: 'Time',
          value: duration != null 
              ? '${duration.inMinutes}m'
              : '0m',
        ),
        _buildStatItem(
          icon: Icons.directions_walk,
          label: 'Distance',
          value: '${(stats['totalDistance'] / 1000).toStringAsFixed(1)}km',
        ),
        _buildStatItem(
          icon: Icons.check_circle,
          label: 'Completed',
          value: '${stats['visitedPlaces']}',
        ),
      ],
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildCurrentTarget() {
    final target = trackingService.currentTarget!;
    final distance = trackingService.getDistanceToCurrentTarget();
    final eta = trackingService.getETAToCurrentTarget();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.yellow[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.yellow[300]!),
      ),
      child: Row(
        children: [
          const Icon(Icons.navigation, color: Colors.orange),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Next: ${target.name}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                if (distance != null && eta != null)
                  Text(
                    '${(distance / 1000).toStringAsFixed(1)}km away • ${eta.inMinutes}min',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (trackingService.status) {
      case RouteStatus.active:
        return Colors.green;
      case RouteStatus.paused:
        return Colors.orange;
      case RouteStatus.completed:
        return Colors.blue;
      case RouteStatus.notStarted:
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon() {
    switch (trackingService.status) {
      case RouteStatus.active:
        return Icons.navigation;
      case RouteStatus.paused:
        return Icons.pause_circle;
      case RouteStatus.completed:
        return Icons.check_circle;
      case RouteStatus.notStarted:
      default:
        return Icons.route;
    }
  }

  String _getStatusText() {
    switch (trackingService.status) {
      case RouteStatus.active:
        return 'Route Active';
      case RouteStatus.paused:
        return 'Route Paused';
      case RouteStatus.completed:
        return 'Route Completed!';
      case RouteStatus.notStarted:
      default:
        return 'Route Ready';
    }
  }
}