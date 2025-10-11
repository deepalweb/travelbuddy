@echo off
echo Building Travel Buddy APK...

echo Step 1: Cleaning previous builds...
flutter clean

echo Step 2: Getting dependencies...
flutter pub get

echo Step 3: Building APK...
flutter build apk --release

echo Step 4: Checking build output...
if exist "build\app\outputs\flutter-apk\app-release.apk" (
    echo ✅ APK built successfully!
    echo Location: build\app\outputs\flutter-apk\app-release.apk
    echo File size:
    dir "build\app\outputs\flutter-apk\app-release.apk" | findstr "app-release.apk"
) else (
    echo ❌ APK build failed!
    echo Check the error messages above.
)

pause