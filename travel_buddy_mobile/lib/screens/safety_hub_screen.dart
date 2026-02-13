import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import '../providers/app_provider.dart';
import '../providers/language_provider.dart';
import '../config/environment.dart';

class SafetyHubScreen extends StatefulWidget {
  const SafetyHubScreen({super.key});

  @override
  State<SafetyHubScreen> createState() => _SafetyHubScreenState();
}

class _SafetyHubScreenState extends State<SafetyHubScreen> {
  bool _walkWithMeActive = false;
  Timer? _locationTimer;
  int _updateCount = 0;

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          backgroundColor: Colors.white,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            title: Text(context.watch<LanguageProvider>().tr('safety_hub'), style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w600)),
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
                      Text(context.watch<LanguageProvider>().tr('quick_actions'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      _buildQuickAction(Icons.share_location, context.watch<LanguageProvider>().tr('share_location'), 'Send to family/friends', () => _shareLocation(appProvider)),
                      _buildQuickAction(Icons.account_balance, context.watch<LanguageProvider>().tr('embassy_help'), 'Contact your embassy', () => _showEmbassyHelp(appProvider)),
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
                  FutureBuilder<Map<String, dynamic>>(
                    future: _getNearestPoliceData(appProvider),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return _buildActionCard('2. Finding Nearest Station...', 'Searching nearby', Icons.location_on, Colors.grey, () {});
                      }
                      final data = snapshot.data;
                      return _buildActionCard(
                        '2. Nearest Police Station', 
                        data?['result'] ?? 'Tap to see nearby stations', 
                        Icons.location_on, 
                        Colors.orange, 
                        () => _showPoliceList(data?['places'] ?? [])
                      );
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
                  FutureBuilder<Map<String, dynamic>>(
                    future: _getNearestSafePlaceData(appProvider),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return _buildActionCard('Find Safe Place', 'Searching nearby...', Icons.shield, Colors.grey, () {});
                      }
                      final data = snapshot.data;
                      return _buildActionCard(
                        'Find Safe Place', 
                        data?['result'] ?? 'Tap to see safe places', 
                        Icons.shield, 
                        Colors.purple, 
                        () => _showSafePlacesList(data?['places'] ?? [])
                      );
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
    print('🏥 Starting hospital search...');
    
    if (appProvider.currentLocation == null) {
      print('❌ No location available');
      return {'result': 'Enable location to find hospitals', 'places': []};
    }
    
    try {
      final lat = appProvider.currentLocation!.latitude;
      final lng = appProvider.currentLocation!.longitude;
      print('📍 Location: $lat, $lng');
      print('🌐 Calling: ${Environment.backendUrl}/api/ai/find-nearby');
      
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
      
      print('📡 Response status: ${response.statusCode}');
      print('📦 Response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Got ${data['places']?.length ?? 0} hospitals');
        return {
          'result': data['result'] ?? 'Tap to see nearby hospitals',
          'places': data['places'] ?? []
        };
      }
    } catch (e) {
      print('❌ Error finding hospital: $e');
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
                        onPressed: () async {
                          final address = place['address'] ?? place['name'] ?? '';
                          final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(address)}');
                          if (await canLaunchUrl(url)) {
                            await launchUrl(url, mode: LaunchMode.externalApplication);
                          }
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

  Future<Map<String, dynamic>> _getNearestPoliceData(AppProvider appProvider) async {
    if (appProvider.currentLocation == null) {
      return {'result': 'Enable location to find stations', 'places': []};
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
          'type': 'police',
          'query': 'Find the nearest police station. Include name and distance.'
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'result': data['result'] ?? 'Tap to see nearby stations',
          'places': data['places'] ?? []
        };
      }
    } catch (e) {
      print('Error finding police station: $e');
    }
    
    return {'result': 'Tap to see nearby stations', 'places': []};
  }
  
  void _showPoliceList(List<dynamic> places) {
    if (places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No police stations found nearby'), backgroundColor: Colors.orange),
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
                color: Colors.blue.shade700,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('👮 Nearby Police Stations', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
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
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.local_police, color: Colors.blue.shade700),
                      ),
                      title: Text(place['name'] ?? 'Police Station', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(place['address'] ?? ''),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.directions, size: 14, color: Colors.blue.shade700),
                              const SizedBox(width: 4),
                              Text(place['distance'] ?? ''),
                            ],
                          ),
                        ],
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.directions, color: Colors.blue),
                        onPressed: () async {
                          final address = place['address'] ?? place['name'] ?? '';
                          final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(address)}');
                          if (await canLaunchUrl(url)) {
                            await launchUrl(url, mode: LaunchMode.externalApplication);
                          }
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

  Future<Map<String, dynamic>> _getNearestSafePlaceData(AppProvider appProvider) async {
    if (appProvider.currentLocation == null) {
      return {'result': 'Enable location to find safe places', 'places': []};
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
          'type': 'safe_place',
          'query': 'Find the nearest safe place (hotel, police station, or public building). Include name and distance.'
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'result': data['result'] ?? 'Tap to see safe places',
          'places': data['places'] ?? []
        };
      }
    } catch (e) {
      print('Error finding safe place: $e');
    }
    
    return {'result': 'Tap to see safe places', 'places': []};
  }
  
  void _showSafePlacesList(List<dynamic> places) {
    if (places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No safe places found nearby'), backgroundColor: Colors.orange),
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
                color: Colors.purple.shade600,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('🛡️ Nearby Safe Places', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
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
                          color: Colors.purple.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.shield, color: Colors.purple.shade700),
                      ),
                      title: Text(place['name'] ?? 'Safe Place', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(place['address'] ?? ''),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Icon(Icons.directions, size: 14, color: Colors.purple.shade700),
                              const SizedBox(width: 4),
                              Text(place['distance'] ?? ''),
                            ],
                          ),
                        ],
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.directions, color: Colors.purple),
                        onPressed: () async {
                          final address = place['address'] ?? place['name'] ?? '';
                          final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(address)}');
                          if (await canLaunchUrl(url)) {
                            await launchUrl(url, mode: LaunchMode.externalApplication);
                          }
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

  void _shareLocation(AppProvider appProvider) async {
    if (appProvider.currentLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Location not available'), backgroundColor: Colors.red),
      );
      return;
    }
    
    final lat = appProvider.currentLocation!.latitude;
    final lng = appProvider.currentLocation!.longitude;
    final locationUrl = 'https://maps.google.com/?q=$lat,$lng';
    final message = '🚨 EMERGENCY - I need help!\n\nMy location: $locationUrl\n\nTime: ${DateTime.now().toString().split('.')[0]}';
    
    try {
      // Try WhatsApp first
      final whatsappUrl = Uri.parse('whatsapp://send?text=${Uri.encodeComponent(message)}');
      if (await canLaunchUrl(whatsappUrl)) {
        await launchUrl(whatsappUrl);
        return;
      }
      
      // Fallback to SMS
      final smsUrl = Uri.parse('sms:?body=${Uri.encodeComponent(message)}');
      if (await canLaunchUrl(smsUrl)) {
        await launchUrl(smsUrl);
        return;
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('📍 Location copied. Share manually'), backgroundColor: Colors.orange),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Failed to share location'), backgroundColor: Colors.red),
      );
    }
  }

  void _toggleWalkWithMe() {
    setState(() {
      _walkWithMeActive = !_walkWithMeActive;
    });
    
    if (_walkWithMeActive) {
      _startLocationTracking();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✓ Walk With Me activated. Sharing location every 2 minutes.'), backgroundColor: Colors.green),
      );
    } else {
      _stopLocationTracking();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Walk With Me deactivated.'), backgroundColor: Colors.grey),
      );
    }
  }
  
  void _startLocationTracking() {
    _updateCount = 0;
    _shareLocationUpdate();
    _locationTimer = Timer.periodic(const Duration(minutes: 2), (timer) {
      _shareLocationUpdate();
    });
  }
  
  void _stopLocationTracking() {
    _locationTimer?.cancel();
    _locationTimer = null;
    _updateCount = 0;
  }
  
  void _shareLocationUpdate() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    if (appProvider.currentLocation == null) return;
    
    _updateCount++;
    final lat = appProvider.currentLocation!.latitude;
    final lng = appProvider.currentLocation!.longitude;
    final locationUrl = 'https://maps.google.com/?q=$lat,$lng';
    final message = '📍 Walk With Me Update #$_updateCount\n\nCurrent location: $locationUrl\n\nTime: ${DateTime.now().toString().split('.')[0]}';
    
    try {
      final whatsappUrl = Uri.parse('whatsapp://send?text=${Uri.encodeComponent(message)}');
      if (await canLaunchUrl(whatsappUrl)) {
        await launchUrl(whatsappUrl);
      }
    } catch (e) {
      // Silent fail
    }
  }
  
  @override
  void dispose() {
    _stopLocationTracking();
    super.dispose();
  }

  void _broadcastSafe(AppProvider appProvider) async {
    if (appProvider.currentLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Location not available'), backgroundColor: Colors.red),
      );
      return;
    }
    
    final lat = appProvider.currentLocation!.latitude;
    final lng = appProvider.currentLocation!.longitude;
    final locationUrl = 'https://maps.google.com/?q=$lat,$lng';
    final message = '✅ I\'M SAFE\n\nI\'m okay and safe now.\n\nMy location: $locationUrl\n\nTime: ${DateTime.now().toString().split('.')[0]}';
    
    try {
      final whatsappUrl = Uri.parse('whatsapp://send?text=${Uri.encodeComponent(message)}');
      if (await canLaunchUrl(whatsappUrl)) {
        await launchUrl(whatsappUrl);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✓ "I\'m Safe" message ready to send'), backgroundColor: Colors.green, duration: Duration(seconds: 2)),
        );
        return;
      }
      
      final smsUrl = Uri.parse('sms:?body=${Uri.encodeComponent(message)}');
      if (await canLaunchUrl(smsUrl)) {
        await launchUrl(smsUrl);
        return;
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Failed to send message'), backgroundColor: Colors.red),
      );
    }
  }

  void _showEmbassyHelp(AppProvider appProvider) async {
    final nationality = appProvider.currentUser?.nationality;
    
    // Detect current country from GPS
    String? currentCountry;
    if (appProvider.currentLocation != null) {
      currentCountry = await _detectCountry(
        appProvider.currentLocation!.latitude,
        appProvider.currentLocation!.longitude,
      );
    }
    
    final embassyData = _getEmbassyData(nationality, currentCountry ?? 'LK');
    
    if (!mounted) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('🏛️ ${embassyData['title']}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(embassyData['name']!, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('📞 ${embassyData['phone']}'),
            Text('⏰ ${embassyData['hours']}'),
            const SizedBox(height: 12),
            const Text('After-hours emergencies:', style: TextStyle(fontWeight: FontWeight.bold)),
            Text('📞 ${embassyData['emergency']}'),
            const SizedBox(height: 12),
            Text('Services:\n${embassyData['services']}', style: const TextStyle(fontSize: 13)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
          ElevatedButton(onPressed: () => _makeCall(embassyData['phoneRaw']!), child: const Text('Call Now')),
        ],
      ),
    );
  }
  
  Future<String> _detectCountry(double lat, double lng) async {
    try {
      final response = await http.get(
        Uri.parse('https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lng&format=json'),
        headers: {'User-Agent': 'TravelBuddy/1.0'},
      ).timeout(const Duration(seconds: 5));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final countryCode = data['address']?['country_code']?.toString().toUpperCase();
        print('📍 Detected country: $countryCode');
        return countryCode ?? 'LK';
      }
    } catch (e) {
      print('❌ Country detection failed: $e');
    }
    return 'LK';
  }
  
  Map<String, String> _getEmbassyData(String? nationality, String currentCountry) {
    final key = '${nationality ?? 'US'}_$currentCountry';
    
    final embassies = {
      // Sri Lanka embassies
      'US_LK': {'title': 'U.S. Embassy', 'name': 'U.S. Embassy - Colombo', 'phone': '+94 11 249 8500', 'phoneRaw': '+94112498500', 'hours': 'Open: 8:00 AM - 4:30 PM', 'emergency': '+94 11 249 8500 → Press 0', 'services': '• Lost passport replacement\n• Emergency funds\n• Legal assistance\n• Medical referrals'},
      'UK_LK': {'title': 'British High Commission', 'name': 'British High Commission - Colombo', 'phone': '+94 11 539 0639', 'phoneRaw': '+94115390639', 'hours': 'Open: 8:30 AM - 4:30 PM', 'emergency': '+94 11 539 0639', 'services': '• Emergency travel documents\n• Consular assistance\n• Legal support'},
      'CA_LK': {'title': 'Canadian High Commission', 'name': 'Canadian High Commission - Colombo', 'phone': '+94 11 522 6232', 'phoneRaw': '+94115226232', 'hours': 'Open: 8:00 AM - 4:00 PM', 'emergency': '+94 11 522 6232', 'services': '• Passport services\n• Emergency assistance\n• Consular support'},
      'AU_LK': {'title': 'Australian High Commission', 'name': 'Australian High Commission - Colombo', 'phone': '+94 11 246 3200', 'phoneRaw': '+94112463200', 'hours': 'Open: 8:30 AM - 4:30 PM', 'emergency': '+94 11 246 3200', 'services': '• Passport replacement\n• Emergency assistance\n• Consular services'},
      'IN_LK': {'title': 'Indian High Commission', 'name': 'Indian High Commission - Colombo', 'phone': '+94 11 242 1605', 'phoneRaw': '+94112421605', 'hours': 'Open: 9:00 AM - 5:30 PM', 'emergency': '+94 11 242 1605', 'services': '• Passport services\n• Emergency assistance\n• Consular support'},
      
      // Thailand embassies
      'US_TH': {'title': 'U.S. Embassy', 'name': 'U.S. Embassy - Bangkok', 'phone': '+66 2 205 4000', 'phoneRaw': '+6622054000', 'hours': 'Open: 7:30 AM - 4:30 PM', 'emergency': '+66 2 205 4000', 'services': '• Passport services\n• Emergency assistance\n• Consular support'},
      'UK_TH': {'title': 'British Embassy', 'name': 'British Embassy - Bangkok', 'phone': '+66 2 305 8333', 'phoneRaw': '+6623058333', 'hours': 'Open: 8:00 AM - 4:30 PM', 'emergency': '+66 2 305 8333', 'services': '• Emergency travel documents\n• Consular assistance'},
      'AU_TH': {'title': 'Australian Embassy', 'name': 'Australian Embassy - Bangkok', 'phone': '+66 2 344 6300', 'phoneRaw': '+6623446300', 'hours': 'Open: 8:00 AM - 4:30 PM', 'emergency': '+66 2 344 6300', 'services': '• Passport services\n• Emergency assistance'},
      
      // Japan embassies
      'US_JP': {'title': 'U.S. Embassy', 'name': 'U.S. Embassy - Tokyo', 'phone': '+81 3 3224 5000', 'phoneRaw': '+81332245000', 'hours': 'Open: 8:30 AM - 5:30 PM', 'emergency': '+81 3 3224 5000', 'services': '• Passport services\n• Emergency assistance\n• Consular support'},
      'UK_JP': {'title': 'British Embassy', 'name': 'British Embassy - Tokyo', 'phone': '+81 3 5211 1100', 'phoneRaw': '+81352111100', 'hours': 'Open: 9:00 AM - 5:00 PM', 'emergency': '+81 3 5211 1100', 'services': '• Emergency travel documents\n• Consular assistance'},
      'AU_JP': {'title': 'Australian Embassy', 'name': 'Australian Embassy - Tokyo', 'phone': '+81 3 5232 4111', 'phoneRaw': '+81352324111', 'hours': 'Open: 9:00 AM - 5:00 PM', 'emergency': '+81 3 5232 4111', 'services': '• Passport services\n• Emergency assistance'},
      
      // Singapore embassies
      'US_SG': {'title': 'U.S. Embassy', 'name': 'U.S. Embassy - Singapore', 'phone': '+65 6476 9100', 'phoneRaw': '+6564769100', 'hours': 'Open: 8:30 AM - 5:30 PM', 'emergency': '+65 6476 9100', 'services': '• Passport services\n• Emergency assistance\n• Consular support'},
      'UK_SG': {'title': 'British High Commission', 'name': 'British High Commission - Singapore', 'phone': '+65 6424 4200', 'phoneRaw': '+6564244200', 'hours': 'Open: 8:30 AM - 5:00 PM', 'emergency': '+65 6424 4200', 'services': '• Emergency travel documents\n• Consular assistance'},
      'AU_SG': {'title': 'Australian High Commission', 'name': 'Australian High Commission - Singapore', 'phone': '+65 6836 4100', 'phoneRaw': '+6568364100', 'hours': 'Open: 8:30 AM - 5:00 PM', 'emergency': '+65 6836 4100', 'services': '• Passport services\n• Emergency assistance'},
      
      // India embassies
      'US_IN': {'title': 'U.S. Embassy', 'name': 'U.S. Embassy - New Delhi', 'phone': '+91 11 2419 8000', 'phoneRaw': '+911124198000', 'hours': 'Open: 8:30 AM - 5:30 PM', 'emergency': '+91 11 2419 8000', 'services': '• Passport services\n• Emergency assistance\n• Consular support'},
      'UK_IN': {'title': 'British High Commission', 'name': 'British High Commission - New Delhi', 'phone': '+91 11 2419 2100', 'phoneRaw': '+911124192100', 'hours': 'Open: 9:00 AM - 5:30 PM', 'emergency': '+91 11 2419 2100', 'services': '• Emergency travel documents\n• Consular assistance'},
      'AU_IN': {'title': 'Australian High Commission', 'name': 'Australian High Commission - New Delhi', 'phone': '+91 11 4139 9900', 'phoneRaw': '+911141399900', 'hours': 'Open: 8:30 AM - 5:00 PM', 'emergency': '+91 11 4139 9900', 'services': '• Passport services\n• Emergency assistance'},
      
      // UAE embassies
      'US_AE': {'title': 'U.S. Embassy', 'name': 'U.S. Embassy - Abu Dhabi', 'phone': '+971 2 414 2200', 'phoneRaw': '+97124142200', 'hours': 'Open: 8:00 AM - 4:30 PM', 'emergency': '+971 2 414 2200', 'services': '• Passport services\n• Emergency assistance\n• Consular support'},
      'UK_AE': {'title': 'British Embassy', 'name': 'British Embassy - Abu Dhabi', 'phone': '+971 2 610 1100', 'phoneRaw': '+97126101100', 'hours': 'Open: 7:30 AM - 2:30 PM', 'emergency': '+971 2 610 1100', 'services': '• Emergency travel documents\n• Consular assistance'},
      'AU_AE': {'title': 'Australian Embassy', 'name': 'Australian Embassy - Abu Dhabi', 'phone': '+971 2 401 7500', 'phoneRaw': '+97124017500', 'hours': 'Open: 8:00 AM - 4:00 PM', 'emergency': '+971 2 401 7500', 'services': '• Passport services\n• Emergency assistance'},
    };
    
    return embassies[key] ?? embassies['${nationality ?? 'US'}_LK'] ?? embassies['US_LK']!;
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
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('📱 Phone Lost/Stolen'),
        content: const SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Do this NOW:', style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 12),
              Text('1️⃣ Lock your device remotely\n• iPhone: iCloud.com/find\n• Android: android.com/find'),
              SizedBox(height: 12),
              Text('2️⃣ Report to police\nGet police report\n📞 119'),
              SizedBox(height: 12),
              Text('3️⃣ Contact your carrier\nBlock SIM card\nPrevent unauthorized charges'),
              SizedBox(height: 12),
              Text('4️⃣ Change passwords\nEmail, banking, social media'),
              SizedBox(height: 16),
              Text('💡 If you have a backup phone, log into Find My Device immediately.', style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
  }

  void _showMedicalGuide(AppProvider appProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🏥 Medical Emergency Guide'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Emergency Numbers:', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('🚑 Ambulance: 1990 (Free)'),
              const SizedBox(height: 4),
              const Text('🏥 Hospital: 110'),
              const SizedBox(height: 16),
              const Text('English-Speaking Hospitals:', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('• Asiri Hospital\n📞 +94 11 452 4400'),
              const SizedBox(height: 4),
              const Text('• Nawaloka Hospital\n📞 +94 11 554 4444'),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  _handleMedicalEmergency(appProvider);
                },
                icon: const Icon(Icons.search),
                label: const Text('Find Nearest Hospital'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
  }

  void _showScamDatabase(AppProvider appProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🚨 Common Scams in Sri Lanka'),
        content: const SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('⚠️ Taxi/Tuk-Tuk Scams', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('• Broken meter → Use PickMe/Uber\n• Detours → Use Google Maps\n• Overcharging → Agree price first'),
              SizedBox(height: 12),
              Text('⚠️ Gem Scams', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('• "Special deal" gems → Always fake\n• "Export for profit" → Never works\n• Avoid gem shops with touts'),
              SizedBox(height: 12),
              Text('⚠️ Temple Scams', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('• Forced donations → Politely refuse\n• "Special blessing" fees → Not real\n• Shoe storage fees → Should be free'),
              SizedBox(height: 12),
              Text('⚠️ Beach Scams', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('• Jet ski damage claims → Take photos\n• Massage overcharging → Agree price first\n• "Free" tours → Always have hidden costs'),
              SizedBox(height: 16),
              Text('💡 General Rule: If it sounds too good to be true, it is.', style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.red)),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
        ],
      ),
    );
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
