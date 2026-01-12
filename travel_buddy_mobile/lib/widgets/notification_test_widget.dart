import 'package:flutter/material.dart';
import '../services/notification_service.dart';

class NotificationTestWidget extends StatelessWidget {
  const NotificationTestWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Test'),
        backgroundColor: const Color(0xFF6366F1),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // FCM Token Display
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'FCM Token',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  SelectableText(
                    NotificationService().fcmToken ?? 'Loading...',
                    style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: () {
                      final token = NotificationService().fcmToken;
                      if (token != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Token copied to clipboard')),
                        );
                      }
                    },
                    icon: const Icon(Icons.copy),
                    label: const Text('Copy Token'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          // Test Notifications
          const Text(
            'Test Notifications',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          
          _buildTestButton(
            context,
            'Simple Notification',
            Icons.notifications,
            Colors.blue,
            () => NotificationService().showNotification(
              title: 'Test Notification',
              body: 'This is a simple test notification',
            ),
          ),
          
          _buildTestButton(
            context,
            'Deal Alert',
            Icons.local_offer,
            Colors.red,
            () => NotificationService().showDealNotification(
              'Luxury Hotel Stay',
              '50% OFF - Limited Time!',
            ),
          ),
          
          _buildTestButton(
            context,
            'Trip Reminder',
            Icons.flight,
            Colors.green,
            () => NotificationService().showTripReminderNotification(
              'Colombo Adventure',
              'in 2 hours',
            ),
          ),
          
          _buildTestButton(
            context,
            'Safety Alert',
            Icons.warning,
            Colors.orange,
            () => NotificationService().showSafetyAlertNotification(
              'Weather warning: Heavy rain expected',
            ),
          ),
          
          _buildTestButton(
            context,
            'Weather Update',
            Icons.wb_sunny,
            Colors.amber,
            () => NotificationService().showWeatherAlertNotification(
              'Perfect weather today! 28°C and sunny',
            ),
          ),
          
          _buildTestButton(
            context,
            'New Place',
            Icons.place,
            Colors.purple,
            () => NotificationService().showNewPlaceNotification(
              'Galle Face Green',
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Topic Subscriptions
          const Text(
            'Topic Subscriptions',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          
          _buildTopicButton(
            context,
            'Subscribe to Deals',
            'deals',
            true,
          ),
          
          _buildTopicButton(
            context,
            'Subscribe to Safety Alerts',
            'safety_alerts',
            true,
          ),
          
          _buildTopicButton(
            context,
            'Subscribe to Weather',
            'weather',
            true,
          ),
          
          const SizedBox(height: 16),
          
          _buildTopicButton(
            context,
            'Unsubscribe from Deals',
            'deals',
            false,
          ),
          
          const SizedBox(height: 24),
          
          // Clear Notifications
          ElevatedButton.icon(
            onPressed: () async {
              await NotificationService().cancelAllNotifications();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('All notifications cleared'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            icon: const Icon(Icons.clear_all),
            label: const Text('Clear All Notifications'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.all(16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTestButton(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    VoidCallback onPressed,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(label),
        trailing: ElevatedButton(
          onPressed: () async {
            await onPressed();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$label sent!'),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 2),
              ),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: color,
            foregroundColor: Colors.white,
          ),
          child: const Text('Send'),
        ),
      ),
    );
  }

  Widget _buildTopicButton(
    BuildContext context,
    String label,
    String topic,
    bool subscribe,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(
          subscribe ? Icons.add_circle : Icons.remove_circle,
          color: subscribe ? Colors.green : Colors.red,
        ),
        title: Text(label),
        trailing: ElevatedButton(
          onPressed: () async {
            if (subscribe) {
              await NotificationService().subscribeToTopic(topic);
            } else {
              await NotificationService().unsubscribeFromTopic(topic);
            }
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  subscribe
                      ? 'Subscribed to $topic'
                      : 'Unsubscribed from $topic',
                ),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 2),
              ),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: subscribe ? Colors.green : Colors.red,
            foregroundColor: Colors.white,
          ),
          child: Text(subscribe ? 'Subscribe' : 'Unsubscribe'),
        ),
      ),
    );
  }
}
