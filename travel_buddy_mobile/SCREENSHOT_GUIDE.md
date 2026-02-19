# Screenshot Capture Guide

## Required Screenshots
- **8 Phone Screenshots:** 1080 x 1920 pixels (9:16 ratio)
- **1 Tablet Screenshot:** 1200 x 1920 pixels

## Recommended Screens to Capture

1. **Home/Explore Screen** - Show places discovery
2. **Trip Planning** - AI trip generation
3. **Community Feed** - Posts and social features
4. **Profile Screen** - User profile with stats
5. **Place Details** - Detailed place information
6. **Map View** - Places on map
7. **Deals Screen** - Active deals
8. **Safety Hub** - Emergency features

## Method 1: Using Android Emulator (Easiest)

### Step 1: Start Emulator
```bash
cd travel_buddy_mobile
flutter run
```

### Step 2: Navigate to Each Screen
- Open the app
- Navigate to each screen listed above
- Make sure content is loaded

### Step 3: Capture Screenshots
**In Android Studio:**
1. Click camera icon in emulator toolbar
2. Or: Tools → Device Manager → Screenshot
3. Save as PNG

**Using ADB:**
```bash
adb shell screencap -p /sdcard/screenshot1.png
adb pull /sdcard/screenshot1.png ./screenshots/
```

## Method 2: Using Real Device

### Step 1: Connect Device
```bash
adb devices
```

### Step 2: Run App
```bash
cd travel_buddy_mobile
flutter run
```

### Step 3: Capture Screenshots
```bash
# Take screenshot
adb shell screencap -p /sdcard/screenshot.png

# Pull to computer
adb pull /sdcard/screenshot.png ./screenshots/phone_1.png
```

## Method 3: Automated Script

Run the provided script:
```bash
capture_screenshots.bat
```

## Resize Screenshots (if needed)

### Using ImageMagick:
```bash
magick convert input.png -resize 1080x1920! output.png
```

### Using Online Tool:
- https://www.iloveimg.com/resize-image
- Upload screenshot
- Set to 1080x1920
- Download

## Tips for Great Screenshots

1. **Use Real Data:** Show actual places, not placeholders
2. **Good Lighting:** Use light theme or ensure good contrast
3. **No Personal Info:** Remove any personal data
4. **Show Key Features:** Highlight what makes your app unique
5. **Clean UI:** Close any debug overlays or notifications

## Tablet Screenshot

For tablet (1200x1920):
1. Use tablet emulator or device
2. Same process as phone
3. Only need 1 tablet screenshot

## File Naming Convention

```
phone_1_home.png
phone_2_trip_planning.png
phone_3_community.png
phone_4_profile.png
phone_5_place_details.png
phone_6_map.png
phone_7_deals.png
phone_8_safety.png
tablet_1_overview.png
```

## Verification Checklist

- [ ] All 8 phone screenshots captured
- [ ] 1 tablet screenshot captured
- [ ] All images are 1080x1920 (phone) or 1200x1920 (tablet)
- [ ] Images are PNG or JPEG format
- [ ] File size under 8MB each
- [ ] No personal information visible
- [ ] App looks professional and polished
