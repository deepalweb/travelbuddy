import 'package:geolocator/geolocator.dart';
import 'dart:async';

class BatteryOptimizationService {
  static final BatteryOptimizationService _instance = BatteryOptimizationService._internal();
  factory BatteryOptimizationService() => _instance;
  BatteryOptimizationService._internal();

  Timer? _locationTimer;
  Position? _lastKnownPosition;
  DateTime? _lastLocationUpdate;
  bool _isTracking = false;

  // Get location with battery-efficient settings
  Future<Position?> getLocationEfficient({
    bool highAccuracy = false,
  }) async {
    try {
      // Return cached location if recent (< 5 minutes)
      if (_lastKnownPosition != null && _lastLocationUpdate != null) {
        final age = DateTime.now().difference(_lastLocationUpdate!);
        if (age.inMinutes < 5) {
          print('📍 Using cached location (${age.inSeconds}s old)');
          return _lastKnownPosition;
        }
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: highAccuracy ? LocationAccuracy.medium : LocationAccuracy.low,
      );

      _lastKnownPosition = position;
      _lastLocationUpdate = DateTime.now();
      
      return position;
    } catch (e) {
      print('❌ Error getting location: $e');
      return _lastKnownPosition;
    }
  }

  // Start periodic location updates (battery-efficient)
  void startPeriodicLocationUpdates({
    required Function(Position) onLocationUpdate,
    Duration interval = const Duration(minutes: 5),
    bool highAccuracy = false,
  }) {
    if (_isTracking) {
      print('⚠️ Location tracking already active');
      return;
    }

    _isTracking = true;
    print('🔋 Starting battery-efficient location tracking (${interval.inMinutes}min interval)');

    _locationTimer = Timer.periodic(interval, (timer) async {
      final position = await getLocationEfficient(highAccuracy: highAccuracy);
      if (position != null) {
        onLocationUpdate(position);
      }
    });
  }

  // Stop location tracking
  void stopLocationTracking() {
    _locationTimer?.cancel();
    _locationTimer = null;
    _isTracking = false;
    print('🔋 Stopped location tracking');
  }

  // Check if significant movement occurred
  bool hasSignificantMovement(Position newPosition, {double thresholdMeters = 100}) {
    if (_lastKnownPosition == null) return true;

    final distance = Geolocator.distanceBetween(
      _lastKnownPosition!.latitude,
      _lastKnownPosition!.longitude,
      newPosition.latitude,
      newPosition.longitude,
    );

    return distance >= thresholdMeters;
  }

  // Get location only if moved significantly
  Future<Position?> getLocationIfMoved({double thresholdMeters = 100}) async {
    final newPosition = await getLocationEfficient();
    if (newPosition == null) return null;

    if (hasSignificantMovement(newPosition, thresholdMeters: thresholdMeters)) {
      return newPosition;
    }

    print('📍 No significant movement, using cached location');
    return _lastKnownPosition;
  }

  Position? get lastKnownPosition => _lastKnownPosition;
  bool get isTracking => _isTracking;

  void dispose() {
    stopLocationTracking();
  }
}
