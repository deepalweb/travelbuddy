# Google Sign-In Setup Guide

## Current Issue
Your app is using mock/placeholder Firebase configuration instead of real Google services, causing authentication to fail with mock users.

## Steps to Fix

### 1. Get Your App's SHA-1 Fingerprint

Run this command in your project root:
```bash
cd android
./gradlew signingReport
```

Look for the SHA1 fingerprint under "Variant: debug" -> "Store: ~/.android/debug.keystore"

### 2. Update Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `travelbuddy-2d1c5`
3. Go to Project Settings > General
4. Under "Your apps", find your Android app
5. Add the SHA-1 fingerprint you got from step 1
6. Download the new `google-services.json` file

### 3. Replace Configuration Files

Replace the current `google-services.json` with the downloaded one from Firebase Console.

### 4. Update Client IDs

In the new `google-services.json`, find these values and update the placeholders:
- Replace `YOUR_ANDROID_CLIENT_ID` with the actual Android client ID
- Replace `YOUR_WEB_CLIENT_ID` with the actual web client ID
- Replace `YOUR_SHA1_FINGERPRINT` with your actual SHA-1 fingerprint

### 5. For iOS (if needed)

1. In Firebase Console, add an iOS app
2. Download `GoogleService-Info.plist`
3. Place it in `ios/Runner/`
4. Update the iOS app ID in `firebase_options.dart`

### 6. Test the Configuration

After updating:
1. Clean and rebuild your app: `flutter clean && flutter pub get`
2. Test Google Sign-In on a real device or emulator
3. Check Firebase Console > Authentication > Users to see real user data

## Verification

Your Google Sign-In should now work with real Google accounts instead of mock users.