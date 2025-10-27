interface RuntimeConfig {
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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    
    try {
      const response = await fetch(`${baseUrl}/api/config`);
      if (!response.ok) {
        throw new Error(`Config fetch failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch runtime config, using fallback:', error);
      
      // Fallback to build-time env vars
      return {
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
        firebase: {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
        },
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        unsplash: {
          accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || ''
        }
      };
    }
  }
}

export const configService = new ConfigService();
export type { RuntimeConfig };