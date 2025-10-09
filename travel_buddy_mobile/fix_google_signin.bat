@echo off
echo Fixing Google Sign-In PigeonUserDetails error...
echo.

echo Step 1: Cleaning Flutter project...
flutter clean

echo.
echo Step 2: Getting updated dependencies...
flutter pub get

echo.
echo Step 3: Clearing pub cache for google_sign_in...
flutter pub cache repair

echo.
echo Step 4: Getting dependencies again...
flutter pub get

echo.
echo Step 5: Building for Android...
flutter build apk --debug

echo.
echo Google Sign-In fix complete!
echo.
echo If the error persists:
echo 1. Update Google Play Services on your device
echo 2. Clear Google Play Services cache
echo 3. Use email sign-in as alternative
echo 4. Test on a real device (not emulator)
echo.
pause