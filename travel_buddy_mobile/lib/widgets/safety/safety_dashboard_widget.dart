import 'package:flutter/material.dart';
import '../../models/enhanced_safety_models.dart';

class SafetyDashboardWidget extends StatelessWidget {
  final SafetyDashboardStatus status;
  final VoidCallback? onRefresh;

  const SafetyDashboardWidget({
    super.key,
    required this.status,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _getRiskGradientColors(status.currentRiskLevel),
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: _getRiskColor(status.currentRiskLevel).withOpacity(0.3),
            blurRadius: 12,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with status
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _getRiskIcon(status.currentRiskLevel),
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getRiskTitle(status.currentRiskLevel),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (status.currentLocation != null)
                      Text(
                        status.currentLocation!,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
              IconButton(
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh, color: Colors.white),
                tooltip: 'Refresh status',
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Status indicators
          Row(
            children: [
              Expanded(
                child: _buildStatusIndicator(
                  'Connection',
                  status.isOnline ? 'Online' : 'Offline',
                  status.isOnline ? Icons.wifi : Icons.wifi_off,
                  status.isOnline ? Colors.green : Colors.red,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatusIndicator(
                  'Location',
                  status.locationEnabled ? 'Enabled' : 'Disabled',
                  status.locationEnabled ? Icons.location_on : Icons.location_off,
                  status.locationEnabled ? Colors.green : Colors.red,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Emergency contacts status
          _buildContactsStatus(),
          const SizedBox(height: 16),
          
          // Quick actions
          Row(
            children: [
              Expanded(
                child: _buildQuickAction(
                  'Share Location',
                  Icons.share_location,
                  Colors.blue,
                  () => _shareLocation(context),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildQuickAction(
                  'Find Help',
                  Icons.search,
                  Colors.orange,
                  () => _findHelp(context),
                ),
              ),
            ],
          ),
          
          // Last updated
          const SizedBox(height: 12),
          Text(
            'Last updated: ${_formatTime(status.lastUpdated)}',
            style: const TextStyle(
              color: Colors.white60,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusIndicator(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 10,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactsStatus() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(
            status.emergencyContactsCount > 0 ? Icons.contacts : Icons.contact_phone,
            color: status.emergencyContactsCount > 0 ? Colors.green : Colors.orange,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Emergency Contacts',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
                Text(
                  status.emergencyContactsCount > 0
                      ? '${status.emergencyContactsCount} contacts ready'
                      : 'No contacts added',
                  style: TextStyle(
                    color: status.emergencyContactsCount > 0 ? Colors.green : Colors.orange,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          if (status.emergencyContactsCount == 0)
            TextButton(
              onPressed: () {}, // Placeholder
              child: const Text(
                'Add',
                style: TextStyle(color: Colors.white, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.2),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 16),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Color> _getRiskGradientColors(SafetyRiskLevel level) {
    switch (level) {
      case SafetyRiskLevel.safe:
        return [Colors.green.shade600, Colors.green.shade800];
      case SafetyRiskLevel.low:
        return [Colors.blue.shade600, Colors.blue.shade800];
      case SafetyRiskLevel.medium:
        return [Colors.orange.shade600, Colors.orange.shade800];
      case SafetyRiskLevel.high:
        return [Colors.red.shade600, Colors.red.shade800];
      case SafetyRiskLevel.critical:
        return [Colors.red.shade800, Colors.red.shade900];
    }
  }

  Color _getRiskColor(SafetyRiskLevel level) {
    switch (level) {
      case SafetyRiskLevel.safe:
        return Colors.green;
      case SafetyRiskLevel.low:
        return Colors.blue;
      case SafetyRiskLevel.medium:
        return Colors.orange;
      case SafetyRiskLevel.high:
        return Colors.red;
      case SafetyRiskLevel.critical:
        return Colors.red.shade900;
    }
  }

  IconData _getRiskIcon(SafetyRiskLevel level) {
    switch (level) {
      case SafetyRiskLevel.safe:
        return Icons.shield;
      case SafetyRiskLevel.low:
        return Icons.info;
      case SafetyRiskLevel.medium:
        return Icons.warning;
      case SafetyRiskLevel.high:
        return Icons.error;
      case SafetyRiskLevel.critical:
        return Icons.dangerous;
    }
  }

  String _getRiskTitle(SafetyRiskLevel level) {
    switch (level) {
      case SafetyRiskLevel.safe:
        return 'You\'re Safe';
      case SafetyRiskLevel.low:
        return 'Low Risk Area';
      case SafetyRiskLevel.medium:
        return 'Medium Risk';
      case SafetyRiskLevel.high:
        return 'High Risk Area';
      case SafetyRiskLevel.critical:
        return 'Critical Alert';
    }
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }

  void _shareLocation(BuildContext context) {
    // Implementation for sharing location
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Location sharing started')),
    );
  }

  void _findHelp(BuildContext context) {
    // Implementation for finding help
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Searching for nearby help...')),
    );
  }

  void _addContacts(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Add emergency contacts')),
    );
  }
}