import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

class PermissionService {
  static final PermissionService _instance = PermissionService._internal();
  factory PermissionService() => _instance;
  PermissionService._internal();

  // Location Permission Methods
  Future<bool> requestLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Check if location services are enabled
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  Future<LocationPermission> getLocationPermissionStatus() async {
    return await Geolocator.checkPermission();
  }

  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  // Open app settings for manual permission grant
  Future<void> openAppSettings() async {
    await Geolocator.openAppSettings();
  }

  Future<void> openLocationSettings() async {
    await Geolocator.openLocationSettings();
  }

  // Check all required permissions
  Future<Map<String, bool>> checkAllPermissions() async {
    final Map<String, bool> permissions = {};

    // Location permission
    final locationPermission = await getLocationPermissionStatus();
    permissions['location'] = locationPermission == LocationPermission.always ||
        locationPermission == LocationPermission.whileInUse;

    // Location service
    permissions['locationService'] = await isLocationServiceEnabled();

    return permissions;
  }

  // Show permission dialog
  static Future<bool?> showPermissionDialog(
    BuildContext context, {
    required String title,
    required String message,
    String? positiveButton,
    String? negativeButton,
  }) async {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(negativeButton ?? 'Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(positiveButton ?? 'Allow'),
            ),
          ],
        );
      },
    );
  }

  // Show location permission rationale
  static Future<void> showLocationPermissionRationale(BuildContext context) async {
    await showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Location Permission Required'),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Travel Buddy needs location access to:'),
              SizedBox(height: 8),
              Text('• Find nearby places and attractions'),
              Text('• Provide personalized recommendations'),
              Text('• Show your current location on maps'),
              Text('• Enable safety and emergency features'),
              Text('• Calculate distances and directions'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Geolocator.openAppSettings();
              },
              child: const Text('Open Settings'),
            ),
          ],
        );
      },
    );
  }

  // Show location service disabled dialog
  static Future<void> showLocationServiceDialog(BuildContext context) async {
    await showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Location Service Disabled'),
          content: const Text(
            'Location services are disabled. Please enable location services in your device settings to use location-based features.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Geolocator.openLocationSettings();
              },
              child: const Text('Open Settings'),
            ),
          ],
        );
      },
    );
  }

  // Get permission status text for UI
  String getLocationPermissionStatusText(LocationPermission permission) {
    switch (permission) {
      case LocationPermission.always:
        return 'Always allowed';
      case LocationPermission.whileInUse:
        return 'While using app';
      case LocationPermission.denied:
        return 'Denied';
      case LocationPermission.deniedForever:
        return 'Permanently denied';
      case LocationPermission.unableToDetermine:
        return 'Unable to determine';
    }
  }

  // Get permission status color for UI
  Color getLocationPermissionStatusColor(LocationPermission permission) {
    switch (permission) {
      case LocationPermission.always:
      case LocationPermission.whileInUse:
        return Colors.green;
      case LocationPermission.denied:
        return Colors.orange;
      case LocationPermission.deniedForever:
        return Colors.red;
      case LocationPermission.unableToDetermine:
        return Colors.grey;
    }
  }
}