# Google Sign-in Fix

## Issue
"Google Sign-in is currently unavailable" error occurs because the SHA-1 fingerprint is not properly configured in Firebase Console.

## Your SHA-1 Fingerprint
```
A1:86:97:C0:BC:76:25:58:DC:1B:11:D5:64:A1:CD:E6:CD:3E:4F:74
```

## Quick Fix Steps

### 1. Firebase Console Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `travelbuddy-2d1c5`
3. Go to **Project Settings** (gear icon)
4. Select **Your apps** tab
5. Find your Android app: `com.example.travel_buddy_mobile`
6. Click **Add fingerprint**
7. Paste: `A1:86:97:C0:BC:76:25:58:DC:1B:11:D5:64:A1:CD:E6:CD:3E:4F:74`
8. Click **Save**

### 2. Download Updated google-services.json
1. After adding the fingerprint, download the updated `google-services.json`
2. Replace the current file at: `android/app/google-services.json`

### 3. Rebuild APK
```bash
cd travel_buddy_mobile
flutter clean
flutter pub get
flutter build apk --release
```

## Alternative: Use Email Sign-in Only
If you prefer to disable Google Sign-in temporarily, the app already supports email authentication through Firebase Auth.

## Current Status
- ✅ Firebase Auth (Email) - Working
- ❌ Google Sign-in - Needs SHA-1 configuration
- ✅ All other features - Working

The app will work perfectly with email sign-in while you configure Google Sign-in.