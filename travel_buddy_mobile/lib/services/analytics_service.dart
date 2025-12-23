import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';

class AnalyticsService {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;
  static final FirebaseCrashlytics _crashlytics = FirebaseCrashlytics.instance;

  // Initialize
  static Future<void> initialize() async {
    // Enable Crashlytics collection
    await _crashlytics.setCrashlyticsCollectionEnabled(true);
    
    // Pass Flutter errors to Crashlytics
    FlutterError.onError = _crashlytics.recordFlutterFatalError;
    
    // Pass async errors to Crashlytics
    PlatformDispatcher.instance.onError = (error, stack) {
      _crashlytics.recordError(error, stack, fatal: true);
      return true;
    };
    
    print('✅ Analytics & Crashlytics initialized');
  }

  // Screen Views
  static Future<void> logScreenView(String screenName) async {
    await _analytics.logScreenView(screenName: screenName);
  }

  // User Properties
  static Future<void> setUserId(String userId) async {
    await _analytics.setUserId(id: userId);
    await _crashlytics.setUserIdentifier(userId);
  }

  static Future<void> setUserProperty(String name, String value) async {
    await _analytics.setUserProperty(name: name, value: value);
  }

  // Events
  static Future<void> logEvent(String name, {Map<String, dynamic>? parameters}) async {
    await _analytics.logEvent(name: name, parameters: parameters);
  }

  // Common Events
  static Future<void> logLogin(String method) async {
    await _analytics.logLogin(loginMethod: method);
  }

  static Future<void> logSignUp(String method) async {
    await _analytics.logSignUp(signUpMethod: method);
  }

  static Future<void> logSearch(String searchTerm) async {
    await _analytics.logSearch(searchTerm: searchTerm);
  }

  static Future<void> logShare(String contentType, String itemId) async {
    await _analytics.logShare(contentType: contentType, itemId: itemId, method: 'app');
  }

  static Future<void> logViewItem(String itemId, String itemName, String itemCategory) async {
    await _analytics.logViewItem(
      currency: 'USD',
      value: 0,
      items: [
        AnalyticsEventItem(
          itemId: itemId,
          itemName: itemName,
          itemCategory: itemCategory,
        ),
      ],
    );
  }

  // Custom Events
  static Future<void> logPlaceView(String placeId, String placeName) async {
    await logEvent('place_view', parameters: {
      'place_id': placeId,
      'place_name': placeName,
    });
  }

  static Future<void> logDealClaim(String dealId, String dealTitle) async {
    await logEvent('deal_claim', parameters: {
      'deal_id': dealId,
      'deal_title': dealTitle,
    });
  }

  static Future<void> logPostCreate(String postType) async {
    await logEvent('post_create', parameters: {
      'post_type': postType,
    });
  }

  static Future<void> logTripPlanCreate(String destination, String duration) async {
    await logEvent('trip_plan_create', parameters: {
      'destination': destination,
      'duration': duration,
    });
  }

  // Error Logging
  static Future<void> logError(String message, {dynamic error, StackTrace? stackTrace}) async {
    await _crashlytics.log(message);
    if (error != null) {
      await _crashlytics.recordError(error, stackTrace, reason: message);
    }
  }

  // Custom Keys for Crashlytics
  static Future<void> setCustomKey(String key, dynamic value) async {
    await _crashlytics.setCustomKey(key, value);
  }
}
