# Production APK Build Instructions

## Prerequisites
1. Install Java JDK (for keytool)
2. Flutter SDK installed
3. Android SDK configured

## Step 1: Generate Keystore
```bash
cd travel_buddy_mobile/android/keystore
keytool -genkey -v -keystore travelbuddy-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias travelbuddy
```

## Step 2: Build Production APK
```bash
cd travel_buddy_mobile
flutter clean
flutter pub get
flutter build apk --release
```

## Step 3: Build App Bundle (for Play Store)
```bash
flutter build appbundle --release
```

## Output Locations
- APK: `build/app/outputs/flutter-apk/app-release.apk`
- AAB: `build/app/outputs/bundle/release/app-release.aab`

## Configuration Complete ✅
- App ID: com.travelbuddy.mobile
- Version: 1.0.0 (1)
- Signing: Configured
- ProGuard: Enabled
- Minification: Enabled