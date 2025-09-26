import { describe, it, expect, beforeEach } from 'vitest';
import { permissionsService, PERMISSIONS } from '../services/permissionsService';

describe('4-Role System', () => {
  describe('Permissions Service', () => {
    it('should grant correct permissions to regular users', () => {
      const user = { role: 'regular', permissions: [] };
      
      expect(permissionsService.hasPermission(user, PERMISSIONS.SEARCH_PLACES)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.CREATE_POSTS)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.CREATE_DEALS)).toBe(false);
      expect(permissionsService.hasPermission(user, PERMISSIONS.MANAGE_USERS)).toBe(false);
    });

    it('should grant correct permissions to merchants', () => {
      const user = { role: 'merchant', permissions: [] };
      
      expect(permissionsService.hasPermission(user, PERMISSIONS.SEARCH_PLACES)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.CREATE_DEALS)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.VIEW_BUSINESS_ANALYTICS)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.ACCEPT_BOOKINGS)).toBe(false);
      expect(permissionsService.hasPermission(user, PERMISSIONS.MANAGE_USERS)).toBe(false);
    });

    it('should grant correct permissions to agents', () => {
      const user = { role: 'agent', permissions: [] };
      
      expect(permissionsService.hasPermission(user, PERMISSIONS.SEARCH_PLACES)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.CREATE_SERVICE_LISTING)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.ACCEPT_BOOKINGS)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.CREATE_DEALS)).toBe(false);
      expect(permissionsService.hasPermission(user, PERMISSIONS.MANAGE_USERS)).toBe(false);
    });

    it('should grant all permissions to admins', () => {
      const user = { role: 'admin', permissions: [] };
      
      expect(permissionsService.hasPermission(user, PERMISSIONS.SEARCH_PLACES)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.CREATE_DEALS)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.ACCEPT_BOOKINGS)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.MANAGE_USERS)).toBe(true);
      expect(permissionsService.hasPermission(user, PERMISSIONS.MODERATE_CONTENT)).toBe(true);
    });

    it('should validate role transitions correctly', () => {
      expect(permissionsService.validateRoleTransition('regular', 'merchant')).toBe(true);
      expect(permissionsService.validateRoleTransition('regular', 'agent')).toBe(true);
      expect(permissionsService.validateRoleTransition('merchant', 'regular')).toBe(true);
      expect(permissionsService.validateRoleTransition('agent', 'regular')).toBe(true);
      expect(permissionsService.validateRoleTransition('admin', 'regular')).toBe(false);
      expect(permissionsService.validateRoleTransition('merchant', 'agent')).toBe(false);
    });
  });

  describe('Feature Access', () => {
    it('should control feature access based on role', () => {
      const regularUser = { role: 'regular', permissions: [] };
      const merchantUser = { role: 'merchant', permissions: [] };
      const agentUser = { role: 'agent', permissions: [] };
      const adminUser = { role: 'admin', permissions: [] };

      expect(permissionsService.canAccessFeature(regularUser, 'business_dashboard')).toBe(false);
      expect(permissionsService.canAccessFeature(merchantUser, 'business_dashboard')).toBe(true);
      expect(permissionsService.canAccessFeature(agentUser, 'service_dashboard')).toBe(true);
      expect(permissionsService.canAccessFeature(adminUser, 'admin_panel')).toBe(true);
    });
  });
});