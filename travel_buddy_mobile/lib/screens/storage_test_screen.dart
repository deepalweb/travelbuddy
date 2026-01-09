import 'package:flutter/material.dart';
import '../services/storage_service.dart';
import '../models/trip.dart';

class StorageTestScreen extends StatefulWidget {
  @override
  State<StorageTestScreen> createState() => _StorageTestScreenState();
}

class _StorageTestScreenState extends State<StorageTestScreen> {
  String _result = 'Tap button to test';

  Future<void> _testStorage() async {
    try {
      final storage = StorageService();
      
      // Test 1: Save itinerary
      final testItinerary = OneDayItinerary(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: 'Test Itinerary',
        introduction: 'Test intro',
        dailyPlan: [
          ActivityDetail(
            timeOfDay: '10:00',
            activityTitle: 'Test Activity',
            description: 'Test description',
            duration: '1 hr',
          ),
        ],
        conclusion: 'Test conclusion',
      );
      
      await storage.saveItinerary(testItinerary);
      print('✅ Saved test itinerary: ${testItinerary.id}');
      
      // Test 2: Load itineraries
      final loaded = await storage.getItineraries();
      print('📦 Loaded ${loaded.length} itineraries');
      
      // Test 3: Verify
      final found = loaded.any((i) => i.id == testItinerary.id);
      
      setState(() {
        _result = 'Saved: ✅\nLoaded: ${loaded.length}\nFound: ${found ? "✅" : "❌"}';
      });
      
    } catch (e) {
      setState(() {
        _result = 'Error: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Storage Test')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_result, textAlign: TextAlign.center, style: TextStyle(fontSize: 18)),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _testStorage,
              child: Text('Test Storage'),
            ),
          ],
        ),
      ),
    );
  }
}
