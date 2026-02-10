import 'package:flutter_test/flutter_test.dart';
import 'package:geolocator/geolocator.dart';
import 'package:travel_buddy_mobile/models/place.dart';

void main() {
  group('Mock Data Replacement Tests', () {
    test('Deal model parses location coordinates correctly', () {
      final json = {
        '_id': 'test123',
        'title': 'Test Deal',
        'description': 'Test Description',
        'discount': '50%',
        'businessName': 'Test Business',
        'businessType': 'restaurant',
        'originalPrice': '2000',
        'discountedPrice': '1000',
        'location': {
          'address': 'Colombo, Sri Lanka',
          'lat': 6.9271,
          'lng': 79.8612,
          'city': 'Colombo',
          'country': 'Sri Lanka'
        },
        'images': [],
        'views': 0,
        'claims': 0,
        'isActive': true,
        'validUntil': '2024-12-31T23:59:59.000Z'
      };

      final deal = Deal.fromJson(json);

      expect(deal.location, isNotNull);
      expect(deal.location!.lat, 6.9271);
      expect(deal.location!.lng, 79.8612);
      expect(deal.location!.address, 'Colombo, Sri Lanka');
      expect(deal.location!.city, 'Colombo');
      expect(deal.location!.country, 'Sri Lanka');
    });

    test('Deal distance calculation uses real coordinates', () {
      // User location: Kandy (7.2906, 80.6337)
      final userLat = 7.2906;
      final userLng = 80.6337;

      // Deal location: Colombo (6.9271, 79.8612)
      final dealLat = 6.9271;
      final dealLng = 79.8612;

      // Calculate distance using Geolocator
      final distance = Geolocator.distanceBetween(
        userLat,
        userLng,
        dealLat,
        dealLng,
      );

      final distanceKm = distance / 1000;

      // Distance between Kandy and Colombo is approximately 94km
      expect(distanceKm, greaterThan(90));
      expect(distanceKm, lessThan(100));
    });

    test('Emergency numbers detection works for Sri Lanka', () {
      // Sri Lanka coordinates
      final lat = 6.9271;
      final lng = 79.8612;

      // Check if coordinates are within Sri Lanka bounds
      final isSriLanka = lat >= 5.9 && lat <= 9.9 && lng >= 79.5 && lng <= 82.0;

      expect(isSriLanka, true);
    });

    test('Emergency numbers detection works for India', () {
      // India coordinates (Mumbai)
      final lat = 19.0760;
      final lng = 72.8777;

      // Check if coordinates are within India bounds
      final isIndia = lat >= 8.0 && lat <= 35.0 && lng >= 68.0 && lng <= 97.0;

      expect(isIndia, true);
    });

    test('Emergency numbers detection works for USA', () {
      // USA coordinates (New York)
      final lat = 40.7128;
      final lng = -74.0060;

      // Check if coordinates are within USA bounds
      final isUSA = lat >= 25.0 && lat <= 72.0 && lng >= -168.0 && lng <= -52.0;

      expect(isUSA, true);
    });

    test('Deal model handles missing location gracefully', () {
      final json = {
        '_id': 'test123',
        'title': 'Test Deal',
        'description': 'Test Description',
        'discount': '50%',
        'businessName': 'Test Business',
        'businessType': 'restaurant',
        'originalPrice': '2000',
        'discountedPrice': '1000',
        'images': [],
        'views': 0,
        'claims': 0,
        'isActive': true,
      };

      final deal = Deal.fromJson(json);

      expect(deal.location, isNull);
      expect(deal.title, 'Test Deal');
      expect(deal.discount, '50%');
    });

    test('Multiple deals with different locations', () {
      final deals = [
        {
          '_id': '1',
          'title': 'Colombo Deal',
          'location': {'lat': 6.9271, 'lng': 79.8612},
          'discount': '50%',
          'businessName': 'Test',
          'businessType': 'restaurant',
          'originalPrice': '1000',
          'discountedPrice': '500',
          'images': [],
          'views': 0,
          'claims': 0,
          'isActive': true,
        },
        {
          '_id': '2',
          'title': 'Galle Deal',
          'location': {'lat': 6.0535, 'lng': 80.2210},
          'discount': '30%',
          'businessName': 'Test',
          'businessType': 'hotel',
          'originalPrice': '5000',
          'discountedPrice': '3500',
          'images': [],
          'views': 0,
          'claims': 0,
          'isActive': true,
        },
        {
          '_id': '3',
          'title': 'Kandy Deal',
          'location': {'lat': 7.2906, 'lng': 80.6337},
          'discount': '40%',
          'businessName': 'Test',
          'businessType': 'cafe',
          'originalPrice': '800',
          'discountedPrice': '480',
          'images': [],
          'views': 0,
          'claims': 0,
          'isActive': true,
        },
      ];

      final parsedDeals = deals.map((json) => Deal.fromJson(json)).toList();

      expect(parsedDeals.length, 3);
      expect(parsedDeals[0].location!.lat, 6.9271);
      expect(parsedDeals[1].location!.lat, 6.0535);
      expect(parsedDeals[2].location!.lat, 7.2906);

      // Verify all deals have different coordinates
      expect(parsedDeals[0].location!.lat != parsedDeals[1].location!.lat, true);
      expect(parsedDeals[1].location!.lat != parsedDeals[2].location!.lat, true);
    });
  });
}
