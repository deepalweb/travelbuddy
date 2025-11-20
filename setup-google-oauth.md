# Fix Google OAuth - Create New Credentials

## The Issue
OAuth client was deleted. Need to create new Google OAuth credentials.

## Quick Fix Steps

### 1. Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials?project=travelbuddy-2d1c5

### 2. Create OAuth 2.0 Client ID
- Click "Create Credentials" > "OAuth 2.0 Client ID"
- Application type: "Web application"
- Name: "TravelBuddy Web App"

### 3. Add Authorized URLs
**Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:3001
https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net
```

**Authorized redirect URIs:**
```
http://localhost:3000/__/auth/handler
http://localhost:3001/__/auth/handler
https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/__/auth/handler
```

### 4. Update Environment Files
Copy the new Client ID and Secret to:
- `backend/.env` - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Firebase Console Authentication settings

### 5. Enable APIs
Ensure these APIs are enabled:
- Google+ API
- Google Identity and Access Management (IAM) API