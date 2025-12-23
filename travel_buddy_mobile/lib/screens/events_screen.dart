import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/event_provider.dart';
import '../models/event_model.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EventProvider>().loadEvents();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Events'),
        backgroundColor: Colors.pink[600],
        foregroundColor: Colors.white,
      ),
      body: Consumer<EventProvider>(
        builder: (context, provider, child) {
          return Column(
            children: [
              _buildFilters(provider),
              Expanded(
                child: provider.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : provider.filteredEvents.isEmpty
                        ? _buildEmptyState()
                        : _buildEventsList(provider.filteredEvents),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilters(EventProvider provider) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.pink[50],
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildFilterChip(
                  'Category',
                  provider.selectedCategory ?? 'All',
                  () => _showCategoryDialog(provider),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildFilterChip(
                  'Location',
                  provider.selectedLocation ?? 'All',
                  () => _showLocationDialog(provider),
                ),
              ),
            ],
          ),
          if (provider.selectedCategory != null || provider.selectedLocation != null)
            TextButton.icon(
              onPressed: () {
                provider.clearFilters();
                provider.loadEvents();
              },
              icon: const Icon(Icons.clear, size: 16),
              label: const Text('Clear Filters'),
            ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.pink[300]!),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$label: $value', style: TextStyle(color: Colors.pink[700], fontSize: 12)),
            Icon(Icons.arrow_drop_down, color: Colors.pink[700], size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildEventsList(List<EventModel> events) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final event = events[index];
        return _buildEventCard(event);
      },
    );
  }

  Widget _buildEventCard(EventModel event) {
    final dateFormat = DateFormat('MMM dd, yyyy');
    
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _showEventDetails(event),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                event.imageUrl.isEmpty
                    ? Container(
                        height: 180,
                        color: Colors.grey[300],
                        child: Icon(Icons.event, size: 48, color: Colors.grey[600]),
                      )
                    : _buildEventImage(event.imageUrl, 180),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getCategoryColor(event.category),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      event.category,
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                if (event.isFree)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('FREE', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.calendar_today, size: 16, color: Colors.pink[700]),
                      const SizedBox(width: 6),
                      Text(
                        dateFormat.format(event.startDate),
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.pink[700]),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: Colors.grey[700]),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          event.venue,
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.grey[700]),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (!event.isFree)
                        Text(
                          'LKR ${event.ticketPrice?.toStringAsFixed(0)}',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.pink[700]),
                        ),
                      if (event.isFree) const Spacer(),
                      Row(
                        children: [
                          ElevatedButton(
                            onPressed: () => _showEventDetails(event),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.pink[600],
                              foregroundColor: Colors.white,
                            ),
                            child: const Text('Details'),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            onPressed: () => _openDirections(event),
                            icon: const Icon(Icons.directions),
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.blue[600],
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
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
          Icon(Icons.event_busy, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text('No events found', style: TextStyle(fontSize: 18, color: Colors.grey[600])),
        ],
      ),
    );
  }

  void _showCategoryDialog(EventProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Category'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['All', 'Cultural', 'Music', 'Food', 'Arts', 'Sports', 'Religious']
              .map((cat) => ListTile(
                    title: Text(cat),
                    onTap: () {
                      provider.setCategory(cat == 'All' ? null : cat);
                      provider.loadEvents();
                      Navigator.pop(context);
                    },
                  ))
              .toList(),
        ),
      ),
    );
  }

  void _showLocationDialog(EventProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Location'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['All', 'Colombo', 'Kandy', 'Galle', 'Negombo', 'Ella']
              .map((loc) => ListTile(
                    title: Text(loc),
                    onTap: () {
                      provider.setLocation(loc == 'All' ? null : loc);
                      provider.loadEvents();
                      Navigator.pop(context);
                    },
                  ))
              .toList(),
        ),
      ),
    );
  }

  void _showEventDetails(EventModel event) {
    final dateFormat = DateFormat('EEEE, MMM dd, yyyy');
    
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
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: _buildEventImage(event.imageUrl, 200),
                ),
                const SizedBox(height: 16),
                Text(event.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getCategoryColor(event.category).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(event.category, style: TextStyle(color: _getCategoryColor(event.category), fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 16),
                _buildDetailRow(Icons.calendar_today, 'Date', dateFormat.format(event.startDate)),
                const SizedBox(height: 8),
                _buildDetailRow(Icons.location_on, 'Venue', event.venue),
                const SizedBox(height: 8),
                _buildDetailRow(Icons.place, 'Location', event.location),
                const SizedBox(height: 8),
                _buildDetailRow(Icons.person, 'Organizer', event.organizer),
                if (!event.isFree)
                  const SizedBox(height: 8),
                if (!event.isFree)
                  _buildDetailRow(Icons.attach_money, 'Price', 'LKR ${event.ticketPrice?.toStringAsFixed(0)}'),
                const SizedBox(height: 16),
                const Text('About', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(event.description, style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 16),
                if (event.tags.isNotEmpty) ...[
                  const Text('Tags', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: event.tags.map((tag) => Chip(
                      label: Text(tag),
                      backgroundColor: Colors.pink[100],
                    )).toList(),
                  ),
                  const SizedBox(height: 16),
                ],
                if (event.ticketUrl != null)
                  ElevatedButton.icon(
                    onPressed: () => _launchUrl(event.ticketUrl!),
                    icon: const Icon(Icons.confirmation_number),
                    label: const Text('Buy Tickets'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.pink[600],
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 48),
                    ),
                  ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: () => _openDirections(event),
                  icon: const Icon(Icons.directions),
                  label: const Text('Get Directions'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue[600],
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 48),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Colors.pink[700]),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              const SizedBox(height: 2),
              Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ],
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'cultural':
        return Colors.purple;
      case 'music':
        return Colors.blue;
      case 'food':
        return Colors.orange;
      case 'arts':
        return Colors.teal;
      case 'sports':
        return Colors.green;
      case 'religious':
        return Colors.amber;
      default:
        return Colors.pink;
    }
  }

  void _launchUrl(String url) async {
    final Uri uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Widget _buildEventImage(String imageUrl, double height) {
    if (imageUrl.startsWith('data:image')) {
      try {
        final base64String = imageUrl.split(',')[1];
        final bytes = base64Decode(base64String);
        return Image.memory(
          bytes,
          height: height,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              height: height,
              color: Colors.grey[300],
              child: Icon(Icons.broken_image, size: 48, color: Colors.grey[600]),
            );
          },
        );
      } catch (e) {
        return Container(
          height: height,
          color: Colors.grey[300],
          child: Icon(Icons.broken_image, size: 48, color: Colors.grey[600]),
        );
      }
    }
    return Image.network(
      imageUrl,
      height: height,
      width: double.infinity,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        return Container(
          height: height,
          color: Colors.grey[300],
          child: Icon(Icons.broken_image, size: 48, color: Colors.grey[600]),
        );
      },
    );
  }

  void _openDirections(EventModel event) async {
    final query = Uri.encodeComponent(event.venue);
    final url = 'https://www.google.com/maps/search/?api=1&query=$query';
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
