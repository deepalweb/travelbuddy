# Travel Buddy Admin Portal - Azure Deployment Guide

## Overview
This guide walks you through deploying the Travel Buddy Admin Portal to Azure App Service and connecting it to your backend APIs and database infrastructure.

## Prerequisites
- Azure subscription with App Service and Database resources
- Admin portal built with React/TypeScript (current codebase)
- Backend API endpoints for travel platform
- Database connection (Azure SQL Database, CosmosDB, or PostgreSQL)

## 1. Frontend Deployment Preparation

### Build Configuration
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test local build
npm run preview
```

### Environment Variables Setup
Create production environment configuration:

```bash
# .env.production
VITE_API_BASE_URL=https://your-backend-api.azurewebsites.net
VITE_ENVIRONMENT=production
VITE_AUTH_DOMAIN=your-auth-domain.com
VITE_CLIENT_ID=your-azure-ad-client-id
```

## 2. Azure App Service Configuration

### Create App Service
```bash
# Using Azure CLI
az webapp create \
  --resource-group your-resource-group \
  --plan your-app-service-plan \
  --name travel-buddy-admin \
  --runtime "NODE|18-lts"
```

### Configure Deployment
1. **GitHub Actions Deployment** (Recommended)
2. **Azure DevOps Pipeline**
3. **Local Git Deployment**
4. **ZIP Deploy**

### Sample GitHub Actions Workflow
```yaml
# .github/workflows/deploy-admin.yml
name: Deploy Admin Portal

on:
  push:
    branches: [main]
    paths: ['admin-portal/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: travel-buddy-admin
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./dist
```

## 3. Backend API Integration

### Required API Endpoints

#### Authentication & Authorization
```typescript
// API endpoints needed by admin portal
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/user
GET /api/auth/permissions
```

#### User Management
```typescript
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/:id
DELETE /api/admin/users/:id
GET /api/admin/users/:id/activity
POST /api/admin/users/:id/ban
POST /api/admin/users/:id/unban
```

#### Content Moderation
```typescript
GET /api/admin/reports
PUT /api/admin/reports/:id/resolve
GET /api/admin/content/flagged
POST /api/admin/content/:id/approve
POST /api/admin/content/:id/reject
```

#### Business Management
```typescript
GET /api/admin/businesses
POST /api/admin/businesses
PUT /api/admin/businesses/:id
GET /api/admin/deals
POST /api/admin/deals/:id/approve
```

#### Analytics
```typescript
GET /api/admin/analytics/dashboard
GET /api/admin/analytics/users
GET /api/admin/analytics/content
GET /api/admin/analytics/revenue
```

### Role-Based Access Control
```typescript
// Backend middleware for role checking
const roles = {
  SUPER_ADMIN: ['*'], // All permissions
  MODERATOR: ['users.manage', 'content.moderate', 'reports.resolve'],
  CONTENT_MANAGER: ['places.manage', 'deals.manage', 'trips.manage'],
  BUSINESS_PARTNER: ['business.own', 'analytics.own'],
  SUPPORT_AGENT: ['users.view', 'tickets.manage']
}

// API middleware
function requirePermission(permission: string) {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = roles[userRole] || [];
    
    if (userPermissions.includes('*') || userPermissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
}
```

## 4. Database Connection Setup

### Azure SQL Database
```typescript
// Backend database configuration
import { ConnectionPool } from 'mssql';

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

export const pool = new ConnectionPool(dbConfig);
```

### Required Database Tables
```sql
-- Users table with role management
CREATE TABLE Users (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  email NVARCHAR(255) UNIQUE NOT NULL,
  username NVARCHAR(100) UNIQUE NOT NULL,
  role NVARCHAR(50) DEFAULT 'USER',
  status NVARCHAR(20) DEFAULT 'ACTIVE',
  created_at DATETIME2 DEFAULT GETDATE(),
  last_login DATETIME2,
  profile_data NVARCHAR(MAX) -- JSON data
);

-- Admin roles and permissions
CREATE TABLE AdminRoles (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(50) UNIQUE NOT NULL,
  permissions NVARCHAR(MAX), -- JSON array of permissions
  created_at DATETIME2 DEFAULT GETDATE()
);

-- Content moderation
CREATE TABLE ContentReports (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  content_type NVARCHAR(50) NOT NULL,
  content_id UNIQUEIDENTIFIER NOT NULL,
  reporter_id UNIQUEIDENTIFIER REFERENCES Users(id),
  reason NVARCHAR(255),
  status NVARCHAR(20) DEFAULT 'PENDING',
  resolved_by UNIQUEIDENTIFIER REFERENCES Users(id),
  resolved_at DATETIME2,
  created_at DATETIME2 DEFAULT GETDATE()
);

-- Business management
CREATE TABLE Businesses (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(255) NOT NULL,
  owner_id UNIQUEIDENTIFIER REFERENCES Users(id),
  status NVARCHAR(20) DEFAULT 'PENDING',
  verification_status NVARCHAR(20) DEFAULT 'UNVERIFIED',
  business_data NVARCHAR(MAX), -- JSON data
  created_at DATETIME2 DEFAULT GETDATE()
);
```

## 5. Authentication Integration

### Azure Active Directory B2C Setup
```typescript
// Frontend auth configuration
import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: process.env.VITE_CLIENT_ID!,
    authority: `https://${process.env.VITE_TENANT_NAME}.b2clogin.com/${process.env.VITE_TENANT_NAME}.onmicrosoft.com/${process.env.VITE_POLICY_NAME}`,
    knownAuthorities: [`${process.env.VITE_TENANT_NAME}.b2clogin.com`],
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);
```

### JWT Token Validation
```typescript
// Backend JWT middleware
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `https://${process.env.TENANT_NAME}.b2clogin.com/${process.env.TENANT_NAME}.onmicrosoft.com/${process.env.POLICY_NAME}/discovery/v2.0/keys`
});

