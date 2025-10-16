class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIHSUHVi358b4MjrLsGmJIGEqaVmOiNjwPlq6fnUBJaM0GSJBWBvY'
        )
      });

      console.log('Push subscription created');
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async sendNotification(title: string, options: NotificationOptions = {}) {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Travel-specific notifications
  async notifyNearbyDeal(placeName: string, discount: string) {
    await this.sendNotification('🎉 Deal Alert!', {
      body: `${discount} off at ${placeName} nearby!`,
      tag: 'deal-alert',
      requireInteraction: true
    });
  }

  async notifyTripReminder(destination: string, daysLeft: number) {
    await this.sendNotification('✈️ Trip Reminder', {
      body: `Your trip to ${destination} is in ${daysLeft} days!`,
      tag: 'trip-reminder'
    });
  }

  async notifyWeatherAlert(city: string, condition: string) {
    await this.sendNotification('🌤️ Weather Update', {
      body: `${condition} expected in ${city} today`,
      tag: 'weather-alert'
    });
  }

  isPermissionGranted(): boolean {
    return Notification.permission === 'granted';
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = new PushNotificationService();