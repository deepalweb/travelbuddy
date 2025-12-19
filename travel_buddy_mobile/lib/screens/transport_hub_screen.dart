import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:math' as math;
import '../providers/app_provider.dart';
import '../services/transport_service.dart';

class TransportHubScreen extends StatefulWidget {
  const TransportHubScreen({super.key});

  @override
  State<TransportHubScreen> createState() => _TransportHubScreenState();
}

class _TransportHubScreenState extends State<TransportHubScreen> {
  List<TransportProvider> _providers = [];
  bool _isLoading = false;
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProviders();
    });
  }

  Future<void> _loadProviders() async {
    setState(() => _isLoading = true);
    
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final location = appProvider.currentLocation;
    
    if (location == null) {
      setState(() => _isLoading = false);
      return;
    }
    
    final providers = await TransportService.getNearbyTransport(
      location.latitude,
      location.longitude,
    );
    
    // Calculate distance
    for (var provider in providers) {
      if (provider.location?.coordinates != null && provider.location!.coordinates.length == 2) {
        provider.distance = _calculateDistance(
          location.latitude,
          location.longitude,
          provider.location!.coordinates[1],
          provider.location!.coordinates[0],
        );
      }
    }
    
    providers.sort((a, b) => (a.distance ?? 999).compareTo(b.distance ?? 999));
    
    setState(() {
      _providers = providers;
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
        title: const Text('Transport Hub'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProviders,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _buildFilterChip('All', 'all', Icons.directions_car),
          _buildFilterChip('Taxi', 'taxi', Icons.local_taxi),
          _buildFilterChip('Bus', 'bus', Icons.directions_bus),
          _buildFilterChip('Car Rental', 'rental', Icons.car_rental),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String filter, IconData icon) {
    final isSelected = _selectedFilter == filter;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Row(
          children: [
            Icon(icon, size: 16, color: isSelected ? Colors.white : Colors.grey[700]),
            const SizedBox(width: 6),
            Text(label),
          ],
        ),
        onSelected: (selected) => setState(() => _selectedFilter = filter),
        backgroundColor: Colors.grey[100],
        selectedColor: Colors.blue[600],
        labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.grey[800]),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final filtered = _getFilteredProviders();

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.directions_car_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No transport providers found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Try adjusting your filters', style: TextStyle(color: Colors.grey[600])),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (context, index) => _buildProviderCard(filtered[index]),
    );
  }

  List<TransportProvider> _getFilteredProviders() {
    if (_selectedFilter == 'all') return _providers;
    return _providers.where((p) => p.type.toLowerCase().contains(_selectedFilter)).toList();
  }

  Widget _buildProviderCard(TransportProvider provider) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(provider.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(provider.type, style: TextStyle(color: Colors.grey[600])),
                    ],
                  ),
                ),
                if (provider.distance != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on, size: 14, color: Colors.blue),
                        const SizedBox(width: 4),
                        Text('${provider.distance!.toStringAsFixed(1)}km', style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.star, color: Colors.orange, size: 16),
                const SizedBox(width: 4),
                Text('${provider.rating}', style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 8),
            Text(provider.description, style: TextStyle(color: Colors.grey[700])),
            if (provider.services.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                children: provider.services.take(3).map((service) => Chip(
                  label: Text(service, style: const TextStyle(fontSize: 11)),
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
                    onPressed: () => _makeCall(provider.phoneNumber),
                    icon: const Icon(Icons.phone, size: 18),
                    label: const Text('Call'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _sendEmail(provider.email),
                    icon: const Icon(Icons.email, size: 18),
                    label: const Text('Email'),
                  ),
                ),
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
}
