# Firebase Setup Guide

## Step 1: Firebase Console
1. Go to: https://console.firebase.google.com
2. Create project: "travel-buddy"
3. Add Android app with package: `com.example.travel_buddy_mobile`

## Step 2: Download google-services.json
1. Download the file from Firebase Console
2. Place it at: `android/app/google-services.json`

## Step 3: Get Configuration Values
In Firebase Console → Project Settings → Your Android app, copy these values:

```
Project ID: [YOUR_PROJECT_ID]
App ID: [YOUR_APP_ID] 
API Key: [YOUR_API_KEY]
Sender ID: [YOUR_SENDER_ID]
```

## Step 4: Update firebase_options.dart
Replace the android section with your real values:

```dart
static const FirebaseOptions android = FirebaseOptions(
  apiKey: 'YOUR_API_KEY_HERE',
  appId: 'YOUR_APP_ID_HERE', 
  messagingSenderId: 'YOUR_SENDER_ID_HERE',
  projectId: 'YOUR_PROJECT_ID_HERE',
  storageBucket: 'YOUR_PROJECT_ID_HERE.appspot.com',
);
```

## Step 5: Enable Authentication
1. Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password" 
3. Enable "Google"
4. Copy the Web client ID for Google Sign-In

## Step 6: Test
Set `useMockAuth = false` in `lib/config/environment.dart` and run the app.