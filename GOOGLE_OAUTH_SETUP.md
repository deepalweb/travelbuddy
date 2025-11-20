# Google OAuth Setup for travelbuddylk.com

## Required Configuration

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project: `travelbuddy-2d1c5`
3. Navigate to **APIs & Services** > **Credentials**

### 2. OAuth 2.0 Client Configuration
Update your OAuth 2.0 client with these settings:

**Authorized JavaScript origins:**
```
https://travelbuddylk.com
https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net
```

**Authorized redirect URIs:**
```
https://travelbuddylk.com/__/auth/handler
https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/__/auth/handler
```

### 3. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `travelbuddy-2d1c5`
3. Go to **Authentication** > **Sign-in method**
4. Enable **Google** provider
5. Add authorized domains:
   - `travelbuddylk.com`
   - `travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net`

### 4. Domain Verification
Ensure both domains are added to:
- Firebase authorized domains
- Google OAuth authorized origins
- CORS settings if applicable

## Testing
After configuration, test Google Sign-in at:
- https://travelbuddylk.com/login
- https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/login