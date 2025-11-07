// Centralized security configuration
export const SECURITY_CONFIG = {
  // Valid roles in the system
  VALID_ROLES: ['user', 'merchant', 'transport_provider', 'travel_agent', 'admin'],
  
  // Public features that don't require authentication
  PUBLIC_FEATURES: ['places', 'weather', 'deals', 'posts', 'users', 'merchants', 'transport', 'agents', 'admin'],
  
  // User ID validation regex
  USER_ID_REGEX: /^[a-zA-Z0-9_-]+$/,
  
  // MongoDB ObjectId regex
  MONGODB_ID_REGEX: /^[0-9a-fA-F]{24}$/,
  
  // Production security settings
  PRODUCTION_SETTINGS: {
    DISABLE_DEV_ROUTES: true,
    REQUIRE_HTTPS: true,
    STRICT_AUTH: true
  }
};

// Role-based feature access mapping
export const ROLE_FEATURES = {
  user: [
    'places', 'trips', 'posts', 'reviews', 'favorites', 'weather', 
    'emergency', 'dishes', 'itineraries', 'bookings'
  ],
  merchant: [
    'places', 'deals', 'posts', 'reviews', 'business-profile',
    'merchant-dashboard', 'bookings'
  ],
  transport_provider: [
    'places', 'transport-services', 'bookings', 'posts', 'reviews',
    'transport-dashboard', 'partner-management'
  ],
  travel_agent: [
    'places', 'trips', 'posts', 'reviews', 'agent-packages',
    'client-management', 'agent-dashboard', 'bookings'
  ],
  admin: ['all']
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  user: [
    'search_places', 'create_posts', 'create_reviews', 'book_services'
  ],
  merchant: [
    'search_places', 'create_posts', 'create_reviews', 'book_services',
    'create_deals', 'manage_deals', 'view_deal_analytics', 'manage_business_profile'
  ],
  transport_provider: [
    'search_places', 'create_posts', 'create_reviews',
    'create_transport_service', 'manage_transport_fleet', 
    'accept_transport_bookings', 'manage_routes'
  ],
  travel_agent: [
    'search_places', 'create_posts', 'create_reviews', 'book_services',
    'create_travel_packages', 'manage_client_bookings', 
    'access_agent_tools', 'create_itineraries'
  ],
  admin: ['*']
};

// Input validation functions
export const validateUserId = (userId) => {
  return userId && 
         typeof userId === 'string' && 
         SECURITY_CONFIG.USER_ID_REGEX.test(userId);
};

export const validateRole = (role) => {
  return role && 
         typeof role === 'string' && 
         SECURITY_CONFIG.VALID_ROLES.includes(role);
};

export const validateFeature = (feature) => {
  return feature && 
         typeof feature === 'string' && 
         feature.length > 0;
};

// Security helper functions
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, 255); // Limit length and trim
};

export const sanitizeProfileData = (data, requiredFields = []) => {
  const sanitized = {};
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }
  
  // Sanitize string fields
  const stringFields = ['businessName', 'businessType', 'businessAddress', 'businessPhone', 
                       'businessEmail', 'agencyName', 'ownerName', 'email', 'phone', 'companyName'];
  
  for (const field of stringFields) {
    if (data[field]) {
      sanitized[field] = sanitizeString(data[field]);
    }
  }
  
  return sanitized;
};