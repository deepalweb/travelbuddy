@echo off
echo Building TravelBuddy Production APK...

echo Step 1: Clean previous builds
flutter clean

echo Step 2: Get dependencies
flutter pub get

echo Step 3: Build production APK with environment variables
flutter build apk --release --dart-define=BACKEND_URL=https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net --dart-define=IS_PRODUCTION=true --dart-define-from-file=.env --target-platform android-arm,android-arm64,android-x64

echo Step 4: Build App Bundle (for Play Store)
flutter build appbundle --release --dart-define-from-file=.env

echo Build completed!
echo APK location: build\app\outputs\flutter-apk\app-release.apk
echo AAB location: build\app\outputs\bundle\release\app-release.aab

pause