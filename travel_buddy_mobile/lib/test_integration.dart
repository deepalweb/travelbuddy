import 'package:flutter/material.dart';
import 'services/place_service.dart';

void main() {
  runApp(TestIntegrationApp());
}

class TestIntegrationApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: TestIntegrationPage(),
    );
  }
}

class TestIntegrationPage extends StatefulWidget {
  @override
  State<TestIntegrationPage> createState() => _TestIntegrationPageState();
}

class _TestIntegrationPageState extends State<TestIntegrationPage> {
  final PlaceService _placeService = PlaceService();
  String _status = 'Ready to test';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Backend Integration Test')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Text(_status),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _testSearch,
              child: Text('Test Place Search'),
            ),
          ],
        ),
      ),
    );
  }

  void _testSearch() async {
    setState(() => _status = 'Testing...');
    
    try {
      final places = await _placeService.searchPlaces('restaurants');
      setState(() => _status = 'Success! Found ${places.length} places\n'
          'First place: ${places.isNotEmpty ? places.first.name : "None"}');
    } catch (e) {
      setState(() => _status = 'Error: $e');
    }
  }
}