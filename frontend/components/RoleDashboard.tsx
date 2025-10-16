import React from 'react';
import { EnhancedUser } from '../types/roles';
import { permissionsService } from '../services/permissionsService';

// Role-specific dashboard components
import RegularUserDashboard from './dashboards/RegularUserDashboard';
import MerchantDashboard from './dashboards/MerchantDashboard';
import AgentDashboard from './dashboards/AgentDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

interface RoleDashboardProps {
  user: EnhancedUser;
  onRoleChange?: (newRole: string) => void;
}

const RoleDashboard: React.FC<RoleDashboardProps> = ({ user, onRoleChange }) => {
  const renderDashboard = () => {
    switch (user.role) {
      case 'merchant':
        return <MerchantDashboard user={user} />;
      case 'agent':
        return <AgentDashboard user={user} />;
      case 'admin':
        return <AdminDashboard user={user} />;
      default:
        return <RegularUserDashboard user={user} />;
    }
  };

  const canSwitchRole = (targetRole: string) => {
    return permissionsService.validateRoleTransition(user.role, targetRole as any);
  };

  return (
    <div className="role-dashboard">
      {/* Role Switcher */}
      {(canSwitchRole('merchant') || canSwitchRole('agent')) && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 mb-2">Switch to:</p>
          <div className="flex gap-2">
            {canSwitchRole('merchant') && (
              <button
                onClick={() => onRoleChange?.('merchant')}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Merchant Account
              </button>
            )}
            {canSwitchRole('agent') && (
              <button
                onClick={() => onRoleChange?.('agent')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Service Provider
              </button>
            )}
          </div>
        </div>
      )}

      {/* Role-specific Dashboard */}
      {renderDashboard()}
    </div>
  );
};

export default RoleDashboard;