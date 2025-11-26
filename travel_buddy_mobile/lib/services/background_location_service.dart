import 'dart:async';
import 'dart:ui';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_background_service_android/flutter_background_service_android.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class BackgroundLocationService {
  static final service = FlutterBackgroundService();

  static Future<void> initialize() async {
    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false,
        isForegroundMode: true,
        notificationChannelId: 'travel_buddy_navigation',
        initialNotificationTitle: 'Travel Buddy Navigation',
        initialNotificationContent: 'Tracking your route...',
        foregroundServiceNotificationId: 888,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
    );
  }

  @pragma('vm:entry-point')
  static void onStart(ServiceInstance service) async {
    DartPluginRegistrant.ensureInitialized();

    if (service is AndroidServiceInstance) {
      service.on('stopService').listen((event) {
        service.stopSelf();
      });
    }

    Timer.periodic(const Duration(seconds: 10), (timer) async {
      if (service is AndroidServiceInstance) {
        if (await service.isForegroundService()) {
          try {
            final position = await Geolocator.getCurrentPosition();
            
            // Save position to SharedPreferences
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('last_position', json.encode({
              'latitude': position.latitude,
              'longitude': position.longitude,
              'timestamp': position.timestamp.toIso8601String(),
            }));

            // Check if reached any stop
            final stopsJson = prefs.getString('route_stops');
            if (stopsJson != null) {
              final stops = json.decode(stopsJson) as List;
              final currentStopIndex = prefs.getInt('current_stop_index') ?? 0;
              
              if (currentStopIndex < stops.length) {
                final stop = stops[currentStopIndex];
                final distance = Geolocator.distanceBetween(
                  position.latitude,
                  position.longitude,
                  stop['latitude'],
                  stop['longitude'],
                );

                if (distance < 50) {
                  // Reached stop
                  await prefs.setInt('current_stop_index', currentStopIndex + 1);
                  
                  service.invoke('update', {
                    'current_position': {
                      'latitude': position.latitude,
                      'longitude': position.longitude,
                    },
                    'reached_stop': currentStopIndex,
                    'stop_name': stop['name'],
                  });

                  // Update notification
                  if (currentStopIndex + 1 < stops.length) {
                    final nextStop = stops[currentStopIndex + 1];
                    service.setForegroundNotificationInfo(
                      title: 'Stop ${currentStopIndex + 1}/${stops.length} reached!',
                      content: 'Next: ${nextStop['name']}',
                    );
                  } else {
                    service.setForegroundNotificationInfo(
                      title: 'Navigation Complete!',
                      content: 'You reached all destinations',
                    );
                    timer.cancel();
                    service.stopSelf();
                  }
                } else {
                  // Update notification with distance
                  service.setForegroundNotificationInfo(
                    title: 'Navigating to ${stop['name']}',
                    content: '${(distance / 1000).toStringAsFixed(1)} km away',
                  );
                }
              }
            }
          } catch (e) {
            print('Background location error: $e');
          }
        }
      }
    });
  }

  @pragma('vm:entry-point')
  static Future<bool> onIosBackground(ServiceInstance service) async {
    return true;
  }

  static Future<void> startTracking(List<Map<String, dynamic>> stops) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('route_stops', json.encode(stops));
    await prefs.setInt('current_stop_index', 0);
    
    await service.startService();
  }

  static Future<void> stopTracking() async {
    service.invoke('stopService');
  }

  static Stream<Map<String, dynamic>?> get onUpdate {
    return service.on('update').map((event) => event as Map<String, dynamic>?);
  }
}
