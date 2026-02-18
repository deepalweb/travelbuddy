#!/bin/bash
# Screenshot Capture Script for Travel Buddy Mobile

echo "📸 Travel Buddy Screenshot Capture Tool"
echo "========================================"

# Create screenshots directory
mkdir -p screenshots/phone
mkdir -p screenshots/tablet

echo ""
echo "Prerequisites:"
echo "1. Flutter app running on emulator/device"
echo "2. ADB installed and in PATH"
echo ""

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No device connected. Please connect a device or start emulator."
    exit 1
fi

echo "✅ Device connected"
echo ""
echo "Screenshot Capture Instructions:"
echo "================================"
echo ""
echo "Phone Screenshots (1080x1920):"
echo "1. Home/Explore - Navigate to explore page with places"
echo "2. Trip Planning - Open AI trip generator"
echo "3. Community - Show community posts feed"
echo "4. Profile - Display new profile with tabs"
echo "5. Deals - Show active deals page"
echo "6. Map View - Display map with places"
echo "7. Place Details - Open a place detail page"
echo "8. Favorites - Show saved/favorite places"
echo ""

for i in {1..8}; do
    echo "Press ENTER when ready for screenshot $i..."
    read
    
    filename="screenshots/phone/screenshot_$i.png"
    adb shell screencap -p /sdcard/screenshot.png
    adb pull /sdcard/screenshot.png "$filename"
    adb shell rm /sdcard/screenshot.png
    
    echo "✅ Saved: $filename"
    echo ""
done

echo ""
echo "Tablet Screenshot (1200x1920):"
echo "Switch to tablet emulator or device, then press ENTER..."
read

adb shell screencap -p /sdcard/screenshot_tablet.png
adb pull /sdcard/screenshot_tablet.png screenshots/tablet/screenshot_1.png
adb shell rm /sdcard/screenshot_tablet.png

echo "✅ Saved: screenshots/tablet/screenshot_1.png"
echo ""
echo "🎉 All screenshots captured!"
echo ""
echo "Next steps:"
echo "1. Review screenshots in screenshots/ folder"
echo "2. Resize if needed (1080x1920 for phone, 1200x1920 for tablet)"
echo "3. Upload to Google Play Console"
