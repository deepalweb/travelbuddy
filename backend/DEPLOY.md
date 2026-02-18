# Backend Deployment Guide

## Deploy to Azure App Service

### 1. Commit Changes
```bash
cd backend
git add .
git commit -m "Add legal routes for privacy and terms"
```

### 2. Deploy to Azure
```bash
git push azure main
```

### 3. Add Google Places API Key (CRITICAL)
1. Go to Azure Portal: https://portal.azure.com
2. Navigate to your App Service: `travelbuddy-b2c6hgbbgeh4esdh`
3. Go to **Configuration** → **Application settings**
4. Click **+ New application setting**
5. Add:
   - Name: `GOOGLE_PLACES_API_KEY`
   - Value: `YOUR_ACTUAL_GOOGLE_API_KEY`
6. Click **Save**
7. Click **Restart** to apply changes

### 4. Verify Deployment
Test these URLs in browser:
- https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/privacy
- https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/terms
- https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/health

## Troubleshooting

### If privacy/terms return 404:
```bash
# Check deployment logs in Azure Portal
# Ensure legal.js is in routes folder
# Verify server.js has legal routes registered
```

### If API key not working:
```bash
# Verify in Azure Portal → Configuration
# Restart app service after adding
# Check logs for "GOOGLE_PLACES_API_KEY configured"
```
