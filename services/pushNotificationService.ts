export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      // Register service worker
      await navigator.serviceWorker.register('/sw.js');
      
      // Request permission if not granted
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }

      return this.permission === 'granted';
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async sendNotification(options: PushNotificationOptions): Promise<boolean> {
    if (!this.isSupported || this.permission !== 'granted') {
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false
      });

      // Auto close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();