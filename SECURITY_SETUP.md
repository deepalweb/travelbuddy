# Security Setup Guide

## ⚠️ IMPORTANT: API Keys Configuration

This project uses environment variables and local configuration files to keep API keys secure.

---

## Backend Setup

1. Create `backend/.env` file (already in .gitignore):
```env
GOOGLE_PLACES_API_KEY=your_google_places_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
AZURE_OPENAI_API_KEY=your_azure_openai_key_here
AZURE_OPENAI_ENDPOINT=your_azure_endpoint_here
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name_here
MONGODB_URI=your_mongodb_connection_string_here
```

2. **Never commit `.env` files to git!**

---

## Mobile App Setup

1. Add Google Maps API key to `travel_buddy_mobile/android/local.properties`:
```properties
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

2. This file is already in `.gitignore` and won't be committed.

---

## Azure Deployment

Set environment variables in Azure App Service:
1. Go to Azure Portal → Your App Service
2. Settings → Configuration → Application settings
3. Add each key from `.env` file

---

## Security Best Practices

✅ **DO:**
- Use environment variables for all API keys
- Restrict API keys in Google Cloud Console
- Rotate keys if exposed
- Use backend endpoints instead of direct API calls from mobile

❌ **DON'T:**
- Hardcode API keys in source code
- Commit `.env` or `local.properties` files
- Share API keys in chat/email
- Use production keys in development

---

## Key Restrictions (Google Cloud Console)

### Google Maps API Key (Mobile):
- Application restrictions: Android apps
- Package name: `com.example.travel_buddy_mobile`
- SHA-1 fingerprint: (your app's fingerprint)

### Google Places API Key (Backend):
- Application restrictions: HTTP referrers
- Website restrictions: `https://travelbuddy-*.azurewebsites.net/*`

---

## If Keys Are Exposed

1. **Immediately rotate** all exposed keys in Google Cloud Console
2. Update keys in:
   - `backend/.env`
   - `travel_buddy_mobile/android/local.properties`
   - Azure App Service configuration
3. Redeploy backend to Azure
4. Rebuild mobile app

---

## Current Status

✅ Backend API keys: Secured in environment variables
✅ Mobile API keys: Moved to local.properties (not committed)
✅ Firebase keys: Client-side keys (protected by Firebase rules)
⚠️ **ACTION REQUIRED**: Rotate any keys that were previously committed to git
