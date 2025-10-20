import 'package:flutter/material.dart';
import '../widgets/place_search_widget.dart';
import '../widgets/place_details_widget.dart';
import '../models/place_model.dart';

class PlaceSearchExample extends StatefulWidget {
  const PlaceSearchExample({Key? key}) : super(key: key);

  @override
  State<PlaceSearchExample> createState() => _PlaceSearchExampleState();
}

class _PlaceSearchExampleState extends State<PlaceSearchExample> {
  Place? _selectedPlace;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hybrid Place Search'),
        backgroundColor: Colors.blue,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Cost-effective search widget
            PlaceSearchWidget(
              hintText: 'Search restaurants, hotels, attractions...',
              onPlaceSelected: (place) {
                setState(() => _selectedPlace = place);
              },
            ),
            
            const SizedBox(height: 16),
            
            // Show cost breakdown
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Cost-Effective Search Strategy:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text('• Basic search: Azure Maps (\$0.50/1k requests)'),
                  const Text('• Reviews/ratings: Google Places (only when requested)'),
                  const Text('• Caching: Reduces repeat API calls'),
                  const Text('• Estimated savings: 80-90% vs Google-only'),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Selected place details
            if (_selectedPlace != null)
              Expanded(
                child: SingleChildScrollView(
                  child: PlaceDetailsWidget(place: _selectedPlace!),
                ),
              )
            else
              const Expanded(
                child: Center(
                  child: Text(
                    'Search for a place to see details\n\n'
                    'The system will:\n'
                    '1. Check cache first (free)\n'
                    '2. Use Azure Maps for basic info (cheap)\n'
                    '3. Add Google data only when you tap "Load Reviews"',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}