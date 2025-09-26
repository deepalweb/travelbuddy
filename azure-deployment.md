# Azure Production Deployment Guide

## 🔵 Step 1: Azure App Service Configuration

### 1.1 Environment Variables in Azure
Go to Azure Portal → Your App Service → Configuration → Application Settings

Add these environment variables:

```
PAYPAL_CLIENT_ID = your_production_paypal_client_id
PAYPAL_SECRET = your_production_paypal_secret  
PAYPAL_WEBHOOK_SECRET = your_webhook_secret
PAYPAL_ENVIRONMENT = live
MONGO_URI = mongodb+srv://deepalr:qn7q9Y64AOjrdLbe@cluster0.oybjzf7.mongodb.net/travelbuddy?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET = your_super_secure_jwt_secret_min_32_chars
SESSION_SECRET = your_super_secure_session_secret
ADMIN_API_KEY = your_secure_admin_key
NODE_ENV = production
ENABLE_HTTPS = false
GOOGLE_PLACES_API_KEY = AIzaSyAey-fuui7b3I-PkzJDVfsTFa9Kv_b_6ls
GEMINI_API_KEY = AIzaSyBTAYqrMpZYcVjzFTW9V9RH-IWDacEzXRo
FIREBASE_ADMIN_CREDENTIALS_JSON = {"type":"service_account","project_id":"travelbuddy-2d1c5",...}
```

### 1.2 SSL Certificate (Azure handles this automatically)
- Azure App Service provides free SSL certificates
- Your domain will be: `https://your-app-name.azurewebsites.net`
- Custom domain SSL available in paid tiers

## 🔵 Step 2: PayPal Production Setup

### 2.1 Get Production PayPal Credentials
1. Login to https://developer.paypal.com
2. Switch to "Live" mode (top right toggle)
3. Create new Live App:
   - Name: "Travel Buddy Subscriptions"
   - Features: ✅ Accept payments, ✅ Subscriptions
4. Copy credentials to Azure environment variables

### 2.2 Setup PayPal Webhooks
1. In PayPal Developer Console → Webhooks
2. Add webhook URL: `https://your-app-name.azurewebsites.net/api/webhooks/paypal/webhook`
3. Select events:
   - ✅ Payment capture completed
   - ✅ Payment capture denied  
   - ✅ Billing subscription created
   - ✅ Billing subscription cancelled
4. Copy webhook secret to Azure `PAYPAL_WEBHOOK_SECRET`

## 🔵 Step 3: Update Mobile App

Update your mobile app environment with Azure URL:

```dart
// lib/config/environment.dart
static const String backendUrl = 'https://your-app-name.azurewebsites.net';
static const bool isProduction = true;
```

## 🔵 Step 4: Deploy to Azure

### Option A: GitHub Actions (Recommended)
```yaml
# .github/workflows/azure-deploy.yml
name: Deploy to Azure
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: |
        cd backend
        npm install
        npm run build
    - uses: azure/webapps-deploy@v2
      with:
        app-name: 'your-app-name'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./backend
```

### Option B: Azure CLI
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login and deploy
az login
cd backend
zip -r ../deploy.zip .
az webapp deployment source config-zip --resource-group your-resource-group --name your-app-name --src ../deploy.zip
```

### Option C: VS Code Extension
1. Install "Azure App Service" extension
2. Right-click backend folder → "Deploy to Web App"
3. Select your Azure subscription and app

## 🔵 Step 5: Verification

Test your Azure deployment:

```bash
# Health check
curl https://your-app-name.azurewebsites.net/health

# API test  
curl https://your-app-name.azurewebsites.net/api/test-deployment

# Subscription test
curl -X POST https://your-app-name.azurewebsites.net/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","tier":"basic","status":"trial","startDate":"2024-01-01","endDate":"2024-01-08"}'
```

## 🔵 Step 6: Monitoring Setup

### Azure Application Insights
1. Go to Azure Portal → Your App Service → Application Insights
2. Enable Application Insights
3. Monitor:
   - API response times
   - Error rates
   - Payment webhook calls
   - Database connections

### Log Streaming
```bash
# View live logs
az webapp log tail --name your-app-name --resource-group your-resource-group
```

## ✅ Azure-Specific Benefits

- ✅ **Free SSL**: Automatic HTTPS with Azure-provided certificates
- ✅ **Auto-scaling**: Handle payment spikes automatically  
- ✅ **Built-in monitoring**: Application Insights included
- ✅ **Easy deployment**: Multiple deployment options
- ✅ **Environment variables**: Secure configuration management
- ✅ **Custom domains**: Add your own domain with SSL

## 🚨 Important Notes

1. **ENABLE_HTTPS = false** in Azure (Azure handles SSL termination)
2. **Use Azure environment variables** (never commit secrets)
3. **Monitor Application Insights** for payment issues
4. **Set up alerts** for failed payments or API errors
5. **Test webhook URL** after deployment

Your Azure URL will be: `https://your-app-name.azurewebsites.net`