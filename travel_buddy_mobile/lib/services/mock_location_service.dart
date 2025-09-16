import 'package:geolocator/geolocator.dart';

class MockLocationService {
  // Mock location: San Francisco, CA
  static const double mockLatitude = 37.7749;
  static const double mockLongitude = -122.4194;

  static Position getMockPosition() {
    return Position(
      latitude: mockLatitude,
      longitude: mockLongitude,
      timestamp: DateTime.now(),
      accuracy: 5.0,
      altitude: 0.0,
      altitudeAccuracy: 0.0,
      heading: 0.0,
      headingAccuracy: 0.0,
      speed: 0.0,
      speedAccuracy: 0.0,
    );
  }
}