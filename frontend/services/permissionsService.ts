import { UserRole, RolePermissions, EnhancedUser } from '../types/roles';

export const PERMISSIONS = {
  // Search & Discovery
  SEARCH_PLACES: 'search_places',
  VIEW_PLACE_DETAILS: 'view_place_details',
  SAVE_FAVORITES: 'save_favorites',
  
  // Content Creation
  CREATE_POSTS: 'create_posts',
  CREATE_REVIEWS: 'create_reviews',
  UPLOAD_PHOTOS: 'upload_photos',
  
  // Trip Planning
  CREATE_TRIPS: 'create_trips',
  USE_AI_PLANNER: 'use_ai_planner',
  SHARE_TRIPS: 'share_trips',
  
  // Business Management
  MANAGE_BUSINESS_PROFILE: 'manage_business_profile',
  CREATE_DEALS: 'create_deals',
  VIEW_BUSINESS_ANALYTICS: 'view_business_analytics',
  MANAGE_INVENTORY: 'manage_inventory',
  
  // Service Provider
  CREATE_SERVICE_LISTING: 'create_service_listing',
  MANAGE_AVAILABILITY: 'manage_availability',
  ACCEPT_BOOKINGS: 'accept_bookings',
  VIEW_EARNINGS: 'view_earnings',
  
  // Admin
  MANAGE_USERS: 'manage_users',
  APPROVE_BUSINESSES: 'approve_businesses',
  MODERATE_CONTENT: 'moderate_content',
  VIEW_SYSTEM_ANALYTICS: 'view_system_analytics',
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions'
} as const;

export const ROLE_PERMISSIONS: RolePermissions = {
  regular: [
    PERMISSIONS.SEARCH_PLACES,
    PERMISSIONS.VIEW_PLACE_DETAILS,
    PERMISSIONS.SAVE_FAVORITES,
    PERMISSIONS.CREATE_POSTS,
    PERMISSIONS.CREATE_REVIEWS,
    PERMISSIONS.UPLOAD_PHOTOS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.SHARE_TRIPS
  ],
  merchant: [
    PERMISSIONS.SEARCH_PLACES,
    PERMISSIONS.VIEW_PLACE_DETAILS,
    PERMISSIONS.MANAGE_BUSINESS_PROFILE,
    PERMISSIONS.CREATE_DEALS,
    PERMISSIONS.VIEW_BUSINESS_ANALYTICS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.CREATE_POSTS,
    PERMISSIONS.UPLOAD_PHOTOS
  ],
  agent: [
    PERMISSIONS.SEARCH_PLACES,
    PERMISSIONS.VIEW_PLACE_DETAILS,
    PERMISSIONS.CREATE_SERVICE_LISTING,
    PERMISSIONS.MANAGE_AVAILABILITY,
    PERMISSIONS.ACCEPT_BOOKINGS,
    PERMISSIONS.VIEW_EARNINGS,
    PERMISSIONS.CREATE_POSTS,
    PERMISSIONS.UPLOAD_PHOTOS
  ],
  admin: ['*'] // All permissions
};

class PermissionsService {
  hasPermission(user: EnhancedUser, permission: string): boolean {
    if (!user || !user.role) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check specific permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    return rolePermissions.includes(permission) || rolePermissions.includes('*');
  }

  canAccessFeature(user: EnhancedUser, feature: string): boolean {
    const featurePermissions: Record<string, string> = {
      'ai_planner': PERMISSIONS.USE_AI_PLANNER,
      'business_dashboard': PERMISSIONS.MANAGE_BUSINESS_PROFILE,
      'service_dashboard': PERMISSIONS.CREATE_SERVICE_LISTING,
      'admin_panel': PERMISSIONS.MANAGE_USERS,
      'create_deals': PERMISSIONS.CREATE_DEALS,
      'view_analytics': PERMISSIONS.VIEW_BUSINESS_ANALYTICS
    };

    const requiredPermission = featurePermissions[feature];
    return requiredPermission ? this.hasPermission(user, requiredPermission) : false;
  }

  getUserPermissions(role: UserRole): string[] {
    if (role === 'admin') {
      return Object.values(PERMISSIONS);
    }
    return ROLE_PERMISSIONS[role] || [];
  }

  validateRoleTransition(currentRole: UserRole, newRole: UserRole): boolean {
    // Define allowed role transitions
    const allowedTransitions: Record<UserRole, UserRole[]> = {
      regular: ['merchant', 'agent'],
      merchant: ['regular'],
      agent: ['regular'],
      admin: [] // Admins cannot change roles
    };

    return allowedTransitions[currentRole]?.includes(newRole) || false;
  }
}

export const permissionsService = new PermissionsService();