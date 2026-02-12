import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../providers/app_provider.dart';
import '../config/environment.dart';

class SafetyHubScreen extends StatefulWidget {
  const SafetyHubScreen({super.key});

  @override
  State<SafetyHubScreen> createState() => _SafetyHubScreenState();
}

class _SafetyHubScreenState extends State<SafetyHubScreen> {
  bool _walkWithMeActive = false;

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          backgroundColor: Colors.white,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            title: const Text('Safety Hub', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w600)),
            actions: [
              IconButton(
                icon: Icon(_walkWithMeActive ? Icons.shield : Icons.shield_outlined, color: _walkWithMeActive ? Colors.green : Colors.grey),
                onPressed: () => _toggleWalkWithMe(),
              ),
            ],
          ),
          body: SingleChildScrollView(
            child: Column(
              children: [
                // Calm reassurance header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  color: Colors.blue.shade50,
                  child: const Column(
                    children: [
                      Text(
                        '✓ You\'re safe. Here\'s exactly what to do.',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black87),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // 3 BIG buttons - Medical/Police/Help Me
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      _buildEmergencyButton(
                        '🚑 MEDICAL EMERGENCY',
                        'Ambulance • Hospital • Doctor',
                        Colors.red.shade600,
                        () => _handleMedicalEmergency(appProvider),
                      ),
                      const SizedBox(height: 16),
                      _buildEmergencyButton(
                        '👮 POLICE',
                        'Theft • Assault • Lost passport',
                        Colors.blue.shade700,
                        () => _handlePoliceEmergency(appProvider),
                      ),
                      const SizedBox(height: 16),
                      _buildEmergencyButton(
                        '🆘 HELP ME',
                        'I\'m scared • Lost • Need support',
                        Colors.orange.shade600,
                        () => _handleGeneralHelp(appProvider),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Quick actions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      _buildQuickAction(Icons.share_location, 'Share My Location', 'Send to family/friends', () => _shareLocation(appProvider)),
                      _buildQuickAction(Icons.account_balance, 'Embassy Help', 'Contact your embassy', () => _showEmbassyHelp(appProvider)),
                      _buildQuickAction(Icons.directions_walk, _walkWithMeActive ? 'Walk With Me (Active)' : 'Walk With Me', 'Live location tracking', () => _toggleWalkWithMe()),
                      _buildQuickAction(Icons.check_circle, 'I\'m Safe', 'Notify everyone you\'re okay', () => _broadcastSafe(appProvider)),
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Crisis guides
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Crisis Guides', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      _buildCrisisGuide('💳 Wallet Stolen', 'Step-by-step recovery', () => _showWalletStolenGuide()),
                      _buildCrisisGuide('📱 Phone Lost/Stolen', 'Lock & track your device', () => _showPhoneLostGuide()),
                      _buildCrisisGuide('🏥 Medical Emergency', 'Find English-speaking hospitals', () => _showMedicalGuide(appProvider)),
                      _buildCrisisGuide('🚨 Scam Alert', 'Common scams in your area', () => _showScamDatabase(appProvider)),
                    ],
                  ),
                ),
                
                const SizedBox(height: 40),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmergencyButton(String title, String subtitle, Color color, VoidCallback onTap) {
    return SizedBox(
      width: double.infinity,
      height: 80,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 4,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
            const SizedBox(height: 4),
            Text(subtitle, style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.9))),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction(IconData icon, String title, String subtitle, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: Colors.blue.shade700),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }

  Widget _buildCrisisGuide(String title, String subtitle, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const Icon(Icons.menu_book, color: Colors.orange),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }

  void _handleMedicalEmergency(AppProvider appProvider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.red.shade600,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('🚑 Medical Emergency', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  ),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white)),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildActionCard('1. Call Ambulance Now', '1990 (Suwa Seriya - Free)', Icons.phone, Colors.red, () => _makeCall('1990')),
                  FutureBuilder<Map<String, dynamic>>(
                    future: _getNearestHospitalData(appProvider),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return _buildActionCard('2. Finding Nearest Hospital...', 'Searching nearby', Icons.local_hospital, Colors.grey, () {});
                      }
                      final data = snapshot.data;
                      return _buildActionCard(
                        '2. Nearest Hospital', 
                        data?['result'] ?? 'Tap to see nearby hospitals', 
                        Icons.local_hospital, 
                        Colors.green, 
                        () => _showHospitalsList(data?['places'] ?? [])
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)),
                    child: const Text('💡 What to say:\n"Emergency at [your location]. I need help."\n\nStay calm. Help is coming.', style: TextStyle(fontSize: 13)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handlePoliceEmergency(AppProvider appProvider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.blue.shade700,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('👮 Police Emergency', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  ),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white)),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildActionCard('1. Call Police', '119 (Emergency Hotline)', Icons.phone, Colors.blue, () => _makeCall('119')),
                  FutureBuilder<String>(
                    future: _getNearestPoliceStation(appProvider),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return _buildActionCard('2. Finding Nearest Station...', 'Searching nearby', Icons.location_on, Colors.grey, () {});
                      }
                      return _buildActionCard('2. Nearest Station', snapshot.data ?? 'Search nearby stations', Icons.location_on, Colors.orange, () {});
                    },
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(12)),
                    child: const Text('⚠️ If ignored, ask for:\n"Station House Officer (SHO)"\n\nStay in a public place. Keep your phone charged.', style: TextStyle(fontSize: 13)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleGeneralHelp(AppProvider appProvider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.orange.shade600,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('🆘 Help & Support', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  ),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white)),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildActionCard('Share My Location', 'Send to trusted contacts', Icons.share_location, Colors.blue, () => _shareLocation(appProvider)),
                  _buildActionCard('Call My Embassy', 'Get consular assistance', Icons.account_balance, Colors.green, () => _showEmbassyHelp(appProvider)),
                  FutureBuilder<String>(
                    future: _getNearestSafePlace(appProvider),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return _buildActionCard('Find Safe Place', 'Searching nearby...', Icons.shield, Colors.grey, () {});
                      }
                      return _buildActionCard('Find Safe Place', snapshot.data ?? 'Hotels, police stations nearby', Icons.shield, Colors.purple, () {});
                    },
                  ),
                  _buildActionCard('Breathing Guide', 'Calm down in 2 minutes', Icons.self_improvement, Colors.teal, () => _showBreathingGuide()),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
                    child: const Text('✓ You\'re not alone. Help is available.\n\nStay where you are. Keep your phone charged.', style: TextStyle(fontSize: 13)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: color, size: 24),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }

  void _makeCall(String number) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: number);
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    }
  }

  Future<Map<String, dynamic>> _getNearestHospitalData(AppProvider appProvider) async {
    if (appProvider.currentLocation == null) {
      return {'result': 'Enable location to find hospitals', 'places': []};
    }
    
    try {
      final lat = appProvider.currentLocation!.latitude;
      final lng = appProvider.currentLocation!.longitude;
      
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/ai/find-nearby'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'latitude': lat,
          'longitude': lng,
          'type': 'hospital',
          'query': 'Find the nearest hospital with emergency services. Include name and distance.'
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'result': data['result'] ?? 'Tap to see nearby hospitals',
          'places': data['places'] ?? []
        };
      }
    } catch (e) {
      print('Error finding hospital: $e');
    }
    
    return {'result': 'Tap to see nearby hospitals', 'places': []};
  }
  
  void _showHospitalsList(List<dynamic> places) {
    if (places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No hospitals found nearby'), backgroundColor: Colors.orange),
      );
      return;
    }
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.green.shade600,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('🏥 Nearby Hospitals', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  ),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white)),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: places.length,
                itemBuilder: (context, index) {
                  final place = places[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.local_hospital, color: Colors.green.shade700),
                      ),
                      title: Text(place['name'] ?? 'Hospital', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(place['address'] ?? ''),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.star, size: 14, color: Colors.amber.shade700),
                              const SizedBox(width: 4),
                              Text('${place['rating'] ?? 'N/A'}'),
                              const SizedBox(width: 12),
                              Icon(Icons.directions, size: 14, color: Colors.blue.shade700),
                              const SizedBox(width: 4),
                              Text(place['distance'] ?? ''),
                            ],
                          ),
                        ],
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.directions, color: Colors.blue),
                        onPressed: () {
                          // TODO: Open in maps
                        },
                      ),
                      isThreeLine: true,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<String> _getNearestPoliceStation(AppProvider appProvider) async {
    if (appProvider.currentLocation == null) return 'Enable location to find stations';
    
    try {
      final lat = appProvider.currentLocation!.latitude;
      final lng = appProvider.currentLocation!.longitude;
      
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/ai/find-nearby'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'latitude': lat,
          'longitude': lng,
          'type': 'police',
          'query': 'Find the nearest police station. Include name and distance.'
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['result'] ?? 'Search nearby stations';
      }
    } catch (e) {
      print('Error finding police station: $e');
    }
    
    return 'Search nearby stations';
  }

  Future<String> _getNearestSafePlace(AppProvider appProvider) async {
    if (appProvider.currentLocation == null) return 'Enable location to find safe places';
    
    try {
      final lat = appProvider.currentLocation!.latitude;
      final lng = appProvider.currentLocation!.longitude;
      
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/ai/find-nearby'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'latitude': lat,
          'longitude': lng,
          'type': 'safe_place',
          'query': 'Find the nearest safe place (hotel, police station, or public building). Include name and distance.'
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['result'] ?? 'Hotels, police stations nearby';
      }
    } catch (e) {
      print('Error finding safe place: $e');
    }
    
    return 'Hotels, police stations nearby';
  }

  void _shareLocation(AppProvider appProvider) {
    // TODO: Implement SMS/WhatsApp location sharing
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('📍 Location shared with emergency contacts'), backgroundColor: Colors.green),
    );
  }

  void _toggleWalkWithMe() {
    setState(() {
      _walkWithMeActive = !_walkWithMeActive;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_walkWithMeActive ? '✓ Walk With Me activated. Location sharing started.' : 'Walk With Me deactivated.'),
        backgroundColor: _walkWithMeActive ? Colors.green : Colors.grey,
      ),
    );
  }

  void _broadcastSafe(AppProvider appProvider) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('✓ "I\'m Safe" sent to all emergency contacts'), backgroundColor: Colors.green, duration: Duration(seconds: 3)),
    );
  }

  void _showEmbassyHelp(AppProvider appProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🏛️ Embassy Assistance'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('U.S. Embassy - Colombo', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Text('📞 +94 11 249 8500'),
            Text('⏰ Open: 8:00 AM - 4:30 PM'),
            SizedBox(height: 12),
            Text('After-hours emergencies:', style: TextStyle(fontWeight: FontWeight.bold)),
            Text('📞 +94 11 249 8500 → Press 0'),
            SizedBox(height: 12),
            Text('Services:\n• Lost passport replacement\n• Emergency funds\n• Legal assistance\n• Medical referrals', style: TextStyle(fontSize: 13)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
          ElevatedButton(onPressed: () => _makeCall('+94112498500'), child: const Text('Call Now')),
        ],
      ),
    );
  }

  void _showWalletStolenGuide() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('💳 Wallet Stolen - Action Plan'),
        content: const SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Do this NOW (in order):', style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 12),
              Text('1️⃣ Call your bank\nFreeze all cards immediately\n📞 [Your bank hotline]'),
              SizedBox(height: 12),
              Text('2️⃣ Report to police\nGet a police report (needed for insurance)\n📞 119 (Police)'),
              SizedBox(height: 12),
              Text('3️⃣ Contact embassy\nIf passport was in wallet\n📞 +94 11 249 8500'),
              SizedBox(height: 12),
              Text('4️⃣ File insurance claim\nWithin 24 hours\n📄 Keep police report'),
              SizedBox(height: 16),
              Text('💡 Say this to police:\n"My wallet was stolen. I need a police report for insurance."', style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
  }

  void _showPhoneLostGuide() {
    // TODO: Implement phone lost guide
  }

  void _showMedicalGuide(AppProvider appProvider) {
    // TODO: Implement medical guide with verified hospitals
  }

  void _showScamDatabase(AppProvider appProvider) {
    // TODO: Implement scam database
  }

  void _showBreathingGuide() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🧘 Breathing Guide'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Take slow, deep breaths:', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 16),
            Text('1. Breathe in slowly for 4 seconds'),
            SizedBox(height: 8),
            Text('2. Hold for 4 seconds'),
            SizedBox(height: 8),
            Text('3. Breathe out slowly for 4 seconds'),
            SizedBox(height: 8),
            Text('4. Repeat until calm'),
            SizedBox(height: 16),
            Text('You\'re safe. This will pass.', style: TextStyle(fontStyle: FontStyle.italic, color: Colors.green)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
  }
}
