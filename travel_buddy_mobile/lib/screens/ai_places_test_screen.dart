import 'package:flutter/material.dart';
import '../services/ai_places_service.dart';
import '../models/place.dart';

class AIPlacesTestScreen extends StatefulWidget {
  const AIPlacesTestScreen({Key? key}) : super(key: key);

  @override
  State<AIPlacesTestScreen> createState() => _AIPlacesTestScreenState();
}

class _AIPlacesTestScreenState extends State<AIPlacesTestScreen> {
  final _aiService = AIPlacesService();
  List<Place> _places = [];
  bool _loading = false;
  String _error = '';

  Future<void> _testAIPlaces() async {
    setState(() {
      _loading = true;
      _error = '';
      _places = [];
    });

    try {
      // Test with Colombo, Sri Lanka coordinates
      final places = await _aiService.fetchAIPlaces(
        latitude: 6.9271,
        longitude: 79.8612,
        category: 'restaurants',
        limit: 10,
      );

      setState(() {
        _places = places;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Places Test'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: ElevatedButton(
              onPressed: _loading ? null : _testAIPlaces,
              child: _loading
                  ? const CircularProgressIndicator()
                  : const Text('Test AI Places'),
            ),
          ),
          if (_error.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Error: $_error', style: const TextStyle(color: Colors.red)),
            ),
          Expanded(
            child: _places.isEmpty
                ? const Center(child: Text('No places loaded'))
                : ListView.builder(
                    itemCount: _places.length,
                    itemBuilder: (context, index) {
                      final place = _places[index];
                      return ListTile(
                        title: Text(place.name),
                        subtitle: Text(place.description ?? 'No description'),
                        trailing: Text('${place.rating ?? 0}⭐'),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
