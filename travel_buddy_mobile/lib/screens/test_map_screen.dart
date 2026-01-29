import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class TestMapScreen extends StatelessWidget {
  const TestMapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Test Map')),
      body: GoogleMap(
        initialCameraPosition: const CameraPosition(
          target: LatLng(6.9271, 79.8612), // Colombo
          zoom: 12,
        ),
        markers: {
          const Marker(
            markerId: MarkerId('test'),
            position: LatLng(6.9271, 79.8612),
          ),
        },
      ),
    );
  }
}
