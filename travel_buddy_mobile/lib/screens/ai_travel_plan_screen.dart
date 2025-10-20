import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../providers/app_provider.dart';
import '../services/places_service.dart';
import '../models/place.dart';
import '../widgets/place_card.dart';
import 'place_details_screen.dart';

class AITravelPlanScreen extends StatefulWidget {
  const AITravelPlanScreen({super.key});

  @override
  State<AITravelPlanScreen> createState() => _AITravelPlanScreenState();
}

class _AITravelPlanScreenState extends State<AITravelPlanScreen> {
  Map<String, dynamic>? _travelPlan;
  bool _isLoading = false;
  String? _error;
  
  String _selectedUserType = 'Solo traveler';
  String _selectedVibe = 'Cultural';
  String _selectedLanguage = 'English';

  final List<String> _userTypes = [
    'Solo traveler',
    'Couple', 
    'Family',
    'Photographer',
    'Nature lover'
  ];

  final List<String> _vibes = [
    'Relaxing',
    'Cultural', 
    'Adventurous',
    'Food & leisure'
  ];

  final List<String> _languages = [
    'English',
    'Sinhala',
    'Tamil'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Travel Plan'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Controls
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.grey[100],
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedUserType,
                        decoration: const InputDecoration(
                          labelText: 'Traveler Type',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: _userTypes.map((type) => DropdownMenuItem(
                          value: type,
                          child: Text(type, style: const TextStyle(fontSize: 14)),
                        )).toList(),
                        onChanged: (value) => setState(() => _selectedUserType = value!),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedVibe,
                        decoration: const InputDecoration(
                          labelText: 'Vibe',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: _vibes.map((vibe) => DropdownMenuItem(
                          value: vibe,
                          child: Text(vibe, style: const TextStyle(fontSize: 14)),
                        )).toList(),
                        onChanged: (value) => setState(() => _selectedVibe = value!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedLanguage,
                        decoration: const InputDecoration(
                          labelText: 'Language',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: _languages.map((lang) => DropdownMenuItem(
                          value: lang,
                          child: Text(lang, style: const TextStyle(fontSize: 14)),
                        )).toList(),
                        onChanged: (value) => setState(() => _selectedLanguage = value!),
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      onPressed: _isLoading ? null : _generateTravelPlan,
                      icon: _isLoading 
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.auto_awesome),
                      label: Text(_isLoading ? 'Generating...' : 'Generate Plan'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[600],
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Generating your personalized travel plan...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
            const SizedBox(height: 16),
            Text('Error: $_error', textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _generateTravelPlan,
              child: const Text('Try Again'),
            ),
          ],
        ),
      );
    }

    if (_travelPlan == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text(
              'Generate AI Travel Plan',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Get personalized recommendations with detailed descriptions,\ntips, and itineraries powered by AI',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _generateTravelPlan,
              icon: const Icon(Icons.auto_awesome),
              label: const Text('Generate Plan'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Location info
          if (_travelPlan!['location'] != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.location_on, color: Colors.blue[600]),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _travelPlan!['location']['formatted_address'] ?? 'Current Location',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Full markdown content
          if (_travelPlan!['fullContent'] != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.auto_awesome, color: Colors.blue[600]),
                        const SizedBox(width: 8),
                        const Text(
                          'AI Travel Guide',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    MarkdownBody(
                      data: _travelPlan!['fullContent'],
                      styleSheet: MarkdownStyleSheet(
                        h1: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        h2: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        h3: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        p: const TextStyle(fontSize: 14, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Places grid
          if (_travelPlan!['places'] != null && (_travelPlan!['places'] as List).isNotEmpty) ...[
            Text(
              'Recommended Places',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.75,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: (_travelPlan!['places'] as List).length,
              itemBuilder: (context, index) {
                final placeData = (_travelPlan!['places'] as List)[index];
                final place = Place.fromJson(placeData);
                
                return PlaceCard(
                  place: place,
                  compact: true,
                  isFavorite: false,
                  onFavoriteToggle: () {},
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => PlaceDetailsScreen(place: place),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _generateTravelPlan() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    
    if (appProvider.currentLocation == null) {
      setState(() {
        _error = 'Location not available. Please enable location services.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _travelPlan = null;
    });

    try {
      final placesService = PlacesService();
      final travelPlan = await placesService.fetchAITravelPlan(
        latitude: appProvider.currentLocation!.latitude,
        longitude: appProvider.currentLocation!.longitude,
        userType: _selectedUserType,
        vibe: _selectedVibe,
        language: _selectedLanguage,
        radius: 10,
      );

      if (travelPlan != null) {
        setState(() {
          _travelPlan = travelPlan;
        });
      } else {
        setState(() {
          _error = 'Failed to generate travel plan. Please try again.';
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}