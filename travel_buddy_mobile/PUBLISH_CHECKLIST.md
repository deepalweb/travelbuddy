# App Store Publishing Checklist

**App**: TravelBuddy Mobile  
**Package**: com.travelbuddylk.app  
**Version**: 1.0.0+1

---

## ✅ COMPLETED

- ✅ Package name changed to `com.travelbuddylk.app`
- ✅ Firebase configuration updated
- ✅ App icon configured
- ✅ Android namespace updated
- ✅ iOS bundle identifier updated
- ✅ MainActivity moved to correct package

---

## 🚨 CRITICAL - MUST DO BEFORE PUBLISHING

### 1. ❌ Generate Android Signing Key
```bash
cd android
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Create `android/key.properties`:
```properties
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=upload
storeFile=upload-keystore.jks
```

### 2. ❌ Remove Unused Permissions

**Android** - Remove from `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.SEND_SMS" />
```

**iOS** - Remove from `Info.plist`:
```xml
<key>NSContactsUsageDescription</key>
<key>NSCalendarsUsageDescription</key>
<key>NSMotionUsageDescription</key>
<key>NSFaceIDUsageDescription</key>
```

### 3. ❌ Create Privacy Policy
- Write privacy policy covering: location, photos, user data, Firebase Auth
- Host at: `https://travelbuddylk.com/privacy-policy`
- Required by both stores

### 4. ❌ Create Terms of Service
- Host at: `https://travelbuddylk.com/terms-of-service`
- Required by both stores

---

## 📱 STORE ASSETS NEEDED

### Android (Google Play)
- ❌ 2-8 phone screenshots (1080x1920 or 1080x2340)
- ❌ 2-8 tablet screenshots (1200x1920 or 1600x2560)
- ❌ Feature graphic (1024x500)
- ❌ App icon (512x512)
- ❌ Short description (80 chars max)
- ❌ Full description (4000 chars max)

### iOS (App Store)
- ❌ 6.5" screenshots (1284x2778) - iPhone 14 Pro Max
- ❌ 5.5" screenshots (1242x2208) - iPhone 8 Plus
- ❌ 12.9" iPad screenshots (2048x2732)
- ❌ App preview video (optional)
- ❌ App description (4000 chars max)
- ❌ Keywords (100 chars max)
- ❌ Promotional text (170 chars)

---

## 📝 STORE LISTING CONTENT

### Short Description (80 chars)
```
AI-powered travel planning with hidden gems, budget tips & local insights
```

### App Category
- **Android**: Travel & Local
- **iOS**: Travel

### Keywords (iOS - 100 chars)
```
travel,trip planner,vacation,tourism,budget travel,itinerary,destinations,travel guide,adventure
```

---

## 🔐 ACCOUNTS NEEDED

### Google Play Console
- ❌ Create account ($25 one-time fee)
- ❌ Verify identity
- ❌ Set up merchant account (for future payments)

### Apple Developer Program
- ❌ Enroll ($99/year)
- ❌ Create App ID: `com.travelbuddylk.app`
- ❌ Configure signing certificates

---

## 📋 STORE SUBMISSION FORMS

### Android - Data Safety
- ❌ Location data collected: YES (for nearby places)
- ❌ Photos collected: YES (for community posts)
- ❌ User info collected: YES (email, name for auth)
- ❌ Data shared with third parties: NO
- ❌ Data encrypted in transit: YES
- ❌ Users can request deletion: YES

### Android - Content Rating
- ❌ Complete IARC questionnaire
- ❌ Expected rating: Everyone / PEGI 3

### iOS - Privacy Nutrition Labels
- ❌ Location: Used for nearby places
- ❌ Photos: Used for community posts
- ❌ Contact Info: Email for authentication
- ❌ User Content: Posts, reviews, saved places

### iOS - Age Rating
- ❌ Expected: 4+ (No objectionable content)

---

## 🧪 TESTING CHECKLIST

- ❌ Test on real Android device
- ❌ Test on real iOS device
- ❌ Test all authentication flows
- ❌ Test location permissions
- ❌ Test camera/photo permissions
- ❌ Test offline mode
- ❌ Test community posts
- ❌ Test places search
- ❌ Test emergency services
- ❌ Verify no crashes
- ❌ Check app size (< 150MB)

---

## 🚀 BUILD COMMANDS

### Android Release
```bash
flutter build appbundle --release
# Output: build/app/outputs/bundle/release/app-release.aab
```

### iOS Release
```bash
flutter build ipa
# Then upload via Xcode or Transporter app
```

---

## 📊 CURRENT STATUS

**Overall Progress**: 20%

**Completed**: 6/30 tasks
- ✅ Package name
- ✅ Firebase config
- ✅ App icon
- ✅ Namespace
- ✅ Bundle ID
- ✅ MainActivity

**Critical Remaining**: 4 tasks
- ❌ Signing key
- ❌ Remove unused permissions
- ❌ Privacy policy
- ❌ Terms of service

**Estimated Time to Launch**: 5-7 days
- Day 1: Critical fixes (signing, permissions, policies)
- Day 2-3: Store assets (screenshots, descriptions)
- Day 4: Store setup (accounts, forms)
- Day 5-7: Testing & submission

---

## 🎯 NEXT IMMEDIATE STEPS

1. Generate Android signing key
2. Remove unused permissions
3. Create privacy policy page
4. Create terms of service page
5. Take app screenshots
6. Write store descriptions
7. Create Google Play Console account
8. Build release APK and test

---

**Last Updated**: January 2025
