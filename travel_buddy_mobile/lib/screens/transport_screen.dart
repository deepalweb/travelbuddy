import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/transport_provider.dart';
import '../models/transport_service_model.dart';
import '../widgets/loading_spinner.dart';

class TransportScreen extends StatefulWidget {
  const TransportScreen({super.key});

  @override
  State<TransportScreen> createState() => _TransportScreenState();
}

class _TransportScreenState extends State<TransportScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _fromController = TextEditingController();
  final TextEditingController _toController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TransportProvider>().loadServices();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _fromController.dispose();
    _toController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Transport Services'),
        backgroundColor: Colors.purple[600],
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Services', icon: Icon(Icons.directions_car)),
            Tab(text: 'Bookings', icon: Icon(Icons.receipt_long)),
            Tab(text: 'Status', icon: Icon(Icons.info_outline)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildServicesTab(),
          _buildBookingsTab(),
          _buildStatusTab(),
        ],
      ),
    );
  }

  Widget _buildServicesTab() {
    return Consumer<TransportProvider>(
      builder: (context, provider, child) {
        return Column(
          children: [
            _buildSearchSection(provider),
            _buildFiltersSection(provider),
            Expanded(
              child: provider.isLoading
                  ? const Center(child: LoadingSpinner())
                  : provider.filteredServices.isEmpty
                      ? _buildEmptyState()
                      : _buildServicesList(provider),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSearchSection(TransportProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.purple[50],
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _fromController,
                  decoration: InputDecoration(
                    labelText: 'From',
                    prefixIcon: const Icon(Icons.my_location),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  onChanged: (value) => provider.setFromLocation(value),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _toController,
                  decoration: InputDecoration(
                    labelText: 'To',
                    prefixIcon: const Icon(Icons.location_on),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  onChanged: (value) => provider.setToLocation(value),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () => provider.searchServices(),
            icon: const Icon(Icons.search),
            label: const Text('Search Transport'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.purple[600],
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 48),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltersSection(TransportProvider provider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFilterChip(
              'Vehicle Type',
              provider.selectedVehicleType ?? 'All',
              () => _showVehicleTypeDialog(provider),
            ),
            const SizedBox(width: 8),
            _buildFilterChip(
              'Verified Only',
              provider.verifiedOnly ? 'Yes' : 'No',
              () => provider.setVerifiedOnly(!provider.verifiedOnly),
            ),
            const SizedBox(width: 8),
            _buildFilterChip(
              'Instant Booking',
              provider.instantBookingOnly ? 'Yes' : 'No',
              () => provider.setInstantBookingOnly(!provider.instantBookingOnly),
            ),
            const SizedBox(width: 8),
            _buildFilterChip(
              'Eco-Friendly',
              provider.ecoFriendlyOnly ? 'Yes' : 'No',
              () => provider.setEcoFriendlyOnly(!provider.ecoFriendlyOnly),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.purple[100],
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.purple[300]!),
        ),
        child: Text(
          '$label: $value',
          style: TextStyle(
            color: Colors.purple[700],
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildServicesList(TransportProvider provider) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: provider.filteredServices.length,
      itemBuilder: (context, index) {
        final service = provider.filteredServices[index];
        return _buildServiceCard(service, provider);
      },
    );
  }

  Widget _buildServiceCard(TransportServiceModel service, TransportProvider provider) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Service Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: service.isLive ? Colors.green[50] : Colors.grey[50],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _getVehicleColor(service.vehicleType),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _getVehicleIcon(service.vehicleType),
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            service.companyName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          if (service.isVerified) ...[
                            const SizedBox(width: 4),
                            const Icon(Icons.verified, color: Colors.blue, size: 16),
                          ],
                        ],
                      ),
                      Text(
                        service.route,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStatusIndicator(service),
              ],
            ),
          ),
          
          // Service Details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildDetailItem(
                        Icons.schedule,
                        'Departure',
                        service.departure,
                      ),
                    ),
                    Expanded(
                      child: _buildDetailItem(
                        Icons.timer,
                        'Duration',
                        service.duration,
                      ),
                    ),
                    Expanded(
                      child: _buildDetailItem(
                        Icons.attach_money,
                        'Price',
                        'LKR ${service.price.toStringAsFixed(0)}',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildDetailItem(
                        Icons.airline_seat_recline_normal,
                        'Available',
                        '${service.availableSeats}/${service.totalSeats}',
                      ),
                    ),
                    Expanded(
                      child: _buildDetailItem(
                        Icons.star,
                        'Rating',
                        '${service.rating} (${service.reviewCount})',
                      ),
                    ),
                    Expanded(
                      child: _buildDetailItem(
                        Icons.update,
                        'Updated',
                        service.lastUpdated,
                      ),
                    ),
                  ],
                ),
                if (service.amenities.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: service.amenities.take(4).map((amenity) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.blue[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          amenity,
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontSize: 10,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _showServiceDetails(service),
                        icon: const Icon(Icons.info_outline, size: 16),
                        label: const Text('Details'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: service.isLive && service.availableSeats > 0
                            ? () => _showBookingDialog(service, provider)
                            : null,
                        icon: const Icon(Icons.book_online, size: 16),
                        label: const Text('Book Now'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple[600],
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusIndicator(TransportServiceModel service) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: service.isLive ? Colors.green : Colors.red,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            service.isLive ? 'LIVE' : 'OFFLINE',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailItem(IconData icon, String label, String value) {
    return Column(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildBookingsTab() {
    return Consumer<TransportProvider>(
      builder: (context, provider, child) {
        if (provider.userBookings.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.receipt_long, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  'No bookings yet',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your transport bookings will appear here',
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: provider.userBookings.length,
          itemBuilder: (context, index) {
            final booking = provider.userBookings[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _getStatusColor(booking.status),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _getVehicleIcon(booking.vehicleType),
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                title: Text(booking.companyName),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(booking.route),
                    Text(
                      'Travel: ${booking.travelDate.day}/${booking.travelDate.month}/${booking.travelDate.year}',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getStatusColor(booking.status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        booking.statusDisplayText,
                        style: TextStyle(
                          color: _getStatusColor(booking.status),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'LKR ${booking.totalPrice.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                onTap: () => _showBookingDetails(booking),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildStatusTab() {
    return Consumer<TransportProvider>(
      builder: (context, provider, child) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatusCard(
                'Service Status',
                Icons.directions_car,
                Colors.blue,
                [
                  'Total Services: ${provider.services.length}',
                  'Live Services: ${provider.services.where((s) => s.isLive).length}',
                  'Verified Providers: ${provider.services.where((s) => s.isVerified).length}',
                  'AI Recommended: ${provider.services.where((s) => s.aiRecommended).length}',
                ],
              ),
              const SizedBox(height: 16),
              _buildStatusCard(
                'Booking Status',
                Icons.receipt_long,
                Colors.green,
                [
                  'Total Bookings: ${provider.userBookings.length}',
                  'Active Bookings: ${provider.activeBookings.length}',
                  'Completed: ${provider.completedBookings.length}',
                  'Cancelled: ${provider.cancelledBookings.length}',
                ],
              ),
              const SizedBox(height: 16),
              _buildStatusCard(
                'System Status',
                Icons.settings,
                Colors.orange,
                [
                  'API Status: ${provider.error == null ? "Online" : "Error"}',
                  'Last Update: ${DateTime.now().toString().substring(11, 16)}',
                  'Cache Status: Active',
                  'Location Services: Available',
                ],
              ),
              const SizedBox(height: 16),
              _buildPopularRoutesCard(provider),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusCard(String title, IconData icon, Color color, List<String> items) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...items.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  Container(
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(item),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildPopularRoutesCard(TransportProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.purple.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.trending_up, color: Colors.purple, size: 20),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Popular Routes',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (provider.popularRoutes.isEmpty)
              const Text('Loading popular routes...')
            else
              ...provider.popularRoutes.take(5).map((route) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Text(route['icon'] ?? '🚗'),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text('${route['from']} → ${route['to']}'),
                    ),
                    Text(
                      'LKR ${route['avgPrice']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
              )),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No transport services found',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Try adjusting your search criteria',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  void _showVehicleTypeDialog(TransportProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Vehicle Type'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['All', 'Car', 'Bus', 'Van', 'Ferry', 'Train', 'Tuk-tuk']
              .map((type) => ListTile(
                    title: Text(type),
                    leading: Icon(_getVehicleIcon(type)),
                    onTap: () {
                      provider.setVehicleType(type);
                      Navigator.pop(context);
                    },
                  ))
              .toList(),
        ),
      ),
    );
  }

  void _showServiceDetails(TransportServiceModel service) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            controller: scrollController,
            padding: const EdgeInsets.all(20),
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
                Text(
                  service.companyName,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  service.description,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 20),
                _buildDetailRow('Route', service.route),
                _buildDetailRow('Vehicle Type', service.vehicleType),
                _buildDetailRow('Departure', service.departure),
                _buildDetailRow('Arrival', service.arrival),
                _buildDetailRow('Duration', service.duration),
                _buildDetailRow('Price', 'LKR ${service.price.toStringAsFixed(0)}'),
                _buildDetailRow('Available Seats', '${service.availableSeats}/${service.totalSeats}'),
                _buildDetailRow('Rating', '${service.rating}/5.0 (${service.reviewCount} reviews)'),
                _buildDetailRow('Phone', service.phone),
                _buildDetailRow('Email', service.email),
                const SizedBox(height: 20),
                if (service.amenities.isNotEmpty) ...[
                  const Text(
                    'Amenities',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: service.amenities.map((amenity) => Chip(
                      label: Text(amenity),
                      backgroundColor: Colors.blue[100],
                    )).toList(),
                  ),
                  const SizedBox(height: 20),
                ],
                Row(
                  children: [
                    if (service.isVerified)
                      const Chip(
                        label: Text('Verified'),
                        backgroundColor: Colors.green,
                        labelStyle: TextStyle(color: Colors.white),
                      ),
                    if (service.instantBooking)
                      const Chip(
                        label: Text('Instant Booking'),
                        backgroundColor: Colors.blue,
                        labelStyle: TextStyle(color: Colors.white),
                      ),
                    if (service.ecoFriendly)
                      const Chip(
                        label: Text('Eco-Friendly'),
                        backgroundColor: Colors.green,
                        labelStyle: TextStyle(color: Colors.white),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }

  void _showBookingDialog(TransportServiceModel service, TransportProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Book ${service.companyName}'),
        content: const Text('Booking functionality will be implemented here.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Booking feature coming soon!'),
                  backgroundColor: Colors.blue,
                ),
              );
            },
            child: const Text('Book Now'),
          ),
        ],
      ),
    );
  }

  void _showBookingDetails(booking) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Booking #${booking.id}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Company: ${booking.companyName}'),
            Text('Route: ${booking.route}'),
            Text('Status: ${booking.statusDisplayText}'),
            Text('Amount: LKR ${booking.totalPrice.toStringAsFixed(0)}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  IconData _getVehicleIcon(String vehicleType) {
    switch (vehicleType.toLowerCase()) {
      case 'car':
        return Icons.directions_car;
      case 'bus':
        return Icons.directions_bus;
      case 'van':
        return Icons.airport_shuttle;
      case 'ferry':
        return Icons.directions_boat;
      case 'train':
        return Icons.train;
      case 'tuk-tuk':
        return Icons.motorcycle;
      default:
        return Icons.directions_car;
    }
  }

  Color _getVehicleColor(String vehicleType) {
    switch (vehicleType.toLowerCase()) {
      case 'car':
        return Colors.blue;
      case 'bus':
        return Colors.orange;
      case 'van':
        return Colors.green;
      case 'ferry':
        return Colors.cyan;
      case 'train':
        return Colors.purple;
      case 'tuk-tuk':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'confirmed':
        return Colors.green;
      case 'completed':
        return Colors.blue;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}