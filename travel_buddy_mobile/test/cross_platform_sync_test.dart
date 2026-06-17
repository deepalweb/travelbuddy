import 'package:flutter_test/flutter_test.dart';
import 'package:travel_buddy_mobile/models/trip.dart';
import 'package:travel_buddy_mobile/models/user.dart';

void main() {
  test('parses a trip saved by the web app', () {
    final trip = TripPlan.fromJson({
      '_id': 'trip-1',
      'tripTitle': 'Kyoto Culture Trip',
      'destination': 'Kyoto',
      'duration': '2 days',
      'budgetRange': 'USD 500-700',
      'introduction': 'A balanced culture-focused trip.',
      'dailyItinerary': [
        {
          'day': 1,
          'theme': 'Historic Kyoto',
          'dayGoal': 'Keep nearby temple visits together.',
          'estimatedDayCost': 'USD 80-120',
          'activities': [
            {
              'timeSlot': 'Morning',
              'activityType': 'Culture',
              'activityTitle': 'Visit Kiyomizu-dera',
              'placeName': 'Kiyomizu-dera',
              'details': 'Explore the temple before peak crowds.',
              'cost': 'USD 5-10',
            }
          ],
        }
      ],
      'metadata': {
        'generatedPlan': {
          'durationDays': 2,
          'finalAdvice': 'Start early.',
        }
      },
    });

    expect(trip.id, 'trip-1');
    expect(trip.durationDays, 2);
    expect(trip.totalEstimatedCost, 'USD 500-700');
    expect(trip.dailyPlans.single.title, 'Historic Kyoto');
    expect(
      trip.dailyPlans.single.activities.single.activityTitle,
      'Visit Kiyomizu-dera',
    );
    expect(
      trip.dailyPlans.single.activities.single.location,
      'Kiyomizu-dera',
    );
  });

  test('parses website social links stored as an object', () {
    final user = CurrentUser.fromJson({
      'firebaseUid': 'firebase-user-1',
      'email': 'traveler@example.com',
      'socialLinks': {
        'instagram': 'https://instagram.com/traveler',
      },
    });

    expect(user.socialLinks, [
      {
        'platform': 'instagram',
        'url': 'https://instagram.com/traveler',
      }
    ]);
  });
}
