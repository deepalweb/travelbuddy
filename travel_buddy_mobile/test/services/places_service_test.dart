import 'package:flutter_test/flutter_test.dart';
import 'package:travel_buddy_mobile/services/places_service.dart';
import 'package:hive/hive.dart';
import 'dart:io';

void main() {
  group('PlacesService Tests', () {
    late PlacesService placesService;

    setUpAll(() async {
      // Initialize Hive for tests
      final tempDir = Directory.systemTemp.createTempSync('hive_test');
      Hive.init(tempDir.path);
    });

    setUp(() {
      placesService = PlacesService();
    });

    tearDownAll(() async {
      await Hive.close();
    });

    test('Should fetch maximum 20 places', () async {
      final places = await placesService.fetchPlacesPipeline(
        latitude: 40.7128,
        longitude: -74.0060,
        query: 'restaurants',
        radius: 5000,
      );

      expect(places.length, lessThanOrEqualTo(20));
      print('✅ Fetched ${places.length} places (max 20)');
    });

    test('Should use cache on second call', () async {
      final stopwatch = Stopwatch()..start();
      
      await placesService.fetchPlacesPipeline(
        latitude: 40.7128,
        longitude: -74.0060,
        query: 'museums',
        radius: 5000,
      );
      final firstCallTime = stopwatch.elapsedMilliseconds;
      
      stopwatch.reset();
      
      await placesService.fetchPlacesPipeline(
        latitude: 40.7128,
        longitude: -74.0060,
        query: 'museums',
        radius: 5000,
      );
      final secondCallTime = stopwatch.elapsedMilliseconds;

      expect(secondCallTime, lessThan(firstCallTime));
      print('✅ Cache is ${(firstCallTime / secondCallTime).toStringAsFixed(1)}x faster');
    });

    test('Should detect location change >5km', () {
      final changed = placesService.hasLocationChangedSignificantly(
        40.7128, -74.0060,
        40.6782, -73.9442,
      );

      expect(changed, isTrue);
      print('✅ Location change detected');
    });

    test('Should NOT detect location change <5km', () {
      final changed = placesService.hasLocationChangedSignificantly(
        40.7128, -74.0060,
        40.7308, -74.0060,
      );

      expect(changed, isFalse);
      print('✅ Small location change ignored');
    });
  });
}
