# TravelBuddy Admin Panel

## Overview
A comprehensive admin panel for managing TravelBuddy platform operations.

## Features

### 1. Dashboard
- Total users, posts, deals, trips statistics
- Merchants, travel agents, transport providers count
- Real-time overview of platform activity

### 2. User Management
- View all users with pagination
- Edit user details (tier, roles, status)
- Delete users
- Search and filter users

### 3. Content Moderation
- Review pending posts
- Approve/reject community content
- View reported content
- Moderate reviews and comments

### 4. Business Management
- Approve/reject merchant applications
- Approve/reject travel agent registrations
- Approve/reject transport provider registrations
- View business verification status

### 5. Deals Management
- View all deals
- Edit deal details
- Activate/deactivate deals
- Monitor deal performance (views, claims)

### 6. System Health
- Database connection status
- Server uptime and memory usage
- Collection statistics

## Setup

### 1. Set Admin Secret
Add to your `.env` file:
```
ADMIN_SECRET=your-secure-admin-password
```

### 2. Access Admin Panel
Navigate to: `http://localhost:3000/admin` (or your production URL)

### 3. Login
Enter your admin secret to access the panel.

## API Endpoints

All admin endpoints require `x-admin-secret` header.

### Dashboard
```
GET /api/admin/dashboard
```

### Users
```
GET /api/admin/users?page=1&limit=20
PUT /api/admin/users/:id
DELETE /api/admin/users/:id
```

### Content Moderation
```
GET /api/admin/posts/pending
PUT /api/admin/posts/:id/moderate
Body: { "status": "approved" | "rejected" }
```

### Business Approvals
```
GET /api/admin/businesses/pending
PUT /api/admin/businesses/:id/approve
Body: { "type": "business" | "agent" | "transport" }
```

### Deals
```
GET /api/admin/deals
PUT /api/admin/deals/:id
DELETE /api/admin/deals/:id
```

### System Health
```
GET /api/admin/health
```

## Security

- Admin secret is required for all operations
- Store admin secret securely (use environment variables)
- Never commit admin secret to version control
- Use HTTPS in production
- Implement IP whitelisting for additional security

## Usage Examples

### Approve a Merchant
```javascript
fetch('http://localhost:8080/api/admin/businesses/123/approve', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': 'your-admin-secret'
  },
  body: JSON.stringify({ type: 'business' })
});
```

### Moderate a Post
```javascript
fetch('http://localhost:8080/api/admin/posts/456/moderate', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret': 'your-admin-secret'
  },
  body: JSON.stringify({ status: 'approved' })
});
```

## Production Deployment

1. Set strong admin secret in Azure App Settings
2. Enable HTTPS only
3. Add IP restrictions in Azure
4. Monitor admin access logs
5. Implement 2FA for admin access (future enhancement)

## Future Enhancements

- [ ] Advanced analytics dashboard
- [ ] Bulk operations
- [ ] Export data functionality
- [ ] Email notifications for pending approvals
- [ ] Activity logs and audit trail
- [ ] Role-based admin access (super admin, moderator, etc.)
- [ ] Two-factor authentication
- [ ] API rate limiting per admin user
