// Progressive Web App utilities for mobile-like experience

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private init() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
    });

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
    });

    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }
}

export const pwaManager = new PWAManager();

// Web Notifications
export class NotificationManager {
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    return await Notification.requestPermission();
  }

  static async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }

  static isSupported(): boolean {
    return 'Notification' in window;
  }

  static getPermission(): NotificationPermission {
    return Notification.permission;
  }
}

// Device Detection
export const deviceUtils = {
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  },

  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  },

  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  getScreenSize(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  },

  supportsCamera(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  supportsGeolocation(): boolean {
    return 'geolocation' in navigator;
  },

  supportsShare(): boolean {
    return 'share' in navigator;
  },

  supportsVibration(): boolean {
    return 'vibrate' in navigator;
  },
};

// Local Storage with mobile app compatibility
export class StorageManager {
  static setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  // Mobile app compatibility keys
  static getFavorites(): string[] {
    return this.getItem('travelBuddyFavoritePlaceIds', []);
  }

  static setFavorites(favorites: string[]): void {
    this.setItem('travelBuddyFavoritePlaceIds', favorites);
  }

  static getSavedTrips(): any[] {
    return this.getItem('travelBuddySavedTripPlans', []);
  }

  static setSavedTrips(trips: any[]): void {
    this.setItem('travelBuddySavedTripPlans', trips);
  }
}

// Haptic Feedback (for mobile devices)
export const hapticFeedback = {
  light(): void {
    if (deviceUtils.supportsVibration()) {
      navigator.vibrate(10);
    }
  },

  medium(): void {
    if (deviceUtils.supportsVibration()) {
      navigator.vibrate(20);
    }
  },

  heavy(): void {
    if (deviceUtils.supportsVibration()) {
      navigator.vibrate(50);
    }
  },

  success(): void {
    if (deviceUtils.supportsVibration()) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  error(): void {
    if (deviceUtils.supportsVibration()) {
      navigator.vibrate([50, 50, 50]);
    }
  },
};

// Share API wrapper
export const shareContent = async (data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> => {
  if (deviceUtils.supportsShare()) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }
  
  // Fallback to clipboard
  if (data.url && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(data.url);
      NotificationManager.showNotification('Link copied to clipboard!');
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }
  
  return false;
};