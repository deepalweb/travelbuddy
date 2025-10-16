import { EnhancedUser, UserRole } from '../types/roles';
import { permissionsService } from './permissionsService';
import { apiService } from './apiService';

class RoleService {
  async requestRoleChange(targetRole: UserRole, profileData?: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/roles/request-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, profileData })
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error };
      }
    } catch (error) {
      return { success: false, message: 'Failed to request role change' };
    }
  }

  async getUserRole(): Promise<EnhancedUser | null> {
    try {
      const response = await fetch('/api/roles/me');
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to get user role:', error);
      return null;
    }
  }

  hasPermission(user: EnhancedUser | null, permission: string): boolean {
    return permissionsService.hasPermission(user, permission);
  }

  canAccessFeature(user: EnhancedUser | null, feature: string): boolean {
    return permissionsService.canAccessFeature(user, feature);
  }
}

export const roleService = new RoleService();