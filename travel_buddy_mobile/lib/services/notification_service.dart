import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import '../services/analytics_service.dart';

// Top-level function for background messages
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📬 Background message: ${message.messageId}');
  print('Title: ${message.notification?.title}');
  print('Body: ${message.notification?.body}');
}

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static String? _fcmToken;

  Future<void> initialize() async {
    try {
      // Request permission
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      
      print('✅ Notification permission: ${settings.authorizationStatus}');

      // Get FCM token
      _fcmToken = await _messaging.getToken();
      print('📱 FCM Token: $_fcmToken');
      
      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        print('🔄 FCM Token refreshed: $newToken');
        // TODO: Send to backend
      });

      // Handle background messages
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
      
      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      
      // Handle notification taps (app opened from notification)
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
      
      // Check if app was opened from a notification
      RemoteMessage? initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }
      
      print('✅ Push notifications initialized');
    } catch (e) {
      print('❌ Notification init error: $e');
      AnalyticsService.logError('Notification init failed', error: e);
    }
  }

  Future<void> requestPermission() async {
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  Future<void> showLocalNotification(String title, String body) async {
    print('📢 Notification: $title - $body');
  }

  static Future<String?> getToken() async {
    return _fcmToken ?? await _messaging.getToken();
  }
  
  static Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    print('✅ Subscribed to topic: $topic');
  }
  
  static Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    print('✅ Unsubscribed from topic: $topic');
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    print('📬 Foreground message received');
    print('Title: ${message.notification?.title}');
    print('Body: ${message.notification?.body}');
    print('Data: ${message.data}');
    
    // Track notification received
    AnalyticsService.logEvent('notification_received', parameters: {
      'title': message.notification?.title ?? '',
      'type': message.data['type'] ?? 'general',
    });
    
    // TODO: Show in-app notification banner
  }
  
  static void _handleNotificationTap(RemoteMessage message) {
    print('🔔 Notification tapped');
    print('Data: ${message.data}');
    
    // Track notification opened
    AnalyticsService.logEvent('notification_opened', parameters: {
      'title': message.notification?.title ?? '',
      'type': message.data['type'] ?? 'general',
    });
    
    // TODO: Navigate to relevant screen based on notification type
    final type = message.data['type'];
    switch (type) {
      case 'deal':
        // Navigate to deal details
        break;
      case 'post':
        // Navigate to community post
        break;
      case 'trip':
        // Navigate to trip plan
        break;
    }
  }
}