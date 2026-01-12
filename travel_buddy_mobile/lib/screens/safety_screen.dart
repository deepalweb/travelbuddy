import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/safety_info.dart';
import '../models/enhanced_safety_models.dart';
import '../services/safety_service.dart';
import '../services/enhanced_safety_service.dart';
import '../providers/app_provider.dart';
import '../widgets/panic_button.dart';
import '../widgets/safety/safety_dashboard_widget.dart';
import '../widgets/safety/ai_safety_advisor_widget.dart';
import '../widgets/safety/nearby_services_map_widget.dart';
import '../widgets/safety/smart_emergency_directory_widget.dart';
import '../widgets/safety/enhanced_panic_button.dart';

class SafetyScreen extends StatefulWidget {
  const SafetyScreen({super.key});

  @override
  State<SafetyScreen> createState() => _SafetyScreenState();
}

class _SafetyScreenState extends State<SafetyScreen> {
  final SafetyService _safetyService = SafetyService();
  final EnhancedSafetyService _enhancedService = EnhancedSafetyService();
  SafetyInfo? _safetyInfo;
  List<EmergencyService> _emergencyServices = [];
  List<EmergencyContact> _emergencyContacts = [];
  Map<String, dynamic>? _aiSafetyContent;
  SafetyDashboardStatus? _dashboardStatus;
  List<SafetyAlert> _safetyAlerts = [];
  Map<String, String> _emergencyDirectory = {};
  List<EmergencyPhrase> _emergencyPhrases = [];
  bool _isLoading = true;
  bool _silentSOSEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadSafetyData();
  }

  Future<void> _loadSafetyData() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location != null) {
      // Load all safety data in parallel
      final results = await Future.wait([
        _safetyService.getSafetyInfo(location.latitude, location.longitude),
        _safetyService.getNearbyEmergencyServices(
          latitude: location.latitude,
          longitude: location.longitude,
        ),
        _safetyService.getEmergencyContacts(),
        _safetyService.generateSafetyContent(
          latitude: location.latitude,
          longitude: location.longitude,
          location: 'Current Location',
        ),
        _enhancedService.getSmartEmergencyDirectory(
          latitude: location.latitude,
          longitude: location.longitude,
        ),
        _enhancedService.getSafetyAlerts(
          latitude: location.latitude,
          longitude: location.longitude,
        ),
        _enhancedService.getEmergencyPhrases(),
      ]);
      
      setState(() {
        _safetyInfo = results[0] as SafetyInfo?;
        _emergencyServices = results[1] as List<EmergencyService>;
        _emergencyContacts = results[2] as List<EmergencyContact>;
        _aiSafetyContent = results[3] as Map<String, dynamic>?;
        _emergencyDirectory = results[4] as Map<String, String>;
        _safetyAlerts = results[5] as List<SafetyAlert>;
        _emergencyPhrases = results[6] as List<EmergencyPhrase>;
        
        // Build dashboard status
        _dashboardStatus = SafetyDashboardStatus(
          currentRiskLevel: _calculateRiskLevel(),
          currentLocation: _safetyInfo?.city ?? 'Current Location',
          isOnline: true,
          locationEnabled: true,
          emergencyContactsCount: _emergencyContacts.length,
          lastUpdated: DateTime.now(),
        );
        
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  SafetyRiskLevel _calculateRiskLevel() {
    if (_safetyAlerts.isEmpty) return SafetyRiskLevel.safe;
    final highRiskAlerts = _safetyAlerts.where((a) => a.severity == 'high').length;
    if (highRiskAlerts > 0) return SafetyRiskLevel.high;
    if (_safetyAlerts.length > 3) return SafetyRiskLevel.medium;
    return SafetyRiskLevel.low;
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
        boxShadow: [
          BoxShadow(
            color: Colors.red.withOpacity(0.3),
            blurRadius: 12,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '🚨 Emergency SOS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      _silentSOSEnabled ? Icons.vibration : Icons.notifications_off,
                      color: Colors.white,
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _silentSOSEnabled ? 'Silent ON' : 'Silent OFF',
                      style: const TextStyle(color: Colors.white, fontSize: 10),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const PanicButton(),
          const SizedBox(height: 16),
          const Text(
            'Long press for immediate SOS\nTap for emergency options\nShake phone 3x for silent alert',
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
                  // Enhanced Dashboard
                  if (_dashboardStatus != null) ...[
                    SafetyDashboardWidget(
                      status: _dashboardStatus!,
                      onRefresh: _loadSafetyData,
                    ),
                    const SizedBox(height: 16),
                  ],
                  
                  // Enhanced Panic Button
                  _buildEnhancedPanicSection(),
                  const SizedBox(height: 16),
                  
                  // Safety Alerts
                  if (_safetyAlerts.isNotEmpty) ...[
                    _buildSafetyAlerts(),
                    const SizedBox(height: 16),
                  ],
                  
                  // Smart Emergency Directory
                  if (_emergencyDirectory.isNotEmpty) ...[
                    _buildSmartDirectory(),
                    const SizedBox(height: 16),
                  ],
                  
                  // Emergency Numbers
                  _buildEmergencyNumbers(),
                  const SizedBox(height: 16),
                  
                  // Quick Actions with Silent SOS
                  _buildEnhancedQuickActions(),
                  const SizedBox(height: 16),
                  
                  // Nearby Services Map
                  _buildNearbyServicesMap(),
                  const SizedBox(height: 16),
                  
                  // AI Safety Tips
                  if (_aiSafetyContent != null) ...[
                    _buildAISafetyTips(),
                    const SizedBox(height: 16),
                  ],
                  
                  // Emergency Phrases
                  if (_emergencyPhrases.isNotEmpty) ...[
                    _buildEmergencyPhrases(),
                    const SizedBox(height: 16),
                  ],
                  
                  // Emergency Contacts
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
          const Text(
            'Quick Actions',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
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
        ],
      ),
    );
  }
  
  Widget _buildEnhancedQuickActions() {
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
            'Quick Actions',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
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
              const SizedBox(width: 8),
              Expanded(
                child: _buildActionButton(
                  'Share Live',
                  Icons.my_location,
                  Colors.blue,
                  _startLiveTracking,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildActionButton(
                  _silentSOSEnabled ? 'Silent ON' : 'Silent OFF',
                  _silentSOSEnabled ? Icons.vibration : Icons.notifications_off,
                  _silentSOSEnabled ? Colors.purple : Colors.grey,
                  _toggleSilentSOS,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildSafetyAlerts() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.1),
        border: Border.all(color: Colors.orange.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber, color: Colors.orange, size: 24),
              const SizedBox(width: 8),
              const Text(
                'Safety Alerts',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._safetyAlerts.take(3).map((alert) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Icon(
                  alert.severity == SafetyAlertSeverity.high || alert.severity == SafetyAlertSeverity.critical
                      ? Icons.error
                      : Icons.info,
                  color: alert.severity == SafetyAlertSeverity.high || alert.severity == SafetyAlertSeverity.critical
                      ? Colors.red
                      : Colors.orange,
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    alert.message,
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
  
  Widget _buildSmartDirectory() {
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
              const Icon(Icons.phone_in_talk, color: Colors.green, size: 24),
              const SizedBox(width: 8),
              const Text(
                'Emergency Directory',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_emergencyDirectory['embassy']?.isNotEmpty ?? false)
            _buildDirectoryRow('Embassy', _emergencyDirectory['embassy']!, Icons.account_balance),
          if (_emergencyDirectory['tourist_hotline']?.isNotEmpty ?? false)
            _buildDirectoryRow('Tourist Hotline', _emergencyDirectory['tourist_hotline']!, Icons.support_agent),
        ],
      ),
    );
  }
  
  Widget _buildDirectoryRow(String label, String number, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$label: $number',
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
          ),
          IconButton(
            onPressed: () => _safetyService.callEmergency(number),
            icon: const Icon(Icons.phone, color: Colors.green, size: 20),
          ),
        ],
      ),
    );
  }
  
  Widget _buildNearbyServicesMap() {
    if (_emergencyServices.isEmpty) return const SizedBox.shrink();
    
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Nearby Emergency Services',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {},
                child: const Text('Map View', style: TextStyle(color: Colors.blue)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._emergencyServices.take(5).map((service) => _buildServiceTile(service)),
        ],
      ),
    );
  }
  
  Widget _buildEmergencyPhrases() {
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
              const Icon(Icons.translate, color: Colors.blue, size: 24),
              const SizedBox(width: 8),
              const Text(
                'Emergency Phrases',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._emergencyPhrases.take(3).map((phrase) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  phrase.english,
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                Text(
                  '${phrase.local} (${phrase.pronunciation})',
                  style: const TextStyle(color: Colors.blue, fontSize: 13),
                ),
              ],
            ),
          )),
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
  
  Future<void> _startLiveTracking() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location != null && _emergencyContacts.isNotEmpty) {
      await _enhancedService.startLiveLocationSharing(
        tripName: 'Emergency Tracking',
        contactIds: _emergencyContacts.map((c) => c.id).toList(),
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Live location sharing started'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add emergency contacts first')),
      );
    }
  }
  
  void _toggleSilentSOS() {
    setState(() {
      _silentSOSEnabled = !_silentSOSEnabled;
    });
    
    if (_silentSOSEnabled) {
      _enhancedService.enableSilentSOS();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Silent SOS enabled - Shake phone 3x to trigger'),
          backgroundColor: Colors.purple,
        ),
      );
    } else {
      _enhancedService.disableSilentSOS();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silent SOS disabled')),
      );
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