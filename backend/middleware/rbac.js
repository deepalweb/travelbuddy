// Enhanced permissions system
const PERMISSIONS = {
  // Basic permissions
  SEARCH_PLACES: 'search_places',
  CREATE_POSTS: 'create_posts',
  CREATE_REVIEWS: 'create_reviews',
  BOOK_SERVICES: 'book_services',
  
  // Merchant permissions
  CREATE_DEALS: 'create_deals',
  MANAGE_DEALS: 'manage_deals',
  VIEW_DEAL_ANALYTICS: 'view_deal_analytics',
  MANAGE_BUSINESS_PROFILE: 'manage_business_profile',
  
  // Transport provider permissions
  CREATE_TRANSPORT_SERVICE: 'create_transport_service',
  MANAGE_TRANSPORT_FLEET: 'manage_transport_fleet',
  ACCEPT_TRANSPORT_BOOKINGS: 'accept_transport_bookings',
  MANAGE_ROUTES: 'manage_routes',
  
  // Travel agent permissions
  CREATE_TRAVEL_PACKAGES: 'create_travel_packages',
  MANAGE_CLIENT_BOOKINGS: 'manage_client_bookings',
  ACCESS_AGENT_TOOLS: 'access_agent_tools',
  CREATE_ITINERARIES: 'create_itineraries',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  APPROVE_MERCHANTS: 'approve_merchants',
  APPROVE_AGENTS: 'approve_agents',
  APPROVE_TRANSPORT: 'approve_transport',
  SYSTEM_SETTINGS: 'system_settings'
};

const ROLE_PERMISSIONS = {
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

function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  if (user.role === 'admin') return true;
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission) || rolePermissions.includes('*');
}

// Role-based access control middleware
export function requireRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Validate allowed roles
      const validRoles = ['user', 'merchant', 'transport_provider', 'travel_agent', 'admin'];
      const validAllowedRoles = allowedRoles.filter(role => validRoles.includes(role));
      
      if (validAllowedRoles.length === 0) {
        return res.status(500).json({ error: 'Invalid role configuration' });
      }

      // Get user roles from database or request
      const userRoles = req.userRoles || ['user'];
      
      // Check if user has any of the allowed roles
      const hasAccess = validAllowedRoles.some(role => userRoles.includes(role)) || 
                       userRoles.includes('admin');
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: validAllowedRoles
        });
      }

      req.userWithRole = { roles: userRoles };
      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

// Permission-based access control middleware
export function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Validate permission
      if (!permission || typeof permission !== 'string') {
        return res.status(500).json({ error: 'Invalid permission configuration' });
      }

      const userRoles = req.userRoles || ['user'];
      
      // Check if any user role has this permission
      const hasAccess = userRoles.some(role => {
        const rolePermissions = ROLE_PERMISSIONS[role] || [];
        return rolePermissions.includes(permission) || rolePermissions.includes('*');
      }) || userRoles.includes('admin');

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Permission denied',
          required: permission
        });
      }

      req.userWithRole = { roles: userRoles };
      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

// Audit logging middleware
export function auditLog(action) {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      console.log('Audit Log:', {
        action,
        user: req.user?.uid,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        success: res.statusCode < 400
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
}