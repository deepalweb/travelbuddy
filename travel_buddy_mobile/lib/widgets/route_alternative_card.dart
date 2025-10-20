import 'package:flutter/material.dart';
import '../models/route_models.dart';

class RouteAlternativeCard extends StatelessWidget {
  final OptimizedRoute route;
  final bool isSelected;
  final VoidCallback onTap;
  final VoidCallback onStartRoute;

  const RouteAlternativeCard({
    super.key,
    required this.route,
    required this.isSelected,
    required this.onTap,
    required this.onStartRoute,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isSelected ? 4 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? Colors.blue : Colors.transparent,
          width: 2,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getRouteTypeColor().withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _getRouteTypeIcon(),
                          size: 16,
                          color: _getRouteTypeColor(),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          route.typeDisplayName,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: _getRouteTypeColor(),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  if (isSelected)
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.blue,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check,
                        size: 16,
                        color: Colors.white,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.place,
                      label: 'Places',
                      value: '${route.places.length}',
                      color: Colors.blue,
                    ),
                  ),
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.directions_walk,
                      label: 'Distance',
                      value: route.distanceDisplay,
                      color: Colors.green,
                    ),
                  ),
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.schedule,
                      label: 'Duration',
                      value: route.durationDisplay,
                      color: Colors.orange,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                _getRouteDescription(),
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onTap,
                      icon: const Icon(Icons.visibility, size: 16),
                      label: const Text('View Details'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.blue,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onStartRoute,
                      icon: const Icon(Icons.navigation, size: 16),
                      label: const Text('Start Route'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _getRouteTypeColor(),
                        foregroundColor: Colors.white,
                      ),
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

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Color _getRouteTypeColor() {
    switch (route.type) {
      case RouteType.shortest:
        return Colors.green;
      case RouteType.fastest:
        return Colors.blue;
      case RouteType.scenic:
        return Colors.purple;
      case RouteType.custom:
        return Colors.orange;
    }
  }

  IconData _getRouteTypeIcon() {
    switch (route.type) {
      case RouteType.shortest:
        return Icons.straighten;
      case RouteType.fastest:
        return Icons.speed;
      case RouteType.scenic:
        return Icons.landscape;
      case RouteType.custom:
        return Icons.tune;
    }
  }

  String _getRouteDescription() {
    switch (route.type) {
      case RouteType.shortest:
        return 'Minimizes walking distance between places. Best for energy conservation.';
      case RouteType.fastest:
        return 'Optimized for time efficiency considering traffic and crowds.';
      case RouteType.scenic:
        return 'Prioritizes highly-rated places and scenic routes for best experience.';
      case RouteType.custom:
        return 'Customized route based on your specific preferences.';
    }
  }
}