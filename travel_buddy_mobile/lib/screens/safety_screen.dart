import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../models/safety_info.dart';
import '../models/enhanced_safety_models.dart';
import '../services/safety_service.dart';
import '../services/enhanced_safety_service.dart';
import '../providers/app_provider.dart';
import '../widgets/safety/enhanced_panic_button.dart';

import '../widgets/safety/smart_emergency_directory_widget.dart';
import '../widgets/safety/nearby_services_map_widget.dart';
import '../widgets/safety/safety_dashboard_widget.dart';

class SafetyScreen extends StatefulWidget {
  const SafetyScreen({super.key});

  @override
  State<SafetyScreen> createState() => _SafetyScreenState();
}

class _SafetyScreenState extends State<SafetyScreen> {
  final SafetyService _safetyService = SafetyService();
  final EnhancedSafetyService _enhancedSafetyService = EnhancedSafetyService();
  SafetyInfo? _safetyInfo;
  List<EmergencyService> _emergencyServices = [];
  List<EmergencyContact> _emergencyContacts = [];
  Map<String, dynamic>? _aiSafetyContent;
  SafetyDashboardStatus? _dashboardStatus;
  List<SafetyAlert> _safetyAlerts = [];
  bool _isLoading = true;
  bool _offlineModeEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadSafetyData();
  }

  Future<void> _loadSafetyData() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location != null) {
      // Get real connectivity status
      final connectivity = await Connectivity().checkConnectivity();
      final isOnline = connectivity != ConnectivityResult.none;
      
      // Get real location permission status
      final locationPermission = await Geolocator.checkPermission();
      final locationEnabled = locationPermission == LocationPermission.always || 
                            locationPermission == LocationPermission.whileInUse;
      
      // Get real address from coordinates
      String currentLocationName = 'Unknown Location';
      try {
        final placemarks = await placemarkFromCoordinates(
          location.latitude, 
          location.longitude
        );
        if (placemarks.isNotEmpty) {
          final place = placemarks.first;
          currentLocationName = '${place.locality ?? ''}, ${place.country ?? ''}'.trim().replaceAll(RegExp(r'^,\s*|,\s*$'), '');
        }
      } catch (e) {
        print('Geocoding error: $e');
      }
      
      // Load real safety data
      final safetyInfo = await _safetyService.getSafetyInfo(
        location.latitude,
        location.longitude,
      );
      
      final emergencyServices = await _safetyService.getNearbyEmergencyServices(
        latitude: location.latitude,
        longitude: location.longitude,
      );
      
      final emergencyContacts = await _safetyService.getEmergencyContacts();
      
      // Load real enhanced safety data
      final trustedContacts = await _enhancedSafetyService.getTrustedContacts();
      final safetyAlerts = await _enhancedSafetyService.getSafetyAlerts(
        latitude: location.latitude,
        longitude: location.longitude,
      );
      
      // Create dashboard status with real data
      final dashboardStatus = SafetyDashboardStatus(
        isOnline: isOnline,
        locationEnabled: locationEnabled,
        emergencyContactsCount: trustedContacts.length,
        currentRiskLevel: _calculateRiskLevel(safetyAlerts),
        currentLocation: currentLocationName,
        lastUpdated: DateTime.now(),
      );
      
      setState(() {
        _safetyInfo = safetyInfo;
        _emergencyServices = emergencyServices;
        _emergencyContacts = emergencyContacts;
        _aiSafetyContent = null; // Remove AI content for now
        _dashboardStatus = dashboardStatus;
        _safetyAlerts = safetyAlerts;
        _isLoading = false;
      });
    } else {
      // No location available - create offline status
      final connectivity = await Connectivity().checkConnectivity();
      final isOnline = connectivity != ConnectivityResult.none;
      
      final dashboardStatus = SafetyDashboardStatus(
        isOnline: isOnline,
        locationEnabled: false,
        emergencyContactsCount: 0,
        currentRiskLevel: SafetyRiskLevel.medium,
        currentLocation: 'Location unavailable',
        lastUpdated: DateTime.now(),
      );
      
      setState(() {
        _dashboardStatus = dashboardStatus;
        _isLoading = false;
      });
    }
  }
  
  SafetyRiskLevel _calculateRiskLevel(List<SafetyAlert> alerts) {
    if (alerts.isEmpty) return SafetyRiskLevel.safe;
    
    final criticalAlerts = alerts.where((a) => a.severity == SafetyAlertSeverity.critical).length;
    final highAlerts = alerts.where((a) => a.severity == SafetyAlertSeverity.high).length;
    
    if (criticalAlerts > 0) return SafetyRiskLevel.critical;
    if (highAlerts > 0) return SafetyRiskLevel.high;
    if (alerts.length > 3) return SafetyRiskLevel.medium;
    if (alerts.length > 0) return SafetyRiskLevel.low;
    
    return SafetyRiskLevel.safe;
  }

  Widget _buildEnhancedPanicSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red.shade900, Colors.red.shade700],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Text(
                '🚨 Smart Emergency SOS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _offlineModeEnabled ? Colors.orange : Colors.green,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _offlineModeEnabled ? Icons.offline_bolt : Icons.online_prediction,
                      color: Colors.white,
                      size: 12,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _offlineModeEnabled ? 'Offline' : 'Online',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const EnhancedPanicButton(),
          const SizedBox(height: 16),
          const Text(
            'Hold for 3 seconds: Instant SOS\nTap: Emergency options\nShake 3x: Silent alert',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white70,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF111714),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111714),
        title: const Text('Safety Center', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Safety Dashboard
                  if (_dashboardStatus != null) ...[
                    SafetyDashboardWidget(
                      status: _dashboardStatus!,
                      onRefresh: _loadSafetyData,
                    ),
                    const SizedBox(height: 24),
                  ],
                  
                  // Enhanced Panic Button
                  _buildEnhancedPanicSection(),
                  const SizedBox(height: 24),
                  

                  
                  // Smart Emergency Directory
                  Consumer<AppProvider>(
                    builder: (context, appProvider, child) {
                      return SmartEmergencyDirectoryWidget(
                        latitude: appProvider.currentLocation?.latitude,
                        longitude: appProvider.currentLocation?.longitude,
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  // Nearby Services Map
                  Consumer<AppProvider>(
                    builder: (context, appProvider, child) {
                      return NearbyServicesMapWidget(
                        latitude: appProvider.currentLocation?.latitude,
                        longitude: appProvider.currentLocation?.longitude,
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  
                  // Safety Alerts Feed
                  if (_safetyAlerts.isNotEmpty) ...[
                    _buildSafetyAlertsFeed(),
                    const SizedBox(height: 24),
                  ],
                  
                  // Quick Actions
                  _buildQuickActions(),
                  const SizedBox(height: 24),
                  

                  _buildEmergencyContacts(),
                ],
              ),
            ),
    );
  }

  Widget _buildEmergencyNumbers() {
    if (_safetyInfo == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.emergency, color: Colors.red, size: 24),
              const SizedBox(width: 8),
              Text(
                'Emergency Numbers - ${_safetyInfo!.country}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildEmergencyNumberRow('Emergency', _safetyInfo!.emergencyNumber, Icons.emergency),
          _buildEmergencyNumberRow('Police', _safetyInfo!.policeNumber, Icons.local_police),
          _buildEmergencyNumberRow('Ambulance', _safetyInfo!.ambulanceNumber, Icons.local_hospital),
          _buildEmergencyNumberRow('Fire', _safetyInfo!.fireNumber, Icons.local_fire_department),
        ],
      ),
    );
  }

  Widget _buildEmergencyNumberRow(String label, String number, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, color: Colors.red, size: 20),
          const SizedBox(width: 8),
          Text(
            '$label: $number',
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
          const Spacer(),
          IconButton(
            onPressed: () => _safetyService.callEmergency(number),
            icon: const Icon(Icons.phone, color: Colors.green),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF29382F),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Quick Actions',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Switch(
                value: _offlineModeEnabled,
                onChanged: (value) {
                  setState(() => _offlineModeEnabled = value);
                  if (value) {
                    _enhancedSafetyService.enableOfflineMode();
                  }
                },
                activeThumbColor: Colors.orange,
              ),
              const Text(
                'Offline',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  'Send Alert',
                  Icons.warning,
                  Colors.orange,
                  _sendEmergencyAlert,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionButton(
                  'Share Location',
                  Icons.share_location,
                  Colors.blue,
                  _shareLocation,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  'Live Tracking',
                  Icons.my_location,
                  Colors.green,
                  _startLiveTracking,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionButton(
                  'Translation',
                  Icons.translate,
                  Colors.purple,
                  _openTranslation,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onPressed) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, color: Colors.white),
      label: Text(label, style: const TextStyle(color: Colors.white)),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        padding: const EdgeInsets.symmetric(vertical: 12),
      ),
    );
  }

  Widget _buildNearbyServices() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF29382F),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Nearby Emergency Services',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          if (_emergencyServices.isEmpty)
            const Text(
              'No nearby services found',
              style: TextStyle(color: Colors.grey),
            )
          else
            ..._emergencyServices.map((service) => _buildServiceTile(service)),
        ],
      ),
    );
  }

  Widget _buildServiceTile(EmergencyService service) {
    IconData icon;
    Color color;
    
    switch (service.type) {
      case 'police':
        icon = Icons.local_police;
        color = Colors.blue;
        break;
      case 'hospital':
        icon = Icons.local_hospital;
        color = Colors.red;
        break;
      case 'pharmacy':
        icon = Icons.local_pharmacy;
        color = Colors.green;
        break;
      default:
        icon = Icons.location_on;
        color = Colors.grey;
    }

    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(service.name, style: const TextStyle(color: Colors.white)),
      subtitle: Text(
        '${service.address} • ${service.distance.toStringAsFixed(1)}km',
        style: const TextStyle(color: Colors.grey),
      ),
      trailing: IconButton(
        onPressed: () => _safetyService.callEmergency(service.phone),
        icon: const Icon(Icons.phone, color: Colors.green),
      ),
    );
  }

  Widget _buildEmergencyContacts() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF29382F),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Emergency Contacts',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: _addEmergencyContact,
                icon: const Icon(Icons.add, color: Colors.green),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_emergencyContacts.isEmpty)
            const Text(
              'No emergency contacts added',
              style: TextStyle(color: Colors.grey),
            )
          else
            ..._emergencyContacts.map((contact) => _buildContactTile(contact)),
        ],
      ),
    );
  }

  Widget _buildContactTile(EmergencyContact contact) {
    return ListTile(
      leading: const Icon(Icons.person, color: Colors.white),
      title: Text(contact.name, style: const TextStyle(color: Colors.white)),
      subtitle: Text(
        '${contact.relationship} • ${contact.phone}',
        style: const TextStyle(color: Colors.grey),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            onPressed: () => _safetyService.callEmergency(contact.phone),
            icon: const Icon(Icons.phone, color: Colors.green),
          ),
          IconButton(
            onPressed: () => _removeEmergencyContact(contact.id),
            icon: const Icon(Icons.delete, color: Colors.red),
          ),
        ],
      ),
    );
  }

  Future<void> _sendEmergencyAlert() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location != null && _emergencyContacts.isNotEmpty) {
      await _safetyService.sendEmergencyAlert(
        location: location,
        contacts: _emergencyContacts,
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Emergency alert sent!')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add emergency contacts first')),
      );
    }
  }

  Future<void> _shareLocation() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location != null) {
      await _safetyService.shareLocation(location);
    }
  }

  void _addEmergencyContact() {
    // Show dialog to add emergency contact
    showDialog(
      context: context,
      builder: (context) => _AddContactDialog(
        onAdd: (contact) async {
          await _safetyService.addEmergencyContact(contact);
          _loadSafetyData();
        },
      ),
    );
  }

  void _removeEmergencyContact(String contactId) async {
    await _safetyService.removeEmergencyContact(contactId);
    _loadSafetyData();
  }
  
  Widget _buildSafetyAlertsFeed() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF29382F),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.feed, color: Colors.orange, size: 20),
              const SizedBox(width: 8),
              const Text(
                'Safety Alerts',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_safetyAlerts.length}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._safetyAlerts.take(3).map((alert) => _buildAlertTile(alert)),
          if (_safetyAlerts.length > 3)
            TextButton(
              onPressed: () => _showAllAlerts(),
              child: Text(
                'View all ${_safetyAlerts.length} alerts',
                style: const TextStyle(color: Colors.blue),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildAlertTile(SafetyAlert alert) {
    Color severityColor;
    IconData severityIcon;
    
    switch (alert.severity) {
      case SafetyAlertSeverity.critical:
        severityColor = Colors.red;
        severityIcon = Icons.dangerous;
        break;
      case SafetyAlertSeverity.high:
        severityColor = Colors.orange;
        severityIcon = Icons.warning;
        break;
      case SafetyAlertSeverity.medium:
        severityColor = Colors.yellow;
        severityIcon = Icons.info;
        break;
      case SafetyAlertSeverity.low:
        severityColor = Colors.blue;
        severityIcon = Icons.info_outline;
        break;
    }
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: severityColor.withOpacity(0.1),
        border: Border.all(color: severityColor.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(severityIcon, color: severityColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  alert.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  alert.description,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Text(
            _formatAlertTime(alert.timestamp),
            style: const TextStyle(color: Colors.grey, fontSize: 10),
          ),
        ],
      ),
    );
  }
  
  String _formatAlertTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h';
    } else {
      return '${difference.inDays}d';
    }
  }
  
  void _showAllAlerts() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Opening all safety alerts...')),
    );
  }
  
  void _startLiveTracking() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF29382F),
        title: const Text('Start Live Tracking', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Share your live location with trusted contacts during your trip?',
          style: TextStyle(color: Colors.grey),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _enhancedSafetyService.startLiveLocationSharing(
                tripName: 'Current Trip',
                contactIds: [],
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Live tracking started')),
              );
            },
            child: const Text('Start'),
          ),
        ],
      ),
    );
  }
  
  void _openTranslation() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF29382F),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Emergency Phrases',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            _buildPhraseTile('Help me!', 'මට උදව් කරන්න!', 'mata udav karanna'),
            _buildPhraseTile('Where is hospital?', 'රෝහල කොහෙද?', 'rohala kohed'),
            _buildPhraseTile('Call police', 'පොලිසියට කතා කරන්න', 'polisiyata kata karanna'),
            _buildPhraseTile('I need doctor', 'මට වෛද්යවරයෙක් ඕන', 'mata vaidyavarayak ona'),
          ],
        ),
      ),
    );
  }
  
  Widget _buildPhraseTile(String english, String local, String pronunciation) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.3),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            english,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            local,
            style: const TextStyle(color: Colors.blue, fontSize: 16),
          ),
          const SizedBox(height: 2),
          Text(
            pronunciation,
            style: const TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildAISafetyTips() {
    if (_aiSafetyContent == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF29382F),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.psychology, color: Colors.blue, size: 24),
              SizedBox(width: 8),
              Text(
                'AI Safety Insights',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_aiSafetyContent!['emergencyTips'] != null)
            _buildTipSection('Emergency Tips', _aiSafetyContent!['emergencyTips'], Icons.warning, Colors.red),
          if (_aiSafetyContent!['culturalTips'] != null)
            _buildTipSection('Cultural Safety', _aiSafetyContent!['culturalTips'], Icons.public, Colors.green),
          if (_aiSafetyContent!['scamAwareness'] != null)
            _buildTipSection('Scam Awareness', _aiSafetyContent!['scamAwareness'], Icons.security, Colors.orange),
        ],
      ),
    );
  }

  Widget _buildTipSection(String title, List<dynamic> tips, IconData icon, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...tips.take(3).map((tip) => Padding(
          padding: const EdgeInsets.only(left: 28, bottom: 4),
          child: Text(
            '• $tip',
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
        )),
        const SizedBox(height: 12),
      ],
    );
  }
}

class _AddContactDialog extends StatefulWidget {
  final Function(EmergencyContact) onAdd;

  const _AddContactDialog({required this.onAdd});

  @override
  State<_AddContactDialog> createState() => _AddContactDialogState();
}

class _AddContactDialogState extends State<_AddContactDialog> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _relationshipController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF29382F),
      title: const Text('Add Emergency Contact', style: TextStyle(color: Colors.white)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameController,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              labelText: 'Name',
              labelStyle: TextStyle(color: Colors.grey),
            ),
          ),
          TextField(
            controller: _phoneController,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              labelText: 'Phone Number',
              labelStyle: TextStyle(color: Colors.grey),
            ),
          ),
          TextField(
            controller: _relationshipController,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              labelText: 'Relationship',
              labelStyle: TextStyle(color: Colors.grey),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        TextButton(
          onPressed: () {
            final contact = EmergencyContact(
              id: DateTime.now().millisecondsSinceEpoch.toString(),
              name: _nameController.text,
              phone: _phoneController.text,
              relationship: _relationshipController.text,
            );
            widget.onAdd(contact);
            Navigator.pop(context);
          },
          child: const Text('Add'),
        ),
      ],
    );
  }
}