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

    // Skip API call, use build-time config directly
    this.config = this.getBuildTimeConfig();
    return this.config;
  }

  private async fetchConfig(): Promise<RuntimeConfig> {
    const baseUrl = import.meta.env.PROD
      ? window.location.origin
      : (import.meta.env.VITE_API_BASE_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net');

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
    return {
      apiBaseUrl: import.meta.env.PROD
        ? window.location.origin
        : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'),
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

export const configService = new ConfigService();
