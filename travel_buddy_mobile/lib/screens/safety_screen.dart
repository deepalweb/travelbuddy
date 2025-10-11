import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/safety_info.dart';
import '../services/safety_service.dart';
import '../providers/app_provider.dart';
import '../widgets/panic_button.dart';

class SafetyScreen extends StatefulWidget {
  const SafetyScreen({super.key});

  @override
  State<SafetyScreen> createState() => _SafetyScreenState();
}

class _SafetyScreenState extends State<SafetyScreen> {
  final SafetyService _safetyService = SafetyService();
  SafetyInfo? _safetyInfo;
  List<EmergencyService> _emergencyServices = [];
  List<EmergencyContact> _emergencyContacts = [];
  Map<String, dynamic>? _aiSafetyContent;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSafetyData();
  }

  Future<void> _loadSafetyData() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location != null) {
      final safetyInfo = await _safetyService.getSafetyInfo(
        location.latitude,
        location.longitude,
      );
      
      final emergencyServices = await _safetyService.getNearbyEmergencyServices(
        latitude: location.latitude,
        longitude: location.longitude,
      );
      
      final emergencyContacts = await _safetyService.getEmergencyContacts();
      
      // Generate AI safety content
      final aiContent = await _safetyService.generateSafetyContent(
        latitude: location.latitude,
        longitude: location.longitude,
        location: 'Current Location',
      );
      
      setState(() {
        _safetyInfo = safetyInfo;
        _emergencyServices = emergencyServices;
        _emergencyContacts = emergencyContacts;
        _aiSafetyContent = aiContent;
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _buildPanicSection() {
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
          const Text(
            '🚨 Emergency Panic Button',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          const PanicButton(),
          const SizedBox(height: 16),
          const Text(
            'Long press for immediate SOS\nTap for emergency options',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
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
                  _buildPanicSection(),
                  const SizedBox(height: 24),
                  _buildEmergencyNumbers(),
                  const SizedBox(height: 24),
                  _buildQuickActions(),
                  const SizedBox(height: 24),
                  _buildNearbyServices(),
                  const SizedBox(height: 24),
                  if (_aiSafetyContent != null) ...[
                    _buildAISafetyTips(),
                    const SizedBox(height: 24),
                  ],
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