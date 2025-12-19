import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:math' as math;
import '../providers/app_provider.dart';
import '../services/travel_agents_service.dart';

class TravelAgentsScreen extends StatefulWidget {
  const TravelAgentsScreen({super.key});

  @override
  State<TravelAgentsScreen> createState() => _TravelAgentsScreenState();
}

class _TravelAgentsScreenState extends State<TravelAgentsScreen> {
  List<TravelAgent> _agents = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAgents();
    });
  }

  Future<void> _loadAgents() async {
    setState(() => _isLoading = true);
    
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location == null) {
      setState(() => _isLoading = false);
      return;
    }
    
    final agents = await TravelAgentsService.getNearbyAgents(
      location.latitude,
      location.longitude,
    );
    
    // Calculate distance
    for (var agent in agents) {
      if (agent.location?.coordinates != null && agent.location!.coordinates.length == 2) {
        agent.distance = _calculateDistance(
          location.latitude,
          location.longitude,
          agent.location!.coordinates[1],
          agent.location!.coordinates[0],
        );
      }
    }
    
    agents.sort((a, b) => (a.distance ?? 999).compareTo(b.distance ?? 999));
    
    setState(() {
      _agents = agents;
      _isLoading = false;
    });
  }

  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const p = 0.017453292519943295;
    final a = 0.5 - math.cos((lat2 - lat1) * p) / 2 +
        math.cos(lat1 * p) * math.cos(lat2 * p) * (1 - math.cos((lon2 - lon1) * p)) / 2;
    return 12742 * math.asin(math.sqrt(a));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Travel Agents'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAgents,
          ),
        ],
      ),
      body: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_agents.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.person_search_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No travel agents found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Check back later for nearby agents', style: TextStyle(color: Colors.grey[600])),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _agents.length,
      itemBuilder: (context, index) => _buildAgentCard(_agents[index]),
    );
  }

  Widget _buildAgentCard(TravelAgent agent) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.blue[100],
                  child: const Icon(Icons.person, size: 32, color: Colors.blue),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(agent.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.orange, size: 16),
                          const SizedBox(width: 4),
                          Text('${agent.rating}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
                if (agent.distance != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on, size: 14, color: Colors.green),
                        const SizedBox(width: 4),
                        Text('${agent.distance!.toStringAsFixed(1)}km', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(agent.description, style: TextStyle(color: Colors.grey[700])),
            if (agent.specializations.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text('Specializations:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: agent.specializations.map((spec) => Chip(
                  label: Text(spec, style: const TextStyle(fontSize: 11)),
                  backgroundColor: Colors.purple[50],
                  padding: EdgeInsets.zero,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                )).toList(),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _makeCall(agent.phoneNumber),
                    icon: const Icon(Icons.phone, size: 18),
                    label: const Text('Call'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _sendEmail(agent.email),
                    icon: const Icon(Icons.email, size: 18),
                    label: const Text('Email'),
                  ),
                ),
                if (agent.website != null) ...[
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () => _openWebsite(agent.website!),
                    icon: const Icon(Icons.language),
                    style: IconButton.styleFrom(
                      side: BorderSide(color: Colors.grey[300]!),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _makeCall(String phone) async {
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _sendEmail(String email) async {
    final uri = Uri.parse('mailto:$email');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _openWebsite(String website) async {
    final uri = Uri.parse(website.startsWith('http') ? website : 'https://$website');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