export async function validateToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.decode(token, { complete: true });
    const key = await client.getSigningKey(decoded.header.kid);
    const verified = jwt.verify(token, key.getPublicKey());
    
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

## 6. Security Configuration

### CORS Setup
```typescript
// Backend CORS configuration
app.use(cors({
  origin: [
    'https://travel-buddy-admin.azurewebsites.net',
    'https://your-main-app.azurewebsites.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Content Security Policy
```typescript
// Add to Azure App Service configuration
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
    "font-src 'self' fonts.gstatic.com; " +
    "connect-src 'self' https://*.azurewebsites.net;"
  );
  next();
});
```

## 7. Monitoring and Logging

### Application Insights Integration
```typescript
// Frontend monitoring
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: process.env.VITE_APPINSIGHTS_KEY,
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true
  }
});

appInsights.loadAppInsights();
appInsights.trackPageView();
```

### Backend Logging
```typescript
// Structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/admin-actions.log' }),
    new winston.transports.Console()
  ]
});

// Log admin actions
app.use('/api/admin', (req, res, next) => {
  logger.info('Admin action', {
    userId: req.user?.id,
    action: `${req.method} ${req.path}`,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});
```

## 8. Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] API endpoints tested
- [ ] Authentication flow verified
- [ ] Role permissions configured
- [ ] CORS settings updated

### Deployment Steps
1. **Build and test locally**
2. **Deploy backend API first**
3. **Update database with admin roles**
4. **Deploy frontend to App Service**
5. **Configure custom domain (optional)**
6. **Setup SSL certificate**
7. **Configure monitoring**

### Post-Deployment
- [ ] Verify all admin functions work
- [ ] Test role-based access control
- [ ] Check analytics dashboards
- [ ] Validate user management features
- [ ] Test content moderation workflows
- [ ] Verify business management features

## 9. Maintenance and Updates

### Automated Backups
```bash
# Schedule database backups
az sql db export \
  --resource-group your-resource-group \
  --server your-sql-server \
  --name travel-buddy-db \
  --storage-uri "https://yourstorageaccount.blob.core.windows.net/backups/backup.bacpac" \
  --storage-key "your-storage-key"
```

### Health Checks
```typescript
// Add health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.request().query('SELECT 1');
    
    // Check external dependencies
    const checks = {
      database: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION
    };
    
    res.json(checks);
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

## 10. Troubleshooting

### Common Issues
1. **CORS errors**: Check origin configuration
2. **Authentication failures**: Verify Azure AD B2C setup
3. **Database connection issues**: Check connection strings and firewall rules
4. **Permission errors**: Validate role assignments
5. **Build failures**: Check environment variables and dependencies

### Debugging Tools
- Azure App Service logs
- Application Insights
- Browser developer tools
- Database query logs
- Network traffic inspection

## Support and Documentation

### Additional Resources
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure SQL Database Guide](https://docs.microsoft.com/azure/azure-sql/)
- [Azure Active Directory B2C](https://docs.microsoft.com/azure/active-directory-b2c/)
- [React Deployment Best Practices](https://create-react-app.dev/docs/deployment/)

### Contact Information
- Technical Support: [Your support contact]
- Emergency Escalation: [Emergency contact]
- Documentation Updates: [Documentation maintainer]