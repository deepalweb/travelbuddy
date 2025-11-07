# Google Sign-In Fix for Azure App (travelbuddylk.com)

## 🔍 **Issue Identified:**
Google Sign-In not working on production domain `https://travelbuddylk.com`

## 🎯 **Root Cause:**
Firebase project not configured with production domain as authorized domain

## ✅ **Solution Steps:**

### 1. **Firebase Console Configuration**
Go to [Firebase Console](https://console.firebase.google.com/project/travelbuddy-2d1c5/authentication/settings)

**Add Authorized Domains:**
- `travelbuddylk.com`
- `www.travelbuddylk.com`
- `travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net` (Azure domain)

### 2. **Google Cloud Console Configuration**
Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials?project=travelbuddy-2d1c5)

**Update OAuth 2.0 Client:**
- Add `https://travelbuddylk.com` to Authorized JavaScript origins
- Add `https://www.travelbuddylk.com` to Authorized JavaScript origins
- Add `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net` to Authorized JavaScript origins

### 3. **Current Firebase Config (Verified Working):**
```javascript
{
  apiKey: 'AIzaSyCuJr5N0ytr1h_Aq_5qQazNL0wQUnsZlAw',
  authDomain: 'travelbuddy-2d1c5.firebaseapp.com',
  projectId: 'travelbuddy-2d1c5',
  storageBucket: 'travelbuddy-2d1c5.firebasestorage.app',
  messagingSenderId: '45425409967',
  appId: '1:45425409967:web:782638c65a40dcb156b95a'
}
```

## 🚀 **Quick Fix Steps:**

1. **Login to Firebase Console**
2. **Go to Authentication > Settings > Authorized Domains**
3. **Click "Add Domain"**
4. **Add:** `travelbuddylk.com`
5. **Add:** `www.travelbuddylk.com`
6. **Save Changes**

## 🔧 **Alternative: Update Firebase Config**
If domain authorization doesn't work, update the authDomain:

```javascript
// Change from:
authDomain: 'travelbuddy-2d1c5.firebaseapp.com'

// To:
authDomain: 'travelbuddylk.com'
```

## ✅ **Expected Result:**
After adding authorized domains, Google Sign-In should work on:
- ✅ https://travelbuddylk.com
- ✅ https://www.travelbuddylk.com
- ✅ Azure subdomain

## 🔍 **Testing:**
1. Visit https://travelbuddylk.com
2. Click "Sign in with Google"
3. Should open Google OAuth popup
4. Should successfully authenticate and redirect back