# Admin Portal Azure Deployment

## 🚀 Deployment Options

### Option 1: Azure Static Web Apps (Recommended)

1. **Create Azure Static Web App**:
   ```bash
   az staticwebapp create \
     --name travel-buddy-admin \
     --resource-group travelbuddy \
     --source https://github.com/yourusername/travelbuddy-2 \
     --location eastus2 \
     --branch master \
     --app-location "/admin" \
     --output-location "dist"
   ```

2. **Set GitHub Secret**:
   - Get deployment token from Azure portal
   - Add `AZURE_STATIC_WEB_APPS_API_TOKEN` to GitHub secrets

3. **Auto-deploy**: Push to master branch triggers deployment

### Option 2: Azure App Service

1. **Build locally**:
   ```bash
   cd admin
   npm install
   npm run build
   ```

2. **Deploy via Azure CLI**:
   ```bash
   az webapp up --name travel-buddy-admin --resource-group travelbuddy --location eastus2
   ```

## 📋 Required Dependencies

### GitHub Secrets:
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - From Azure Static Web Apps

### Environment Variables:
- `VITE_API_BASE_URL` - Your backend URL

## 🔧 Configuration Files

- `staticwebapp.config.json` - Azure Static Web Apps config
- `.github/workflows/admin-deploy.yml` - Auto-deployment
- `vite.config.ts` - Build configuration

## 🌐 Access

After deployment:
- Admin Portal: `https://travel-buddy-admin.azurestaticapps.net`
- Connected to: `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net`