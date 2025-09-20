import 'package:flutter/material.dart';

class EnhancedTimeSlotWidget extends StatelessWidget {
  final Map<String, dynamic> timeSlot;
  final int index;
  final VoidCallback? onEdit;
  final VoidCallback? onRemove;

  const EnhancedTimeSlotWidget({
    super.key,
    required this.timeSlot,
    required this.index,
    this.onEdit,
    this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final type = timeSlot['type'] as String;
    
    switch (type) {
      case 'activity':
        return _buildActivitySlot(context);
      case 'transport':
        return _buildTransportSlot(context);
      case 'break':
        return _buildBreakSlot(context);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildActivitySlot(BuildContext context) {
    final activity = timeSlot['activity'] as Map<String, dynamic>;
    final startTime = timeSlot['startTime'] as String;
    final endTime = timeSlot['endTime'] as String;
    final duration = timeSlot['duration'] as int;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Time indicator
          Container(
            width: 80,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  startTime,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
                Text(
                  endTime,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                Text(
                  '${duration}m',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Timeline connector
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: _getActivityColor(activity['category']),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
              Container(
                width: 2,
                height: 60,
                color: Colors.grey[300],
              ),
            ],
          ),
          
          const SizedBox(width: 16),
          
          // Activity details
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Activity header
                  Row(
                    children: [
                      Text(
                        _getCategoryEmoji(activity['category']),
                        style: const TextStyle(fontSize: 20),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          activity['name'] as String,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      _buildPriorityBadge(activity['priority']),
                    ],
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Description
                  Text(
                    activity['description'] as String,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700],
                      height: 1.4,
                    ),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Cost and details
                  Row(
                    children: [
                      _buildDetailChip(
                        Icons.attach_money,
                        '\$${activity['cost']['usd']}',
                        Colors.green,
                      ),
                      const SizedBox(width: 8),
                      _buildDetailChip(
                        Icons.access_time,
                        '${duration}m',
                        Colors.blue,
                      ),
                      if (activity['requirements'] != 'None') ...[
                        const SizedBox(width: 8),
                        _buildDetailChip(
                          Icons.info_outline,
                          'Requirements',
                          Colors.orange,
                        ),
                      ],
                    ],
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Tips
                  if (activity['tips'] != null && (activity['tips'] as String).isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.lightbulb_outline, size: 16, color: Colors.blue[600]),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              activity['tips'] as String,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.blue[700],
                                height: 1.3,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  
                  const SizedBox(height: 8),
                  
                  // Action buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onEdit,
                          icon: const Icon(Icons.edit, size: 16),
                          label: const Text('Modify', style: TextStyle(fontSize: 12)),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: onRemove,
                          icon: const Icon(Icons.close, size: 16),
                          label: const Text('Remove', style: TextStyle(fontSize: 12)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransportSlot(BuildContext context) {
    final transport = timeSlot['transport'] as Map<String, dynamic>;
    final startTime = timeSlot['startTime'] as String;
    final duration = timeSlot['duration'] as int;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const SizedBox(width: 80),
          const SizedBox(width: 16),
          
          // Transport connector
          Column(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: Colors.grey[400],
                  shape: BoxShape.circle,
                ),
              ),
              Container(
                width: 1,
                height: 30,
                color: Colors.grey[300],
              ),
            ],
          ),
          
          const SizedBox(width: 16),
          
          // Transport details
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Row(
                children: [
                  Text(
                    transport['icon'] as String,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${transport['distance']} | ${transport['duration']} | ${transport['description']}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ),
                  if (transport['cost'] > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.green[100],
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '\$${transport['cost']}',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.green[700],
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
    );
  }

  Widget _buildBreakSlot(BuildContext context) {
    final description = timeSlot['description'] as String;
    final duration = timeSlot['duration'] as int;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const SizedBox(width: 80),
          const SizedBox(width: 16),
          
          // Break connector
          Column(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: Colors.orange[300],
                  shape: BoxShape.circle,
                ),
              ),
              Container(
                width: 1,
                height: 20,
                color: Colors.orange[200],
              ),
            ],
          ),
          
          const SizedBox(width: 16),
          
          // Break details
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.orange[50],
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.orange[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.coffee, size: 14, color: Colors.orange[600]),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '$description (${duration}m)',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.orange[700],
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriorityBadge(String priority) {
    final isCore = priority == 'core';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isCore ? Colors.red[100] : Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        isCore ? 'CORE' : 'OPTIONAL',
        style: TextStyle(
          fontSize: 8,
          fontWeight: FontWeight.bold,
          color: isCore ? Colors.red[700] : Colors.grey[600],
        ),
      ),
    );
  }

  Color _getActivityColor(String category) {
    switch (category) {
      case 'food':
        return Colors.orange;
      case 'culture':
        return Colors.purple;
      case 'nature':
        return Colors.green;
      case 'shopping':
        return Colors.blue;
      case 'nightlife':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getCategoryEmoji(String category) {
    switch (category) {
      case 'food':
        return '🍽️';
      case 'culture':
        return '🏛️';
      case 'nature':
        return '🌳';
      case 'shopping':
        return '🛍️';
      case 'nightlife':
        return '🍸';
      default:
        return '📍';
    }
  }
}