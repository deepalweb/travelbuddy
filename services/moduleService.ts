export interface UserModule {
  id: string;
  name: string;
  enabled: boolean;
  requiredFor: string[];
}

export interface ProfileTypeConfig {
  id: string;
  name: string;
  modules: string[];
  dashboardComponent: string;
  permissions: string[];
}

export const PROFILE_CONFIGS: Record<string, ProfileTypeConfig> = {
  traveler: {
    id: 'traveler',
    name: 'Traveler',
    modules: ['places', 'trips', 'community', 'favorites'],
    dashboardComponent: 'TravelerDashboard',
    permissions: ['search_places', 'create_posts', 'save_favorites', 'create_trips']
  },
  business: {
    id: 'business',
    name: 'Business Owner',
    modules: ['deals', 'analytics', 'reviews', 'business'],
    dashboardComponent: 'MerchantDashboard',
    permissions: ['create_deals', 'view_analytics', 'manage_business', 'respond_reviews']
  },
  service: {
    id: 'service',
    name: 'Service Provider',
    modules: ['services', 'bookings', 'calendar', 'earnings'],
    dashboardComponent: 'AgentDashboard',
    permissions: ['create_services', 'manage_bookings', 'view_earnings', 'set_availability']
  },
  creator: {
    id: 'creator',
    name: 'Community Creator',
    modules: ['posts', 'events', 'photos', 'community'],
    dashboardComponent: 'CreatorDashboard',
    permissions: ['create_posts', 'organize_events', 'upload_photos', 'moderate_community']
  }
};

class ModuleService {
  getModulesForProfile(profileType: string): string[] {
    return PROFILE_CONFIGS[profileType]?.modules || ['places'];
  }

  getPermissionsForProfile(profileType: string): string[] {
    return PROFILE_CONFIGS[profileType]?.permissions || ['search_places'];
  }

  getDashboardComponent(profileType: string): string {
    return PROFILE_CONFIGS[profileType]?.dashboardComponent || 'TravelerDashboard';
  }

  hasModule(userModules: string[], requiredModule: string): boolean {
    return userModules.includes(requiredModule);
  }

  canAccessFeature(userModules: string[], feature: string): boolean {
    const featureModuleMap: Record<string, string> = {
      'create_deals': 'deals',
      'manage_bookings': 'bookings',
      'create_services': 'services',
      'view_analytics': 'analytics',
      'organize_events': 'events'
    };
    
    const requiredModule = featureModuleMap[feature];
    return requiredModule ? this.hasModule(userModules, requiredModule) : true;
  }
}

export const moduleService = new ModuleService();