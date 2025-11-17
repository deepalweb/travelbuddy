@echo off
echo Building TravelBuddy Production APK...

echo Step 1: Clean previous builds
flutter clean

echo Step 2: Get dependencies
flutter pub get

echo Step 3: Build production APK
flutter build apk --release --target-platform android-arm,android-arm64,android-x64

echo Step 4: Build App Bundle (for Play Store)
flutter build appbundle --release

echo Build completed!
echo APK location: build\app\outputs\flutter-apk\app-release.apk
echo AAB location: build\app\outputs\bundle\release\app-release.aab

pause