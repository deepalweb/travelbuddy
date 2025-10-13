# Azure App Service Deployment Configuration

## ✅ Environment Variables Configured

Your Azure App Service has all required environment variables set:

### Core Configuration
- `NODE_ENV` - Production environment
- `NPM_CONFIG_PRODUCTION` - Production build settings
- `SCM_DO_BUILD_DURING_DEPLOYMENT` - Auto-build on deployment

### Firebase Configuration
- `ENABLE_FIREBASE_AUTH=true`
- `FIREBASE_ADMIN_CREDENTIALS_JSON` - Service account credentials
- `VITE_FIREBASE_*` - Client-side Firebase config

### API Keys
- `GOOGLE_PLACES_API_KEY` - Google Places API
- `AZURE_OPENAI_*` - Azure OpenAI integration
- `VITE_GEMINI_API_KEY` - Gemini AI integration

### Database & Security
- `MONGO_URI` - MongoDB connection
- `JWT_SECRET` - JWT token signing
- `SESSION_SECRET` - Session encryption
- `ADMIN_API_KEY` - Admin authentication

### PayPal Integration
- `PAYPAL_CLIENT_ID` - PayPal sandbox client
- `PAYPAL_SECRET` - PayPal sandbox secret
- `PAYPAL_ENVIRONMENT` - Sandbox environment

## Deployment Commands

### Deploy Backend to Azure
```bash
# Build and deploy
npm run build
git add .
git commit -m "Deploy to Azure"
git push origin master
```

### Azure App Service Settings
- **Runtime**: Node.js 18 LTS
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

## Verification Steps

1. **Check deployment**: Visit your Azure App Service URL
2. **Test API**: `https://your-app.azurewebsites.net/health`
3. **Verify Firebase**: Check authentication endpoints
4. **Test mobile app**: Update backend URL in Flutter app

## Mobile App Configuration

Update `travel_buddy_mobile/lib/config/environment.dart`:
```dart
static const String backendUrl = 'https://your-app.azurewebsites.net';
```

Then rebuild APK:
```bash
cd travel_buddy_mobile
flutter clean
flutter pub get
flutter build apk --release
```

## Status: ✅ Ready for Production

Your Azure App Service is properly configured with all required environment variables for production deployment.