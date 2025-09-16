import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Request permission
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Initialize local notifications
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const settings = InitializationSettings(android: androidSettings, iOS: iosSettings);
    
    await _localNotifications.initialize(settings);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
  }

  Future<void> requestPermission() async {
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  Future<void> showLocalNotification(String title, String body) async {
    const androidDetails = AndroidNotificationDetails(
      'travel_buddy_channel',
      'Travel Buddy Notifications',
      importance: Importance.high,
      priority: Priority.high,
    );
    
    const notificationDetails = NotificationDetails(android: androidDetails);
    
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      notificationDetails,
    );
  }

  static Future<String?> getToken() async {
    return await _messaging.getToken();
  }

  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    print('Background message: ${message.messageId}');
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    const androidDetails = AndroidNotificationDetails(
      'travel_buddy_channel',
      'Travel Buddy Notifications',
      importance: Importance.high,
      priority: Priority.high,
    );
    
    const notificationDetails = NotificationDetails(android: androidDetails);
    
    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'Travel Buddy',
      message.notification?.body ?? 'New notification',
      notificationDetails,
    );
  }
}