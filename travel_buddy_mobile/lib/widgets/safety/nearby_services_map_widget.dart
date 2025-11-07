import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/safety_info.dart';
import '../../services/enhanced_safety_service.dart';

class NearbyServicesMapWidget extends StatefulWidget {
  final double? latitude;
  final double? longitude;

  const NearbyServicesMapWidget({
    super.key,
    this.latitude,
    this.longitude,
  });

  @override
  State<NearbyServicesMapWidget> createState() => _NearbyServicesMapWidgetState();
}

class _NearbyServicesMapWidgetState extends State<NearbyServicesMapWidget> {
  final EnhancedSafetyService _safetyService = EnhancedSafetyService();
  List<EmergencyService> _services = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';
  bool _only24Hours = false;
  bool _onlyEnglishStaff = false;

  final Map<String, IconData> _serviceIcons = {
    'hospital': Icons.local_hospital,
    'police': Icons.local_police,
    'pharmacy': Icons.local_pharmacy,
    'clinic': Icons.medical_services,
    'fire': Icons.local_fire_department,
  };

  final Map<String, Color> _serviceColors = {
    'hospital': Colors.red,
    'police': Colors.blue,
    'pharmacy': Colors.green,
    'clinic': Colors.orange,
    'fire': Colors.deepOrange,
  };

  @override
  void initState() {
    super.initState();
    _loadNearbyServices();
  }

  Future<void> _loadNearbyServices() async {
    if (widget.latitude == null || widget.longitude == null) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final services = await _safetyService.getNearbyServicesWithFilters(
        latitude: widget.latitude!,
        longitude: widget.longitude!,
        only24Hours: _only24Hours,
        onlyEnglishStaff: _onlyEnglishStaff,
      );
      
      setState(() {
        _services = services;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  List<EmergencyService> get _filteredServices {
    if (_selectedFilter == 'all') return _services;
    return _services.where((service) => service.type == _selectedFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
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
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.map, color: Colors.blue, size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Nearby Safety Services',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                onPressed: _openInMaps,
                icon: const Icon(Icons.open_in_new, color: Colors.blue),
                tooltip: 'Open in Maps',
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Filters
          _buildFilters(),
          const SizedBox(height: 16),
          
          // Services list
          if (_isLoading)
            const Center(child: CircularProgressIndicator())
          else if (_filteredServices.isEmpty)
            _buildEmptyState()
          else
            _buildServicesList(),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Column(
      children: [
        // Service type filter
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip('all', 'All', Icons.all_inclusive),
              const SizedBox(width: 8),
              _buildFilterChip('hospital', 'Hospitals', Icons.local_hospital),
              const SizedBox(width: 8),
              _buildFilterChip('police', 'Police', Icons.local_police),
              const SizedBox(width: 8),
              _buildFilterChip('pharmacy', 'Pharmacy', Icons.local_pharmacy),
            ],
          ),
        ),
        const SizedBox(height: 12),
        
        // Additional filters
        Row(
          children: [
            Expanded(
              child: _buildToggleFilter(
                '24/7 Only',
                _only24Hours,
                (value) {
                  setState(() => _only24Hours = value);
                  _loadNearbyServices();
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildToggleFilter(
                'English Staff',
                _onlyEnglishStaff,
                (value) {
                  setState(() => _onlyEnglishStaff = value);
                  _loadNearbyServices();
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFilterChip(String value, String label, IconData icon) {
    final isSelected = _selectedFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedFilter = value);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue : Colors.grey.withOpacity(0.3),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 16),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleFilter(String label, bool value, Function(bool) onChanged) {
    return Row(
      children: [
        Switch(
          value: value,
          onChanged: onChanged,
          activeThumbColor: Colors.blue,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildServicesList() {
    return Column(
      children: _filteredServices.take(5).map((service) => 
        _buildServiceTile(service)
      ).toList(),
    );
  }

  Widget _buildServiceTile(EmergencyService service) {
    final icon = _serviceIcons[service.type] ?? Icons.location_on;
    final color = _serviceColors[service.type] ?? Colors.grey;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.3),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  service.address,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.location_on, color: Colors.grey, size: 12),
                    const SizedBox(width: 4),
                    Text(
                      '${service.distance.toStringAsFixed(1)}km',
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                    if (service.rating > 0) ...[
                      const SizedBox(width: 12),
                      Icon(Icons.star, color: Colors.amber, size: 12),
                      const SizedBox(width: 2),
                      Text(
                        service.rating.toStringAsFixed(1),
                        style: const TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                    ],
                    if (service.is24Hours) ...[
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.green,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          '24/7',
                          style: TextStyle(color: Colors.white, fontSize: 8),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Column(
            children: [
              IconButton(
                onPressed: () => _navigateToService(service),
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.directions, color: Colors.white, size: 16),
                ),
                tooltip: 'Navigate',
              ),
              if (service.phone.isNotEmpty)
                IconButton(
                  onPressed: () => _callService(service),
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.green,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.phone, color: Colors.white, size: 16),
                  ),
                  tooltip: 'Call',
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Icon(
            Icons.location_off,
            color: Colors.grey,
            size: 48,
          ),
          const SizedBox(height: 12),
          const Text(
            'No services found',
            style: TextStyle(color: Colors.grey, fontSize: 16),
          ),
          const SizedBox(height: 8),
          const Text(
            'Try adjusting your filters or check your location',
            style: TextStyle(color: Colors.grey, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Future<void> _navigateToService(EmergencyService service) async {
    final uri = Uri.parse(
      'https://maps.google.com/maps?daddr=${service.latitude},${service.longitude}'
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _callService(EmergencyService service) async {
    final uri = Uri.parse('tel:${service.phone}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _openInMaps() async {
    if (widget.latitude != null && widget.longitude != null) {
      final uri = Uri.parse(
        'https://maps.google.com/?q=${widget.latitude},${widget.longitude}'
      );
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }
}