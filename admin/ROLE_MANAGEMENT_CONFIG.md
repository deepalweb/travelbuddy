# Role-Based Access Control Configuration

## User Roles and Permissions Matrix

### Role Definitions

#### Super Admin 🔐
**Full access to all modules and settings**
- Complete system administration
- User role management
- System configuration
- All business operations
- Analytics and reporting
- Emergency controls

**Permissions:**
```json
{
  "role": "SUPER_ADMIN",
  "permissions": ["*"],
  "modules": {
    "dashboard": ["read", "write", "admin"],
    "users": ["read", "write", "delete", "manage_roles", "ban", "unban"],
    "content": ["read", "write", "delete", "moderate", "approve", "reject"],
    "business": ["read", "write", "delete", "approve", "manage_all"],
    "analytics": ["read", "export", "admin"],
    "settings": ["read", "write", "system_config"],
    "reports": ["read", "write", "resolve", "escalate"]
  }
}
```

#### Moderator 🛡️
**Manage users, community posts, and reported content**
- User account management
- Content moderation
- Report resolution
- Community guidelines enforcement

**Permissions:**
```json
{
  "role": "MODERATOR",
  "permissions": [
    "users.read", "users.write", "users.ban", "users.unban",
    "content.read", "content.moderate", "content.approve", "content.reject",
    "reports.read", "reports.resolve", "reports.escalate",
    "analytics.content", "analytics.users"
  ],
  "modules": {
    "dashboard": ["read"],
    "users": ["read", "write", "ban", "unban"],
    "content": ["read", "moderate", "approve", "reject"],
    "business": ["read"],
    "analytics": ["read"],
    "reports": ["read", "resolve", "escalate"]
  }
}
```

#### Content Manager 📝
**Manage places, deals, and trips**
- Location and venue management
- Deal and promotion oversight
- Trip content curation
- Business listing management

**Permissions:**
```json
{
  "role": "CONTENT_MANAGER",
  "permissions": [
    "places.read", "places.write", "places.approve",
    "deals.read", "deals.write", "deals.approve",
    "trips.read", "trips.write", "trips.curate",
    "business.read", "business.listings",
    "analytics.content"
  ],
  "modules": {
    "dashboard": ["read"],
    "users": ["read"],
    "content": ["read", "write", "approve"],
    "business": ["read", "manage_listings"],
    "analytics": ["read"]
  }
}
```

#### Business Partner 🤝
**Manage their own deals and analytics**
- Own business profile management
- Deal creation and management
- Business analytics access
- Customer interaction tools

**Permissions:**
```json
{
  "role": "BUSINESS_PARTNER",
  "permissions": [
    "business.own.read", "business.own.write",
    "deals.own.read", "deals.own.write",
    "analytics.own.read", "analytics.own.export",
    "customers.own.read"
  ],
  "modules": {
    "dashboard": ["read"],
    "business": ["manage_own"],
    "analytics": ["read_own"]
  }
}
```

#### Support Agent 🎧
**View users and assist with issues (no edit rights)**
- User account viewing
- Ticket management
- Basic assistance tools
- Read-only access to most data

**Permissions:**
```json
{
  "role": "SUPPORT_AGENT",
  "permissions": [
    "users.read", "users.view_activity",
    "tickets.read", "tickets.write", "tickets.assign",
    "content.read",
    "business.read",
    "reports.read"
  ],
  "modules": {
    "dashboard": ["read"],
    "users": ["read"],
    "content": ["read"],
    "business": ["read"],
    "tickets": ["read", "write", "assign"]
  }
}
```

## Database Schema for Role Management

### Tables Required

```sql
-- Admin roles table
CREATE TABLE AdminRoles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(50) UNIQUE NOT NULL,
    display_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    permissions NVARCHAR(MAX), -- JSON array of permissions
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- User role assignments
CREATE TABLE UserRoleAssignments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role_id UNIQUEIDENTIFIER REFERENCES AdminRoles(id),
    assigned_by UNIQUEIDENTIFIER REFERENCES Users(id),
    assigned_at DATETIME2 DEFAULT GETDATE(),
    expires_at DATETIME2 NULL,
    is_active BIT DEFAULT 1
);

-- Permission groups for granular control
CREATE TABLE PermissionGroups (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(50) UNIQUE NOT NULL,
    description NVARCHAR(255),
    permissions NVARCHAR(MAX) -- JSON array
);

-- Audit trail for role changes
CREATE TABLE RoleAuditLog (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    action NVARCHAR(50) NOT NULL, -- 'ASSIGNED', 'REMOVED', 'MODIFIED'
    old_role NVARCHAR(50),
    new_role NVARCHAR(50),
    changed_by UNIQUEIDENTIFIER REFERENCES Users(id),
    reason NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETDATE()
);
```

### Initial Data Setup

```sql
-- Insert default roles
INSERT INTO AdminRoles (name, display_name, description, permissions) VALUES
('SUPER_ADMIN', 'Super Administrator', 'Full access to all modules and settings', '["*"]'),
('MODERATOR', 'Moderator', 'Manage users, community posts, and reported content', 
 '["users.read","users.write","users.ban","users.unban","content.moderate","reports.resolve"]'),
('CONTENT_MANAGER', 'Content Manager', 'Manage places, deals, and trips',
 '["places.manage","deals.manage","trips.manage","business.listings"]'),
('BUSINESS_PARTNER', 'Business Partner', 'Manage their own deals and analytics',
 '["business.own","deals.own","analytics.own"]'),
('SUPPORT_AGENT', 'Support Agent', 'View users and assist with issues (no edit rights)',
 '["users.read","tickets.manage","content.read"]');
```

