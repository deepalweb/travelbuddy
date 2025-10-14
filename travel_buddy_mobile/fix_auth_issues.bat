@echo off
echo ========================================
echo Travel Buddy - Authentication Fix
echo ========================================
echo.

echo 1. Cleaning Flutter project...
flutter clean

echo.
echo 2. Getting dependencies...
flutter pub get

echo.
echo 3. Rebuilding project...
flutter build apk --debug

echo.
echo ========================================
echo Authentication Fix Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Test email sign-in (should work immediately)
echo 2. For Google Sign-In:
echo    - Ensure Google Play Services is updated on device
echo    - Add SHA-1 fingerprint to Firebase Console
echo    - Test on real device (not emulator)
echo.
echo If Google Sign-In still fails, use email authentication.
echo.
pause