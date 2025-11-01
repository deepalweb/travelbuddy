# TravelBuddy Azure App Service Deployment Guide

## 🚀 Deployment Overview

This guide covers the optimized deployment process for TravelBuddy to Azure App Service using GitHub Actions.

## 📋 Prerequisites

### Azure Resources
- Azure App Service (Node.js 20 LTS)
- Azure App Service Plan (B1 or higher recommended)
- MongoDB Atlas or Azure Cosmos DB
- Azure Application Insights (optional)

### GitHub Secrets Required
Set these secrets in your GitHub repository settings:

```
AZURE_WEBAPP_NAME=your-app-name
AZURE_WEBAPP_PUBLISH_PROFILE=<download from Azure portal>
VITE_API_BASE_URL=https://your-app-name.azurewebsites.net
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-key
```

### Azure App Settings
Configure these in Azure App Service Configuration:

```bash
# Node.js Configuration
WEBSITE_NODE_DEFAULT_VERSION=20.19.3
NODE_ENV=production
PORT=8080

# Database
MONGO_URI=your-mongodb-connection-string
SKIP_MONGO=false

# API Keys
GOOGLE_PLACES_API_KEY=your-google-places-key
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

# Firebase Admin (Base64 encoded service account JSON)
FIREBASE_ADMIN_CREDENTIALS_BASE64=your-base64-encoded-credentials

# Security
ADMIN_API_KEY=your-admin-api-key
JWT_SECRET=your-jwt-secret

# Features
ENABLE_FIREBASE_AUTH=true
ENABLE_STRIPE=false
ENFORCE_QUOTAS=false
```

## 🏗️ Project Structure

```
travelbuddy-2/
├── frontend/          # React frontend (Vite)
├── backend/           # Node.js/Express API
├── admin/             # Admin dashboard (React)
├── travel_buddy_mobile/ # Flutter mobile app
├── .github/workflows/ # GitHub Actions
├── deploy.sh          # Deployment script
├── startup.js         # Azure startup script
├── web.config         # IIS configuration
└── package.json       # Root package.json
```

## 🔄 Deployment Process

### Automatic Deployment (Recommended)

1. **Push to main/master branch** - Triggers automatic deployment
2. **Manual deployment** - Use GitHub Actions workflow dispatch

### Manual Deployment Steps

1. **Prepare environment:**
   ```bash
   npm run install:all
   ```

2. **Build all components:**
   ```bash
   npm run build
   ```

3. **Deploy to Azure:**
   ```bash
   ./deploy.sh
   ```

## 📦 Build Process

The deployment process includes:

1. **Frontend Build** (`frontend/`)
   - Install dependencies with `npm ci`
   - Build with Vite for production
   - Output to `frontend/dist/`

2. **Admin Build** (`admin/`)
   - Install dependencies with `npm ci`
   - Build React admin dashboard
   - Output to `admin/dist/`

3. **Backend Setup** (`backend/`)
   - Install production dependencies only
   - Copy frontend build to `backend/public/`
   - Copy admin build to `backend/admin/`

4. **Configuration**
   - Generate optimized `web.config`
   - Set up IIS routing rules
   - Configure static file serving

## 🌐 URL Structure

After deployment, your application will be available at:

- **Main App:** `https://your-app-name.azurewebsites.net/`
- **Admin Panel:** `https://your-app-name.azurewebsites.net/admin/`
- **API Endpoints:** `https://your-app-name.azurewebsites.net/api/`
- **Health Check:** `https://your-app-name.azurewebsites.net/api/health`

## 🔍 Health Checks

The deployment includes comprehensive health checks:

- ✅ API health endpoint (`/api/health`)
- ✅ Frontend loading test
- ✅ Admin dashboard accessibility
- ✅ Key API endpoints validation

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check Node.js version
   node --version  # Should be 20.x
   
   # Clear caches
   npm run clean
   npm run install:all
   ```

2. **Deployment Failures**
   - Check Azure App Service logs
   - Verify GitHub secrets are set correctly
   - Ensure publish profile is valid

3. **Runtime Issues**
   - Check Azure App Service logs in Kudu console
   - Verify environment variables in Azure portal
   - Test API endpoints individually

### Log Access

- **Azure Portal:** App Service → Monitoring → Log stream
- **Kudu Console:** `https://your-app-name.scm.azurewebsites.net/`
- **Application Insights:** If configured

## 🔧 Configuration Files

### `web.config`
- IIS routing configuration
- Static file serving
- Compression and caching
- Security headers

### `startup.js`
- Application startup script
- Environment validation
- Error handling

### `deploy.sh`
- Build and deployment automation
- File copying and cleanup
- Configuration generation

## 📊 Performance Optimization

The deployment includes several optimizations:

- **Static file compression** (gzip)
- **Browser caching** (30 days for static assets)
- **CDN-ready** static file serving
- **Minified builds** for frontend and admin
- **Production-only** dependencies for backend

## 🔒 Security Features

- **Security headers** (CSP, XSS protection)
- **Request filtering** and size limits
- **Hidden segments** protection
- **HTTPS enforcement** (configure in Azure)

## 🚀 Scaling Considerations

For high-traffic scenarios:

1. **Scale up** to higher App Service Plan (S1, P1V2, etc.)
2. **Scale out** with multiple instances
3. **Enable Application Insights** for monitoring
4. **Configure CDN** for static assets
5. **Implement Redis cache** for session storage

## 📈 Monitoring

Set up monitoring with:

- **Application Insights** for performance tracking
- **Azure Monitor** for infrastructure metrics
- **Log Analytics** for centralized logging
- **Alerts** for critical issues

## 🔄 Rollback Strategy

In case of deployment issues:

1. **Automatic rollback** is configured for critical failures
2. **Manual rollback** via Azure portal deployment slots
3. **Previous version** restoration from GitHub

## 📞 Support

For deployment issues:

1. Check this documentation
2. Review Azure App Service logs
3. Verify GitHub Actions workflow logs
4. Check Azure portal for service health

---

**Last Updated:** $(date)
**Version:** 1.0.0