## API Endpoints for Role Management

### Role Management Endpoints

```typescript
// Get all available roles
GET /api/admin/roles
Response: {
  roles: [
    {
      id: "uuid",
      name: "SUPER_ADMIN",
      displayName: "Super Administrator",
      description: "Full access to all modules and settings",
      permissions: ["*"],
      userCount: 2,
      isActive: true
    }
  ]
}

// Create new role
POST /api/admin/roles
Body: {
  name: "CUSTOM_ROLE",
  displayName: "Custom Role",
  description: "Custom role description",
  permissions: ["users.read", "content.read"]
}

// Update role permissions
PUT /api/admin/roles/:roleId
Body: {
  permissions: ["users.read", "users.write", "content.moderate"]
}

// Assign role to user
POST /api/admin/users/:userId/roles
Body: {
  roleId: "uuid",
  reason: "Promoted to moderator",
  expiresAt: "2024-12-31T23:59:59Z" // optional
}

// Remove role from user
DELETE /api/admin/users/:userId/roles/:roleId
Body: {
  reason: "Role no longer needed"
}

// Get user's current roles and permissions
GET /api/admin/users/:userId/permissions
Response: {
  user: {
    id: "uuid",
    roles: [
      {
        id: "uuid",
        name: "MODERATOR",
        assignedAt: "2024-01-15T10:00:00Z",
        assignedBy: "admin-uuid",
        expiresAt: null
      }
    ],
    permissions: ["users.read", "users.write", "content.moderate"],
    effectiveRole: "MODERATOR"
  }
}

// Get role audit log
GET /api/admin/roles/audit?userId=:userId&limit=50
Response: {
  auditLog: [
    {
      id: "uuid",
      userId: "uuid",
      action: "ASSIGNED",
      oldRole: null,
      newRole: "MODERATOR",
      changedBy: "admin-uuid",
      reason: "Promoted to moderator",
      createdAt: "2024-01-15T10:00:00Z"
    }
  ]
}
```

## Frontend Implementation

### Role Management Component

```typescript
// Add to SystemSettings component
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Users, Shield, Plus, Edit, Trash2 } from '@phosphor-icons/react';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const roleIcons = {
    SUPER_ADMIN: '🔐',
    MODERATOR: '🛡️',
    CONTENT_MANAGER: '📝',
    BUSINESS_PARTNER: '🤝',
    SUPPORT_AGENT: '🎧'
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      const data = await response.json();
      setRoles(data.roles);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">User Roles & Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Manage user roles and their associated permissions
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            {/* Role creation form would go here */}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {roleIcons[role.name] || '👤'}
                </div>
                <div>
                  <h4 className="font-medium">{role.displayName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      <Users size={12} className="mr-1" />
                      {role.userCount} users
                    </Badge>
                    <Badge variant="outline">
                      <Shield size={12} className="mr-1" />
                      {role.permissions.length === 1 && role.permissions[0] === '*' 
                        ? 'All permissions' 
                        : `${role.permissions.length} permissions`}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit size={16} />
                </Button>
                {role.name !== 'SUPER_ADMIN' && (
                  <Button variant="outline" size="sm">
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoleManagement;
```

### Permission Check Hook

```typescript
// hooks/usePermissions.ts
import { useState, useEffect } from 'react';

interface UserPermissions {
  roles: string[];
  permissions: string[];
  effectiveRole: string;
}

export const usePermissions = () => {
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const response = await fetch('/api/auth/permissions');
      const data = await response.json();
      setUserPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!userPermissions) return false;
    
    // Super admin has all permissions
    if (userPermissions.permissions.includes('*')) return true;
    
    // Check specific permission
    return userPermissions.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!userPermissions) return false;
    return userPermissions.roles.includes(role);
  };

  const canAccess = (module: string, action: string = 'read'): boolean => {
    return hasPermission(`${module}.${action}`);
  };

  return {
    userPermissions,
    loading,
    hasPermission,
    hasRole,
    canAccess,
    refetch: fetchUserPermissions
  };
};
```

## Security Considerations

### Permission Validation
- Always validate permissions on both frontend and backend
- Use middleware for API endpoint protection
- Implement rate limiting for sensitive operations
- Log all role changes for audit purposes

### Best Practices
1. **Principle of Least Privilege**: Users should have minimum permissions needed
2. **Role Separation**: Keep roles focused and avoid overlap
3. **Regular Reviews**: Audit user roles quarterly
4. **Temporary Access**: Use expiration dates for temporary elevated access
5. **Emergency Procedures**: Have super admin backup procedures

### Implementation Checklist
- [ ] Database schema created
- [ ] API endpoints implemented
- [ ] Frontend role management UI
- [ ] Permission checking hooks
- [ ] Middleware for API protection
- [ ] Audit logging system
- [ ] Role assignment workflows
- [ ] Documentation updated