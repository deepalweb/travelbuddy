@echo off
echo 🎨 Generating Travel Buddy app icons...
echo.

echo 📱 Installing dependencies...
flutter pub get

echo 🚀 Generating launcher icons from assets/app_logo.png...
flutter pub run flutter_launcher_icons

echo ✅ App icons generated successfully!
echo.
echo 📋 Generated icons:
echo - Android: android/app/src/main/res/mipmap-*/ic_launcher.png
echo - iOS: ios/Runner/Assets.xcassets/AppIcon.appiconset/
echo - Web: web/icons/
echo - Windows: windows/runner/resources/
echo.
echo 🔧 Next steps:
echo 1. Clean build: flutter clean
echo 2. Get dependencies: flutter pub get  
echo 3. Build release: flutter build apk --release
echo 4. Install and test the APK
echo.
pause