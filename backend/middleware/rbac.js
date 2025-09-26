// Inline permissions for backend to avoid path issues
const PERMISSIONS = {
  SEARCH_PLACES: 'search_places',
  CREATE_DEALS: 'create_deals',
  MANAGE_BUSINESS_PROFILE: 'manage_business_profile',
  CREATE_SERVICE_LISTING: 'create_service_listing',
  ACCEPT_BOOKINGS: 'accept_bookings',
  MANAGE_USERS: 'manage_users'
};

const ROLE_PERMISSIONS = {
  regular: ['search_places', 'create_posts', 'create_reviews'],
  merchant: ['search_places', 'create_deals', 'manage_business_profile'],
  agent: ['search_places', 'create_service_listing', 'accept_bookings'],
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

      const user = { role: 'regular', permissions: ['search_places'] };
      
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: user.role
        });
      }

      req.userWithRole = user;
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

      const user = { role: 'regular', permissions: ['search_places'] };

      if (!hasPermission(user, permission)) {
        return res.status(403).json({ 
          error: 'Permission denied',
          required: permission,
          userRole: user.role
        });
      }

      req.userWithRole = user;
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