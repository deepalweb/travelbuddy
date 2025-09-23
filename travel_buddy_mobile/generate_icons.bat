@echo off
echo 🎨 Generating app icons from assets/app_logo.png...
echo.

echo 📱 Installing flutter_launcher_icons...
flutter pub get

echo 🚀 Generating launcher icons...
flutter pub run flutter_launcher_icons:main

echo ✅ App icons generated successfully!
echo.
echo 📋 Next steps:
echo 1. Build your app: flutter build apk
echo 2. Check the generated icons in android/app/src/main/res/
echo 3. For iOS, check ios/Runner/Assets.xcassets/AppIcon.appiconset/
echo.
pause