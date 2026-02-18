@echo off
REM Screenshot Capture Script for Travel Buddy Mobile (Windows)

echo 📸 Travel Buddy Screenshot Capture Tool
echo ========================================
echo.

REM Create screenshots directory
if not exist "screenshots\phone" mkdir screenshots\phone
if not exist "screenshots\tablet" mkdir screenshots\tablet

echo Prerequisites:
echo 1. Flutter app running on emulator/device
echo 2. ADB installed and in PATH
echo.

REM Check if device is connected
adb devices | findstr "device" >nul
if errorlevel 1 (
    echo ❌ No device connected. Please connect a device or start emulator.
    pause
    exit /b 1
)

echo ✅ Device connected
echo.
echo Screenshot Capture Instructions:
echo ================================
echo.
echo Phone Screenshots (1080x1920):
echo 1. Home/Explore - Navigate to explore page with places
echo 2. Trip Planning - Open AI trip generator
echo 3. Community - Show community posts feed
echo 4. Profile - Display new profile with tabs
echo 5. Deals - Show active deals page
echo 6. Map View - Display map with places
echo 7. Place Details - Open a place detail page
echo 8. Favorites - Show saved/favorite places
echo.

for /L %%i in (1,1,8) do (
    echo Press ENTER when ready for screenshot %%i...
    pause >nul
    
    adb shell screencap -p /sdcard/screenshot.png
    adb pull /sdcard/screenshot.png screenshots\phone\screenshot_%%i.png
    adb shell rm /sdcard/screenshot.png
    
    echo ✅ Saved: screenshots\phone\screenshot_%%i.png
    echo.
)

echo.
echo Tablet Screenshot (1200x1920):
echo Switch to tablet emulator or device, then press ENTER...
pause >nul

adb shell screencap -p /sdcard/screenshot_tablet.png
adb pull /sdcard/screenshot_tablet.png screenshots\tablet\screenshot_1.png
adb shell rm /sdcard/screenshot_tablet.png

echo ✅ Saved: screenshots\tablet\screenshot_1.png
echo.
echo 🎉 All screenshots captured!
echo.
echo Next steps:
echo 1. Review screenshots in screenshots\ folder
echo 2. Resize if needed (1080x1920 for phone, 1200x1920 for tablet)
echo 3. Upload to Google Play Console
echo.
pause
