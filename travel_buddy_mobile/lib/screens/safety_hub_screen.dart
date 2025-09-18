import 'package:flutter/material.dart';
import '../constants/app_constants.dart';

class SafetyHubScreen extends StatefulWidget {
  const SafetyHubScreen({super.key});

  @override
  State<SafetyHubScreen> createState() => _SafetyHubScreenState();
}

class _SafetyHubScreenState extends State<SafetyHubScreen> with TickerProviderStateMixin {
  int _selectedTabIndex = 0;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Sticky Header
          Container(
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 16,
              left: 16,
              right: 16,
              bottom: 16,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                const Text(
                  'Safety Hub',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => _showSettings(),
                  icon: const Icon(Icons.settings),
                ),
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: IndexedStack(
              index: _selectedTabIndex,
              children: [
                _buildSafetyHubTab(),
                _buildEmergencyAssistantTab(),
                _buildNearbyServicesTab(),
                _buildSettingsTab(),
              ],
            ),
          ),
          
          // Bottom Navigation
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: BottomNavigationBar(
              type: BottomNavigationBarType.fixed,
              currentIndex: _selectedTabIndex,
              onTap: (index) => setState(() => _selectedTabIndex = index),
              selectedItemColor: Color(AppConstants.colors['primary']!),
              unselectedItemColor: Colors.grey,
              elevation: 0,
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.security), label: 'Safety Hub'),
                BottomNavigationBarItem(icon: Icon(Icons.support_agent), label: 'Assistant'),
                BottomNavigationBarItem(icon: Icon(Icons.local_hospital), label: 'Services'),
                BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyHubTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Emergency Call Button
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              return Transform.scale(
                scale: 1.0 + (_pulseController.value * 0.05),
                child: Container(
                  width: double.infinity,
                  height: 80,
                  margin: const EdgeInsets.only(bottom: 24),
                  child: ElevatedButton(
                    onPressed: () => _makeEmergencyCall(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.call, size: 32),
                        SizedBox(width: 12),
                        Text('EMERGENCY CALL', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),

          // I'm Safe Button
          Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 24),
            child: ElevatedButton.icon(
              onPressed: () => _sendSafetyStatus(),
              icon: const Icon(Icons.check_circle, color: Colors.green),
              label: const Text("I'm Safe"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green[50],
                foregroundColor: Colors.green[700],
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.green[200]!),
                ),
              ),
            ),
          ),

          // Safety Alerts
          _buildSafetyAlerts(),
          
          const SizedBox(height: 16),
          
          // Safety Tips
          _buildSafetyTips(),
          
          const SizedBox(height: 16),
          
          // Quick Services Preview
          _buildQuickServicesPreview(),
        ],
      ),
    );
  }

  Widget _buildSafetyAlerts() {
    final alerts = [
      {
        'type': 'Caution',
        'title': 'Protest Activity',
        'description': 'Avoid downtown area between 2-6 PM today',
        'color': Colors.orange,
        'icon': Icons.warning,
      },
      {
        'type': 'Weather',
        'title': 'Heavy Rain Warning',
        'description': 'Flooding possible in coastal areas',
        'color': Colors.blue,
        'icon': Icons.cloud,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Safety Alerts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        ...alerts.map((alert) => Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: (alert['color'] as Color).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: (alert['color'] as Color).withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: alert['color'] as Color,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(alert['icon'] as IconData, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: alert['color'] as Color,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            alert['type'] as String,
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(alert['title'] as String, style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(alert['description'] as String, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildSafetyTips() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.shield, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              const Text('Safe Travels', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          const Text('✅ You\'re in a safe area with good connectivity'),
          const Text('✅ Emergency services are 2 minutes away'),
          const Text('✅ Weather conditions are favorable'),
        ],
      ),
    );
  }

  Widget _buildQuickServicesPreview() {
    final services = [
      {'name': 'Police Station', 'icon': Icons.local_police, 'distance': '0.5 km'},
      {'name': 'Hospital', 'icon': Icons.local_hospital, 'distance': '1.2 km'},
      {'name': 'Fire Station', 'icon': Icons.fire_truck, 'distance': '0.8 km'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Nearby Services', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            TextButton(
              onPressed: () => setState(() => _selectedTabIndex = 2),
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 3,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1,
          children: services.map((service) => Card(
            child: InkWell(
              onTap: () => _openService(service['name'] as String),
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(service['icon'] as IconData, size: 32, color: Colors.red),
                    const SizedBox(height: 8),
                    Text(service['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12), textAlign: TextAlign.center),
                    Text(service['distance'] as String, style: TextStyle(color: Colors.grey[600], fontSize: 10)),
                  ],
                ),
              ),
            ),
          )).toList(),
        ),
      ],
    );
  }

  Widget _buildEmergencyAssistantTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // ICE Contacts
          const Text('Emergency Contacts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildICEContact('John Doe', '+1 234 567 8900', 'Primary Contact'),
          _buildICEContact('Jane Smith', '+1 234 567 8901', 'Secondary Contact'),
          
          const SizedBox(height: 24),
          
          // Panic Button
          SizedBox(
            width: double.infinity,
            height: 100,
            child: ElevatedButton(
              onPressed: () => _activatePanicMode(),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[700],
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.warning, size: 32),
                  Text('PANIC BUTTON', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('Hold for 3 seconds', style: TextStyle(fontSize: 12)),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Share Location
          ElevatedButton.icon(
            onPressed: () => _shareLocation(),
            icon: const Icon(Icons.share_location),
            label: const Text('Share My Location'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 50),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNearbyServicesTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Map Preview
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.map, size: 48, color: Colors.grey),
                  Text('Interactive Map', style: TextStyle(color: Colors.grey)),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Services List
          _buildServicesList(),
        ],
      ),
    );
  }

  Widget _buildSettingsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildSettingsTile('Emergency Contacts', Icons.contacts, () {}),
          _buildSettingsTile('Location Sharing', Icons.location_on, () {}),
          _buildSettingsTile('Alert Preferences', Icons.notifications, () {}),
          _buildSettingsTile('Offline Mode', Icons.offline_bolt, () {}),
          _buildSettingsTile('Safety Checklist', Icons.checklist, () {}),
        ],
      ),
    );
  }

  Widget _buildICEContact(String name, String phone, String type) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: const CircleAvatar(child: Icon(Icons.person)),
        title: Text(name),
        subtitle: Text('$phone • $type'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(onPressed: () => _callContact(phone), icon: const Icon(Icons.call)),
            IconButton(onPressed: () => _messageContact(phone), icon: const Icon(Icons.message)),
          ],
        ),
      ),
    );
  }

  Widget _buildServicesList() {
    final services = [
      {'name': 'Central Police Station', 'address': '123 Main St', 'phone': '+1 234 567 8900', 'distance': '0.5 km'},
      {'name': 'City General Hospital', 'address': '456 Health Ave', 'phone': '+1 234 567 8901', 'distance': '1.2 km'},
      {'name': 'Fire Department Station 1', 'address': '789 Safety Blvd', 'phone': '+1 234 567 8902', 'distance': '0.8 km'},
    ];

    return Column(
      children: services.map((service) => Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: ListTile(
          leading: const Icon(Icons.location_on, color: Colors.red),
          title: Text(service['name']!),
          subtitle: Text('${service['address']} • ${service['distance']}'),
          trailing: IconButton(
            onPressed: () => _callService(service['phone']!),
            icon: const Icon(Icons.call),
          ),
        ),
      )).toList(),
    );
  }

  Widget _buildSettingsTile(String title, IconData icon, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }

  void _showSettings() {
    setState(() => _selectedTabIndex = 3);
  }

  void _makeEmergencyCall() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Emergency Call'),
        content: const Text('Calling emergency services (911)...'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Call')),
        ],
      ),
    );
  }

  void _sendSafetyStatus() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Safety status sent to emergency contacts')),
    );
  }

  void _openService(String serviceName) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Opening $serviceName...')),
    );
  }

  void _activatePanicMode() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Panic Mode Activated'),
        content: const Text('Emergency contacts notified and location shared.'),
        actions: [
          ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
        ],
      ),
    );
  }

  void _shareLocation() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Location shared with emergency contacts')),
    );
  }

  void _callContact(String phone) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Calling $phone...')),
    );
  }

  void _messageContact(String phone) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Messaging $phone...')),
    );
  }

  void _callService(String phone) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Calling $phone...')),
    );
  }
}