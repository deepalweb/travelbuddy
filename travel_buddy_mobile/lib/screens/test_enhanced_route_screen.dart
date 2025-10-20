import 'package:flutter/material.dart';
import '../models/place.dart';
import '../screens/enhanced_route_plan_screen.dart';

class TestEnhancedRouteScreen extends StatelessWidget {
  const TestEnhancedRouteScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Test Enhanced Route'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enhanced Route Planning Test',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text(
              'This screen tests the enhanced route planning functionality with sample places.',
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _testEnhancedRoute(context),
                icon: const Icon(Icons.auto_awesome),
                label: const Text('Test Smart Route Planning'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.purple,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Sample Places:',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ..._getSamplePlaces().map((place) => Card(
              child: ListTile(
                leading: const Icon(Icons.place, color: Colors.blue),
                title: Text(place.name),
                subtitle: Text(place.address),
                trailing: Chip(
                  label: Text(place.type),
                  backgroundColor: Colors.blue.withOpacity(0.1),
                ),
              ),
            )),
          ],
        ),
      ),
    );
  }

  void _testEnhancedRoute(BuildContext context) {
    final places = _getSamplePlaces();
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EnhancedRoutePlanScreen(
          places: places,
          title: 'Test Smart Route - Sample Places',
        ),
      ),
    );
  }

  List<Place> _getSamplePlaces() {
    return [
      Place(
        id: 'test_1',
        name: 'Central Park',
        address: 'New York, NY 10024, USA',
        latitude: 40.7829,
        longitude: -73.9654,
        rating: 4.6,
        type: 'park',
        photoUrl: '',
        description: 'Large public park in Manhattan',
        localTip: 'Best visited in the morning',
        handyPhrase: '',
      ),
      Place(
        id: 'test_2',
        name: 'Times Square',
        address: 'Times Square, New York, NY 10036, USA',
        latitude: 40.7580,
        longitude: -73.9855,
        rating: 4.3,
        type: 'attraction',
        photoUrl: '',
        description: 'Famous commercial intersection',
        localTip: 'Very crowded in the evening',
        handyPhrase: '',
      ),
      Place(
        id: 'test_3',
        name: 'Statue of Liberty',
        address: 'New York, NY 10004, USA',
        latitude: 40.6892,
        longitude: -74.0445,
        rating: 4.7,
        type: 'monument',
        photoUrl: '',
        description: 'Iconic symbol of freedom',
        localTip: 'Book ferry tickets in advance',
        handyPhrase: '',
      ),
      Place(
        id: 'test_4',
        name: 'Brooklyn Bridge',
        address: 'New York, NY 10038, USA',
        latitude: 40.7061,
        longitude: -73.9969,
        rating: 4.5,
        type: 'bridge',
        photoUrl: '',
        description: 'Historic suspension bridge',
        localTip: 'Great for sunrise photos',
        handyPhrase: '',
      ),
    ];
  }
}