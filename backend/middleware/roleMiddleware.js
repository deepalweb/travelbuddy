// Strategic role-based middleware for multi-sided platform
export const roleCapabilities = {
  traveler: [
    'view_places', 'create_trip', 'claim_deals', 'write_reviews', 
    'use_ai_planner', 'access_safety_hub', 'chat_customers'
  ],
  merchant: [
    'view_places', 'create_trip', 'claim_deals', 'create_deals', 
    'manage_deals', 'view_analytics', 'manage_business_profile', 'chat_customers'
  ],
  transport_provider: [
    'view_places', 'create_trip', 'manage_transport_offers', 
    'receive_trip_requests', 'manage_bookings', 'chat_customers'
  ],
  travel_agent: [
    'view_places', 'create_trip', 'manage_travel_packages', 
    'receive_trip_requests', 'manage_clients', 'chat_customers'
  ],
  admin: ['*'] // Full access
};

export function hasCapability(userRoles, capability) {
  // Support both single role (string) and multiple roles (array)
  const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
  
  return roles.some(role => {
    const capabilities = roleCapabilities[role] || [];
    return capabilities.includes('*') || capabilities.includes(capability);
  });
}

export function requireCapability(capability) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || ['user'];
    if (!hasCapability(userRoles, capability)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: capability,
        userRoles 
      });
    }
    next();
  };
}