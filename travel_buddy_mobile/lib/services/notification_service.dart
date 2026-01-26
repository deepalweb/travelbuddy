import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Top-level function for background message handling
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📱 Background message: ${message.messageId}');
  await NotificationService().showNotification(
    title: message.notification?.title ?? 'Travel Buddy',
    body: message.notification?.body ?? 'New notification',
    payload: message.data.toString(),
  );
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  
  String? _fcmToken;
  String? get fcmToken => _fcmToken;
  
  final StreamController<String> _notificationStreamController = StreamController<String>.broadcast();
  Stream<String> get notificationStream => _notificationStreamController.stream;

  // Initialize notifications
  Future<void> initialize() async {
    try {
      // Request permissions
      await _requestPermissions();
      
      // Initialize local notifications
      await _initializeLocalNotifications();
      
      // Initialize FCM
      await _initializeFCM();
      
      print('✅ Notification service initialized');
    } catch (e) {
      print('❌ Notification initialization error: $e');
    }
  }

  // Request notification permissions
  Future<void> _requestPermissions() async {
    final settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
    );
    
    print('📱 Notification permission: ${settings.authorizationStatus}');
  }

  // Initialize local notifications
  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
  }

  // Initialize Firebase Cloud Messaging
  Future<void> _initializeFCM() async {
    // Get FCM token
    _fcmToken = await _fcm.getToken();
    print('🔑 FCM Token: $_fcmToken');
    
    // Listen to token refresh
    _fcm.onTokenRefresh.listen((newToken) {
      _fcmToken = newToken;
      print('🔄 FCM Token refreshed: $newToken');
    });
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
    
    // Handle initial message if app was opened from notification
    final initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  // Handle foreground messages
  void _handleForegroundMessage(RemoteMessage message) {
    print('📨 Foreground message: ${message.notification?.title}');
    
    showNotification(
      title: message.notification?.title ?? 'Travel Buddy',
      body: message.notification?.body ?? 'New notification',
      payload: message.data.toString(),
    );
  }

  // Handle notification tap
  void _handleNotificationTap(RemoteMessage message) {
    print('👆 Notification tapped: ${message.data}');
    _notificationStreamController.add(message.data.toString());
  }

  // Handle local notification tap
  void _onNotificationTapped(NotificationResponse response) {
    print('👆 Local notification tapped: ${response.payload}');
    if (response.payload != null) {
      _notificationStreamController.add(response.payload!);
    }
  }

  // Show local notification
  Future<void> showNotification({
    required String title,
    required String body,
    String? payload,
    int id = 0,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'travel_buddy_channel',
      'Travel Buddy Notifications',
      channelDescription: 'Notifications for Travel Buddy app',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _localNotifications.show(id, title, body, details, payload: payload);
  }

  // Show notification with custom sound
  Future<void> showNotificationWithSound({
    required String title,
    required String body,
    String? payload,
    int id = 0,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'travel_buddy_channel',
      'Travel Buddy Notifications',
      channelDescription: 'Notifications for Travel Buddy app',
      importance: Importance.max,
      priority: Priority.high,
      sound: RawResourceAndroidNotificationSound('notification'),
      playSound: true,
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
      sound: 'notification.aiff',
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _localNotifications.show(id, title, body, details, payload: payload);
  }

  // Schedule notification
  Future<void> scheduleNotification({
    required String title,
    required String body,
    required DateTime scheduledTime,
    String? payload,
    int id = 0,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'travel_buddy_channel',
      'Travel Buddy Notifications',
      channelDescription: 'Notifications for Travel Buddy app',
      importance: Importance.high,
      priority: Priority.high,
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    // Note: For scheduling, you'll need timezone package
    // await _localNotifications.zonedSchedule(
    //   id,
    //   title,
    //   body,
    //   tz.TZDateTime.from(scheduledTime, tz.local),
    //   details,
    //   androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
    //   uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
    //   payload: payload,
    // );
  }

  // Cancel notification
  Future<void> cancelNotification(int id) async {
    await _localNotifications.cancel(id);
  }

  // Cancel all notifications
  Future<void> cancelAllNotifications() async {
    await _localNotifications.cancelAll();
  }

  // Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    await _fcm.subscribeToTopic(topic);
    print('📢 Subscribed to topic: $topic');
  }

  // Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _fcm.unsubscribeFromTopic(topic);
    print('🔕 Unsubscribed from topic: $topic');
  }

  // Predefined notification types
  Future<void> showDealNotification(String dealTitle, String discount) async {
    await showNotification(
      id: 1,
      title: '🔥 Hot Deal Alert!',
      body: '$dealTitle - $discount',
      payload: 'deal',
    );
  }

  Future<void> showTripReminderNotification(String tripName, String time) async {
    await showNotification(
      id: 2,
      title: '✈️ Trip Reminder',
      body: '$tripName starts $time',
      payload: 'trip',
    );
  }

  Future<void> showSafetyAlertNotification(String message) async {
    await showNotificationWithSound(
      id: 3,
      title: '🚨 Safety Alert',
      body: message,
      payload: 'safety',
    );
  }

  Future<void> showWeatherAlertNotification(String message) async {
    await showNotification(
      id: 4,
      title: '🌦️ Weather Update',
      body: message,
      payload: 'weather',
    );
  }

  Future<void> showNewPlaceNotification(String placeName) async {
    await showNotification(
      id: 5,
      title: '📍 New Place Nearby',
      body: 'Check out $placeName near you!',
      payload: 'place',
    );
  }

  // Dispose
  void dispose() {
    _notificationStreamController.close();
  }
}
