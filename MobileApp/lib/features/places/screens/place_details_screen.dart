import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../shared/services/places_service.dart';
import '../../../core/providers/user_provider.dart';
import '../../../core/providers/auth_provider.dart';

class PlaceDetailsScreen extends StatefulWidget {
  final String placeId;

  const PlaceDetailsScreen({super.key, required this.placeId});

  @override
  State<PlaceDetailsScreen> createState() => _PlaceDetailsScreenState();
}

class _PlaceDetailsScreenState extends State<PlaceDetailsScreen> {
  final PlacesService _placesService = PlacesService();
  Map<String, dynamic>? _placeDetails;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlaceDetails();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_placeDetails?['name'] ?? 'Place Details'),
        actions: [
          Consumer2<AuthProvider, UserProvider>(
            builder: (context, authProvider, userProvider, child) {
              if (authProvider.currentUser == null) return const SizedBox();
              
              final isFavorite = userProvider.isFavorite(widget.placeId);
              return IconButton(
                icon: Icon(
                  isFavorite ? Icons.favorite : Icons.favorite_border,
                  color: isFavorite ? Colors.red : null,
                ),
                onPressed: () => _toggleFavorite(authProvider, userProvider),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _placeDetails == null
              ? const Center(child: Text('Place not found'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_placeDetails!['photos'] != null && 
                          (_placeDetails!['photos'] as List).isNotEmpty)
                        SizedBox(
                          height: 200,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: (_placeDetails!['photos'] as List).length,
                            itemBuilder: (context, index) {
                              final photo = (_placeDetails!['photos'] as List)[index];
                              return Container(
                                margin: const EdgeInsets.only(right: 8),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    _placesService.getPhotoUrl(
                                      photo['photo_reference'],
                                      width: 300,
                                    ),
                                    width: 300,
                                    height: 200,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      const SizedBox(height: 16),
                      Text(
                        _placeDetails!['name'] ?? 'Unknown Place',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 8),
                      if (_placeDetails!['formatted_address'] != null)
                        Row(
                          children: [
                            const Icon(Icons.location_on, size: 16),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(_placeDetails!['formatted_address']),
                            ),
                          ],
                        ),
                      const SizedBox(height: 16),
                      if (_placeDetails!['formatted_phone_number'] != null)
                        _buildInfoRow(
                          Icons.phone,
                          'Phone',
                          _placeDetails!['formatted_phone_number'],
                        ),
                      if (_placeDetails!['website'] != null)
                        _buildInfoRow(
                          Icons.web,
                          'Website',
                          _placeDetails!['website'],
                        ),
                      if (_placeDetails!['opening_hours'] != null)
                        _buildOpeningHours(),
                      if (_placeDetails!['editorial_summary'] != null)
                        _buildEditorialSummary(),
                    ],
                  ),
                ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16),
          const SizedBox(width: 8),
          Text('$label: '),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _buildOpeningHours() {
    final openingHours = _placeDetails!['opening_hours'];
    if (openingHours == null) return const SizedBox();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Opening Hours',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            if (openingHours['weekday_text'] != null)
              ...((openingHours['weekday_text'] as List).map(
                (day) => Text(day.toString()),
              )),
          ],
        ),
      ),
    );
  }

  Widget _buildEditorialSummary() {
    final summary = _placeDetails!['editorial_summary'];
    if (summary == null || summary['overview'] == null) return const SizedBox();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'About',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(summary['overview']),
          ],
        ),
      ),
    );
  }

  Future<void> _loadPlaceDetails() async {
    try {
      final details = await _placesService.getPlaceDetails(widget.placeId);
      setState(() {
        _placeDetails = details;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading place details: $e')),
        );
      }
    }
  }

  Future<void> _toggleFavorite(AuthProvider authProvider, UserProvider userProvider) async {
    final userId = authProvider.currentUser!.id;
    final isFavorite = userProvider.isFavorite(widget.placeId);

    final success = isFavorite
        ? await userProvider.removeFavorite(userId, widget.placeId)
        : await userProvider.addFavorite(userId, widget.placeId);

    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update favorites')),
      );
    }
  }
}