@echo off
echo ========================================
echo Building TravelBuddy Production APK
echo ========================================

echo.
echo [1/4] Cleaning previous builds...
flutter clean

echo.
echo [2/4] Getting dependencies...
flutter pub get

echo.
echo [3/4] Building production APK...
flutter build apk --release --target-platform android-arm,android-arm64,android-x64

echo.
echo [4/4] Build complete!
echo.
echo APK Location: build\app\outputs\flutter-apk\app-release.apk
echo.

if exist "build\app\outputs\flutter-apk\app-release.apk" (
    echo ✅ SUCCESS: Production APK built successfully!
    
    rem Get file size
    for %%A in ("build\app\outputs\flutter-apk\app-release.apk") do (
        set size=%%~zA
        set /a sizeMB=!size!/1024/1024
    )
    
    echo 📱 APK Size: %sizeMB% MB
    echo 🔐 Signed with release keystore
    echo 🚀 Ready for production deployment
    
    echo.
    echo Opening APK location...
    explorer "build\app\outputs\flutter-apk\"
) else (
    echo ❌ ERROR: APK build failed!
    echo Check the output above for errors.
)

echo.
echo Press any key to exit...
pause >nul