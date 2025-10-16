import { Notification } from '../contexts/NotificationContext.tsx';
import { pushNotificationService } from './pushNotificationService';

export class NotificationService {
  private static instance: NotificationService;
  private addNotificationCallback?: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  setNotificationCallback(callback: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void) {
    this.addNotificationCallback = callback;
  }

  private async sendPushNotification(title: string, message: string, priority: 'low' | 'medium' | 'high') {
    try {
      await pushNotificationService.sendNotification({
        title,
        body: message,
        requireInteraction: priority === 'high'
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  // Weather-based notifications
  checkWeatherAlerts(weather: string, userCity: string) {
    if (!this.addNotificationCallback) return;

    if (weather.toLowerCase().includes('rain')) {
      const notification = {
        type: 'weather' as const,
        title: 'Rain Alert',
        message: `Rain expected in ${userCity}. Consider indoor activities!`,
        priority: 'medium' as const
      };
      this.addNotificationCallback(notification);
      this.sendPushNotification(notification.title, notification.message, notification.priority);
    }
    
    if (weather.toLowerCase().includes('storm')) {
      const notification = {
        type: 'safety' as const,
        title: 'Weather Warning',
        message: `Storm warning for ${userCity}. Stay safe indoors.`,
        priority: 'high' as const
      };
      this.addNotificationCallback(notification);
      this.sendPushNotification(notification.title, notification.message, notification.priority);
    }
  }

  // Deal notifications based on favorites
  checkDealAlerts(favoritePlaceIds: string[], placesWithDeals: any[]) {
    if (!this.addNotificationCallback) return;

    const favoriteDeals = placesWithDeals.filter(place => 
      favoritePlaceIds.includes(place.id) && place.deal
    );

    favoriteDeals.forEach(place => {
      const notification = {
        type: 'deal' as const,
        title: 'Deal at Favorite Place!',
        message: `${place.deal.discount} at ${place.name}`,
        priority: 'high' as const
      };
      this.addNotificationCallback(notification);
      this.sendPushNotification(notification.title, notification.message, notification.priority);
    });
  }

  // Location-based notifications
  checkLocationAlerts(userLocation: { latitude: number; longitude: number }, userCity: string) {
    if (!this.addNotificationCallback) return;

    // Simulate location-based alerts
    const alerts = [
      {
        type: 'system' as const,
        title: 'Welcome to the Area!',
        message: `Discover hidden gems around ${userCity}`,
        priority: 'low' as const
      },
      {
        type: 'safety' as const,
        title: 'Safety Reminder',
        message: 'Emergency services are available 24/7 in this area',
        priority: 'medium' as const
      }
    ];

    // Send random alert (simulate real conditions)
    if (Math.random() > 0.7) {
      const alert = alerts[Math.floor(Math.random() * alerts.length)];
      this.addNotificationCallback(alert);
    }
  }

  // Social notifications
  notifyNewLike(postAuthor: string) {
    if (!this.addNotificationCallback) return;

    this.addNotificationCallback({
      type: 'social',
      title: 'New Like!',
      message: `Someone liked your post`,
      priority: 'low'
    });
  }

  notifyNewComment(postAuthor: string, commenter: string) {
    if (!this.addNotificationCallback) return;

    this.addNotificationCallback({
      type: 'social',
      title: 'New Comment',
      message: `${commenter} commented on your post`,
      priority: 'medium'
    });
  }

  // System notifications
  notifySubscriptionExpiry(daysLeft: number) {
    if (!this.addNotificationCallback) return;

    if (daysLeft <= 3) {
      this.addNotificationCallback({
        type: 'system',
        title: 'Subscription Expiring',
        message: `Your premium subscription expires in ${daysLeft} days`,
        priority: 'high'
      });
    }
  }

  // Event notifications
  notifyNearbyEvents(userCity: string) {
    if (!this.addNotificationCallback) return;

    const events = [
      'Local food festival this weekend',
      'Free museum day tomorrow',
      'Night market open until midnight',
      'Cultural performance at city center'
    ];

    if (Math.random() > 0.8) {
      const event = events[Math.floor(Math.random() * events.length)];
      this.addNotificationCallback({
        type: 'system',
        title: 'Local Event',
        message: event,
        priority: 'medium'
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();