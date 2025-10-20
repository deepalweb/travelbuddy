import 'package:flutter/material.dart';
import '../models/route_models.dart';

class ScheduledStopCard extends StatelessWidget {
  final ScheduledStop stop;
  final bool isFirst;
  final bool isLast;

  const ScheduledStopCard({
    super.key,
    required this.stop,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          Column(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: _getStopColor(),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: Center(
                  child: Icon(
                    _getStopIcon(),
                    size: 12,
                    color: Colors.white,
                  ),
                ),
              ),
              if (!isLast)
                Container(
                  width: 2,
                  height: 60,
                  color: Colors.grey[300],
                ),
            ],
          ),
          const SizedBox(width: 16),
          // Stop details
          Expanded(
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            stop.place.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStopColor().withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _getStopTypeText(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: _getStopColor(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (stop.place.address.isNotEmpty)
                      Text(
                        stop.place.address,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildTimeInfo(
                          icon: Icons.login,
                          label: 'Arrive',
                          time: stop.arrivalTimeDisplay,
                          color: Colors.green,
                        ),
                        const SizedBox(width: 16),
                        _buildTimeInfo(
                          icon: Icons.logout,
                          label: 'Depart',
                          time: stop.departureTimeDisplay,
                          color: Colors.orange,
                        ),
                        const SizedBox(width: 16),
                        _buildTimeInfo(
                          icon: Icons.schedule,
                          label: 'Visit',
                          time: _formatDuration(stop.visitDuration),
                          color: Colors.blue,
                        ),
                      ],
                    ),
                    if (stop.travelTimeToNext.inMinutes > 0) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.directions_walk,
                              size: 16,
                              color: Colors.grey[600],
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${_formatDuration(stop.travelTimeToNext)} to next stop',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (stop.place.rating != null && stop.place.rating! > 0) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            Icons.star,
                            size: 16,
                            color: Colors.amber[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${stop.place.rating!.toStringAsFixed(1)}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (stop.place.type.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.blue[50],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                stop.place.type,
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.blue[700],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                    if (stop.notes?.isNotEmpty == true) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.yellow[50],
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.yellow[200]!),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.info_outline,
                              size: 16,
                              color: Colors.yellow[700],
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                stop.notes!,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.yellow[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeInfo({
    required IconData icon,
    required String label,
    required String time,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(height: 2),
        Text(
          time,
          style: TextStyle(
            fontSize: 12,
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

  Color _getStopColor() {
    if (isFirst) return Colors.green;
    if (isLast) return Colors.red;
    
    switch (stop.place.type.toLowerCase()) {
      case 'restaurant':
      case 'cafe':
        return Colors.orange;
      case 'museum':
      case 'gallery':
        return Colors.purple;
      case 'park':
      case 'garden':
        return Colors.green;
      case 'shopping':
      case 'mall':
        return Colors.pink;
      case 'temple':
      case 'church':
        return Colors.brown;
      default:
        return Colors.blue;
    }
  }

  IconData _getStopIcon() {
    if (isFirst) return Icons.play_arrow;
    if (isLast) return Icons.flag;
    
    switch (stop.place.type.toLowerCase()) {
      case 'restaurant':
      case 'cafe':
        return Icons.restaurant;
      case 'museum':
      case 'gallery':
        return Icons.museum;
      case 'park':
      case 'garden':
        return Icons.park;
      case 'shopping':
      case 'mall':
        return Icons.shopping_bag;
      case 'temple':
      case 'church':
        return Icons.place;
      default:
        return Icons.location_on;
    }
  }

  String _getStopTypeText() {
    if (isFirst) return 'START';
    if (isLast) return 'END';
    return stop.place.type.toUpperCase();
  }

  String _formatDuration(Duration duration) {
    if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes % 60}m';
    }
    return '${duration.inMinutes}m';
  }
}