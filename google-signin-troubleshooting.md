# Google Sign-In Troubleshooting Guide

## Issue: Google Sign-In popup closes without authentication

### Current Status
- **Problem**: Google Sign-In popup opens, user selects account, popup shows loading, then closes without completing authentication
- **Domain**: https://travelbuddylk.com
- **Firebase Project**: travelbuddy-2d1c5

### Root Cause Analysis

The issue is **Firebase Console domain authorization**. The domain `travelbuddylk.com` is not authorized in Firebase Console.

### Solution Steps

#### 1. Firebase Console Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **travelbuddy-2d1c5**
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add these domains:
   - `travelbuddylk.com`
   - `www.travelbuddylk.com`
   - `travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net` (Azure backup)

#### 2. Google Cloud Console Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **travelbuddy-2d1c5**
3. Navigate to **APIs & Services** → **Credentials**
4. Find the OAuth 2.0 Client ID for web application
5. Add to **Authorized JavaScript origins**:
   - `https://travelbuddylk.com`
   - `https://www.travelbuddylk.com`
6. Add to **Authorized redirect URIs**:
   - `https://travelbuddylk.com/__/auth/handler`
   - `https://www.travelbuddylk.com/__/auth/handler`

### Verification Steps

#### Test Firebase Configuration
```bash
# Test Firebase config endpoint
curl https://travelbuddylk.com/api/runtime-config

# Test Firebase debug endpoint (after deployment)
curl https://travelbuddylk.com/api/firebase-debug
```

#### Test Google Sign-In
1. Open https://travelbuddylk.com
2. Click "Continue with Google (Popup)"
3. Select Google account
4. Should complete authentication successfully

#### Browser Console Debugging
Open browser developer tools and check for errors:
```javascript
// Check Firebase initialization
console.log('Firebase config:', firebase.app().options);

// Check auth domain
console.log('Auth domain:', firebase.app().options.authDomain);

// Check current domain
console.log('Current domain:', window.location.hostname);
```

### Common Error Messages

#### "auth/unauthorized-domain"
- **Cause**: Domain not authorized in Firebase Console
- **Solution**: Add domain to Firebase Console authorized domains

#### "auth/popup-blocked"
- **Cause**: Browser blocking popup
- **Solution**: Allow popups for the site or use redirect method

#### "auth/popup-closed-by-user"
- **Cause**: User closed popup (normal behavior)
- **Solution**: No action needed, user can try again

### Code Implementation

The app has two Google Sign-In methods:

#### 1. Popup Method (Primary)
```javascript
const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  
  const result = await signInWithPopup(firebase.auth, provider);
  // Handle success
}
```

#### 2. Redirect Method (Fallback)
```javascript
const loginWithGoogleRedirect = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  
  await signInWithRedirect(firebase.auth, provider);
  // Page will redirect and return
}
```

### Testing Checklist

- [ ] Firebase Console: Domain added to authorized domains
- [ ] Google Cloud Console: Domain added to OAuth origins
- [ ] Google Cloud Console: Redirect URIs configured
- [ ] Browser: Popups allowed for the domain
- [ ] Network: No CORS errors in browser console
- [ ] Firebase: Config loading correctly from `/api/runtime-config`

### Debug Endpoints

After deployment, use these endpoints for debugging:

```bash
# Check Firebase configuration
GET https://travelbuddylk.com/api/firebase-debug

# Check runtime configuration
GET https://travelbuddylk.com/api/runtime-config

# Check authentication status
GET https://travelbuddylk.com/api/auth/status
```

### Expected Response After Fix

When working correctly:
1. User clicks "Continue with Google"
2. Popup opens with Google OAuth screen
3. User selects account and grants permissions
4. Popup closes automatically
5. User is signed in and redirected to dashboard

### Backup Authentication Methods

If Google Sign-In still fails:
1. **Demo Admin Login**: Use the "🛡️ Demo Admin Login" button
2. **Email/Password**: Register with email and password
3. **Redirect Method**: Use "Try Google (Redirect)" button

### Support Information

- **Firebase Project ID**: travelbuddy-2d1c5
- **Auth Domain**: travelbuddy-2d1c5.firebaseapp.com
- **Production URL**: https://travelbuddylk.com
- **Azure URL**: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net

### Next Steps

1. **Immediate**: Add domains to Firebase Console
2. **Verify**: Test Google Sign-In after domain authorization
3. **Monitor**: Check browser console for any remaining errors
4. **Document**: Update this guide with any additional findings