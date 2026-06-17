import 'package:dio/dio.dart';

import 'mobile_api_client.dart';

class AITripService {
  static Future<Map<String, dynamic>> generateTripPlan({
    required String destination,
    required String duration,
    int? durationDays,
    String? interests,
    List<String>? interestList,
    List<String>? avoid,
    String? pace,
    String? budget,
    String? travelerType,
    String? startDate,
    String? endDate,
  }) async {
    final days = durationDays ??
        int.tryParse(RegExp(r'\d+').firstMatch(duration)?.group(0) ?? '') ??
        3;
    final normalizedBudget = switch (budget?.toLowerCase()) {
      'budget' || 'budget-friendly' => 'budget',
      'luxury' => 'luxury',
      _ => 'mid_range',
    };
    final normalizedPace = switch (pace?.toLowerCase()) {
      'relaxed' => 'relaxed',
      'fast' => 'busy',
      _ => 'balanced',
    };
    final normalizedInterests = interestList?.isNotEmpty == true
        ? interestList!
        : (interests ?? '')
            .split(',')
            .map((item) => item.trim().toLowerCase())
            .where((item) => item.isNotEmpty)
            .toList();

    try {
      final response = await MobileApiClient.instance.dio.post<dynamic>(
        '/api/trip-plan/generate',
        data: {
          'destination': destination,
          'startDate': startDate,
          'endDate': endDate,
          'durationDays': days,
          'travelerType': travelerType ?? 'couple',
          'budgetLevel': normalizedBudget,
          'pace': normalizedPace,
          'interests': normalizedInterests,
          'avoid': avoid ?? const [],
        },
        options: Options(
          receiveTimeout: const Duration(seconds: 150),
          sendTimeout: const Duration(seconds: 30),
        ),
      );

      final body = response.data;
      if (body is! Map || body['success'] != true || body['tripPlan'] is! Map) {
        throw Exception('The planning service returned an invalid response.');
      }

      final generatedPlan = Map<String, dynamic>.from(body['tripPlan'] as Map);
      return _toLegacyViewModel(generatedPlan, destination, days);
    } on DioException catch (error) {
      throw Exception(_friendlyGenerateError(error));
    }
  }

  static Future<Map<String, dynamic>> editTripPlan({
    required Map<String, dynamic> currentPlan,
    required String actionType,
    String? actionLabel,
    String? instruction,
    required String destination,
    required int durationDays,
    String? budget,
    String? pace,
    String? travelerType,
    List<String>? interests,
    List<String>? avoid,
    String? startDate,
    String? endDate,
  }) async {
    final normalizedBudget = switch (budget?.toLowerCase()) {
      'budget' || 'budget-friendly' => 'budget',
      'luxury' => 'luxury',
      _ => 'mid_range',
    };
    final normalizedPace = switch (pace?.toLowerCase()) {
      'relaxed' => 'relaxed',
      'fast' => 'busy',
      'packed' => 'packed',
      _ => 'balanced',
    };

    try {
      final response = await MobileApiClient.instance.dio.post<dynamic>(
        '/api/trip-plan/edit',
        data: {
          'currentPlan': currentPlan,
          'actionType': actionType,
          'actionLabel': actionLabel,
          'instruction': instruction,
          'input': {
            'destination': destination,
            'startDate': startDate,
            'endDate': endDate,
            'durationDays': durationDays,
            'travelerType': travelerType ?? 'couple',
            'budgetLevel': normalizedBudget,
            'pace': normalizedPace,
            'interests': interests ?? const [],
            'avoid': avoid ?? const [],
          },
        },
        options: Options(
          receiveTimeout: const Duration(seconds: 150),
          sendTimeout: const Duration(seconds: 30),
        ),
      );

      final body = response.data;
      if (body is! Map || body['success'] != true || body['tripPlan'] is! Map) {
        throw Exception(
            'The planning service returned an invalid edit response.');
      }

      final editedPlan = Map<String, dynamic>.from(body['tripPlan'] as Map);
      return _toLegacyViewModel(editedPlan, destination, durationDays);
    } on DioException catch (error) {
      throw Exception(_friendlyGenerateError(error));
    }
  }

  static String _friendlyGenerateError(DioException error) {
    final responseData = error.response?.data;
    final serverMessage = responseData is Map
        ? (responseData['error'] ?? responseData['message'])?.toString()
        : null;

    if (serverMessage != null && serverMessage.trim().isNotEmpty) {
      return serverMessage;
    }

    final statusCode = error.response?.statusCode;
    if (statusCode == 401) {
      return 'Your session expired. Please sign in again and retry.';
    }
    if (statusCode != null && statusCode >= 500) {
      return 'The trip planning server had a problem. Please retry in a moment.';
    }

    return switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.sendTimeout =>
        'Trip planning took too long. Please retry with a shorter trip.',
      DioExceptionType.connectionError =>
        'Could not connect to TravelBuddy. Check your internet connection.',
      _ => 'Failed to generate a smart trip plan.',
    };
  }

  static Map<String, dynamic> _toLegacyViewModel(
    Map<String, dynamic> plan,
    String destination,
    int days,
  ) {
    final rawDays = plan['days'] as List? ?? const [];
    final dailyPlans = rawDays.whereType<Map>().map((rawDay) {
      final day = Map<String, dynamic>.from(rawDay);
      final rawActivities = day['activities'] as List? ?? const [];
      return {
        'day': day['day'],
        'title': day['title'],
        'theme': day['theme'],
        'activities': rawActivities.whereType<Map>().map((rawActivity) {
          final activity = Map<String, dynamic>.from(rawActivity);
          final placeName = (activity['placeName'] ?? '').toString();
          return {
            'timeOfDay': activity['timeOfDay'],
            'activityTitle': activity['title'],
            'description': activity['description'],
            'category': activity['type'],
            'icon': _activityIcon(activity['type']?.toString()),
            'location': placeName,
            'estimatedDuration': activity['estimatedDuration'],
            'estimatedCost': '',
            'notes': [
              activity['localTip'],
              activity['reservationAdvice'],
            ]
                .where((item) => item != null && item.toString().isNotEmpty)
                .join(' • '),
          };
        }).toList(),
      };
    }).toList();

    return {
      'tripTitle': plan['tripTitle'] ?? 'Smart Trip to $destination',
      'destination': plan['destination'] ?? destination,
      'duration': '${plan['durationDays'] ?? days} days',
      'introduction':
          plan['tripSummary']?['shortDescription'] ?? plan['finalAdvice'] ?? '',
      'dailyPlans': dailyPlans,
      'conclusion': plan['finalAdvice'] ?? '',
      'generatedPlan': plan,
    };
  }

  static String _activityIcon(String? type) {
    return switch (type) {
      'food' => '🍽️',
      'nature' => '🌿',
      'culture' => '🏛️',
      'transport' => '🚆',
      'shopping' => '🛍️',
      'rest' => '☕',
      _ => '📍',
    };
  }
}
