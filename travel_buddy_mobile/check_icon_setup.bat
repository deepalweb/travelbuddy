@echo off
echo 🔍 Checking Travel Buddy app icon setup...
echo.

echo 📁 Checking source icon file:
if exist "assets\app_logo.png" (
    echo ✅ assets/app_logo.png exists
) else (
    echo ❌ assets/app_logo.png NOT FOUND
    echo Please ensure your app icon is saved as assets/app_logo.png
    pause
    exit /b 1
)

echo.
echo 📱 Checking Android icons:
if exist "android\app\src\main\res\mipmap-hdpi\ic_launcher.png" (
    echo ✅ Android icons generated
) else (
    echo ⚠️ Android icons not generated yet
    echo Run generate_icons_fixed.bat to create them
)

echo.
echo 📋 Current AndroidManifest.xml icon setting:
findstr "android:icon" android\app\src\main\AndroidManifest.xml

echo.
echo 🔧 pubspec.yaml flutter_launcher_icons config:
findstr /C:"flutter_launcher_icons:" pubspec.yaml
findstr /C:"image_path:" pubspec.yaml
findstr /C:"android:" pubspec.yaml

echo.
echo ✅ Icon setup check complete!
pause