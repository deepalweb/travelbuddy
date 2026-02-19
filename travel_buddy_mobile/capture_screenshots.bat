@echo off
echo ========================================
echo Travel Buddy - Screenshot Capture Tool
echo ========================================
echo.

REM Create screenshots directory
if not exist "screenshots" mkdir screenshots
if not exist "screenshots\phone" mkdir screenshots\phone
if not exist "screenshots\tablet" mkdir screenshots\tablet

echo Step 1: Make sure your app is running on emulator/device
echo Step 2: Navigate to each screen before capturing
echo.
pause

echo.
echo Capturing Phone Screenshots...
echo.

echo [1/8] Capture Home/Explore Screen
echo Navigate to Home screen, then press any key...
pause >nul
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots\phone\phone_1_home.png
echo ✓ Saved: phone_1_home.png
echo.

echo [2/8] Capture Trip Planning Screen
echo Navigate to Trip Planning, then press any key...
pause >nul
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots\phone\phone_2_trip_planning.png
echo ✓ Saved: phone_2_trip_planning.png
echo.

echo [3/8] Capture Community Screen
echo Navigate to Community, then press any key...
pause >nul
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots\phone\phone_3_community.png
echo ✓ Saved: phone_3_community.png
echo.

echo [4/8] Capture Profile Screen
echo Navigate to Profile, then press any key...
pause >nul
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots\phone\phone_4_profile.png
echo ✓ Saved: phone_4_profile.png
echo.

echo [5/8] Capture Place Details Screen
echo Navigate to Place Details, then press any key...
pause >nul
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots\phone\phone_5_place_details.png
echo ✓ Saved: phone_5_place_details.png
echo.

echo [6/8] Capture Map View
echo Navigate to Map, then press any key...
pause >nul
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots\phone\phone_6_map.png
echo ✓ Saved: phone_6_map.png
echo.

echo [7/8] Capture Deals Screen
echo Navigate to Deals, then press any key...
pause >nul
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots\phone\phone_7_deals.png
echo ✓ Saved: phone_7_deals.png
echo.

echo [8/8] Capture Safety Hub
echo Navigate to Safety Hub, then press any key...
pause >nul
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots\phone\phone_8_safety.png
echo ✓ Saved: phone_8_safety.png
echo.

echo ========================================
echo Phone Screenshots Complete!
echo ========================================
echo.
echo Now capturing tablet screenshot...
echo.
echo Switch to tablet emulator/device if needed
pause

echo [Tablet] Capture Overview Screen
echo Navigate to main screen, then press any key...
pause >nul
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png screenshots\tablet\tablet_1_overview.png
echo ✓ Saved: tablet_1_overview.png
echo.

echo ========================================
echo All Screenshots Captured!
echo ========================================
echo.
echo Screenshots saved in: screenshots\
echo - Phone: screenshots\phone\
echo - Tablet: screenshots\tablet\
echo.
echo Next steps:
echo 1. Review all screenshots
echo 2. Resize if needed (1080x1920 for phone, 1200x1920 for tablet)
echo 3. Upload to Google Play Console
echo.
pause
