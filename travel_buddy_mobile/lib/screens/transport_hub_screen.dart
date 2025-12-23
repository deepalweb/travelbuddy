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
  final TextEditingController _searchController = TextEditingController();
  String _currentSearchLocation = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProviders();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
      if (provider.distance == null) {
        provider.distance = _calculateDistance(
          location.latitude,
          location.longitude,
          location.latitude + (0.1 * (providers.indexOf(provider) + 1)),
          location.longitude + (0.1 * (providers.indexOf(provider) + 1)),
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
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: _currentSearchLocation.isEmpty ? 'Search location...' : 'Showing: $_currentSearchLocation',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _currentSearchLocation.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _currentSearchLocation = '');
                        _loadProviders();
                      },
                    )
                  : null,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              filled: true,
              fillColor: Colors.grey[100],
            ),
            onSubmitted: (value) => _searchLocation(value),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildFilterChip('All', 'all', Icons.directions_car),
                _buildFilterChip('Taxi', 'taxi', Icons.local_taxi),
                _buildFilterChip('Bus', 'bus', Icons.directions_bus),
                _buildFilterChip('Car Rental', 'rental', Icons.car_rental),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _searchLocation(String location) {
    if (location.trim().isEmpty) return;
    setState(() => _currentSearchLocation = location);
    _filterByLocation(location);
  }

  void _filterByLocation(String location) {
    final searchLower = location.toLowerCase();
    setState(() {
      _providers = _providers.where((p) {
        return p.route.toLowerCase().contains(searchLower) ||
               p.companyName.toLowerCase().contains(searchLower) ||
               p.description.toLowerCase().contains(searchLower);
      }).toList();
    });
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
    var filtered = _providers;
    if (_selectedFilter != 'all') {
      filtered = filtered.where((p) => p.vehicleType.toLowerCase().contains(_selectedFilter)).toList();
    }
    return filtered;
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
                      Text(provider.companyName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(provider.vehicleType, style: TextStyle(color: Colors.grey[600])),
                      if (provider.route.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(provider.route, style: TextStyle(color: Colors.blue[700], fontSize: 12)),
                      ],
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
                const SizedBox(width: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.green[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('LKR ${provider.price}', style: TextStyle(color: Colors.green[700], fontWeight: FontWeight.bold)),
                ),
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
                  child: ElevatedButton.icon(
                    onPressed: () => _showProviderDetails(provider),
                    icon: const Icon(Icons.visibility, size: 18),
                    label: const Text('View'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _makeCall(provider.phone),
                    icon: const Icon(Icons.phone, size: 18),
                    label: const Text('Call'),
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

  void _showProviderDetails(TransportProvider provider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(provider.companyName, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.star, color: Colors.orange, size: 20),
                  const SizedBox(width: 4),
                  Text('${provider.rating}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.green[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text('LKR ${provider.price}', style: TextStyle(color: Colors.green[700], fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              _buildDetailRow(Icons.directions_car, 'Vehicle Type', provider.vehicleType),
              if (provider.route.isNotEmpty) _buildDetailRow(Icons.route, 'Route', provider.route),
              if (provider.distance != null) _buildDetailRow(Icons.location_on, 'Distance', '${provider.distance!.toStringAsFixed(1)} km'),
              _buildDetailRow(Icons.phone, 'Phone', provider.phone),
              _buildDetailRow(Icons.email, 'Email', provider.email),
              const SizedBox(height: 16),
              const Text('Description', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(provider.description, style: TextStyle(color: Colors.grey[700])),
              if (provider.services.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Text('Services', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: provider.services.map((service) => Chip(label: Text(service))).toList(),
                ),
              ],
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _makeCall(provider.phone);
                      },
                      icon: const Icon(Icons.phone),
                      label: const Text('Call Now'),
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _sendEmail(provider.email);
                      },
                      icon: const Icon(Icons.email),
                      label: const Text('Email'),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.all(16)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
