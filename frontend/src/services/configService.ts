export interface RuntimeConfig {
  apiBaseUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  googleMapsApiKey: string;
  unsplash: {
    accessKey: string;
  };
}

class ConfigService {
  private config: RuntimeConfig | null = null;
  private configPromise: Promise<RuntimeConfig> | null = null;

  async getConfig(): Promise<RuntimeConfig> {
    if (this.config) {
      return this.config;
    }

    if (this.configPromise) {
      return this.configPromise;
    }

    this.configPromise = this.fetchConfig();
    this.config = await this.configPromise;
    return this.config;
  }

  private async fetchConfig(): Promise<RuntimeConfig> {
    const baseUrl = import.meta.env.PROD 
      ? window.location.origin 
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
    
    try {
      const response = await fetch(`${baseUrl}/api/runtime-config`);
      if (!response.ok) {
        throw new Error(`Config fetch failed: ${response.status}`);
      }
      const runtimeConfig = await response.json();
      
      return {
        apiBaseUrl: baseUrl,
        firebase: runtimeConfig.firebase,
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        unsplash: {
          accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || ''
        }
      };
    } catch (error) {
      console.error('Failed to fetch runtime config, using fallback:', error);
      return this.getBuildTimeConfig();
    }
  }

  private getBuildTimeConfig(): RuntimeConfig {
    const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
    
    return {
      apiBaseUrl: import.meta.env.PROD 
        ? window.location.origin 
        : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'),
      firebase: {
        apiKey: firebaseApiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'travelbuddy-2d1c5.firebaseapp.com',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'travelbuddy-2d1c5',
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'travelbuddy-2d1c5.firebasestorage.app',
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '45425409967',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:45425409967:web:782638c65a40dcb156b95a'
      },
      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
      unsplash: {
        accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || ''
      }
    };
  }


}

export const configService = new ConfigService();