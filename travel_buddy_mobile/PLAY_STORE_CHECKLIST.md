# Google Play Store Security & Compliance Checklist

## ✅ COMPLETED SECURITY FIXES

### 1. Network Security
- [x] Disabled cleartext HTTP traffic in production
- [x] HTTPS-only communication enforced
- [x] Network security config properly configured

### 2. Code Protection
- [x] ProGuard/R8 obfuscation enabled for release builds
- [x] Code shrinking enabled
- [x] ProGuard rules created for Firebase, Google Maps, Gson

### 3. Build Configuration
- [x] Release signing configured
- [x] Target SDK 35 (latest)
- [x] Version code and name set (1.0.0)

## ⚠️ REQUIRED ACTIONS BEFORE PLAY STORE SUBMISSION

### 1. Background Location Permission (CRITICAL)
**Status:** DECLARED BUT NOT JUSTIFIED

**Action Required:**
- Remove `ACCESS_BACKGROUND_LOCATION` from AndroidManifest.xml if not needed
- OR provide detailed justification in Play Console:
  - Why background location is essential
  - How it benefits users
  - Add prominent in-app disclosure before requesting

**Current Usage:** Line 12 in AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

**Recommendation:** Remove this permission unless you have route tracking that runs in background.

### 2. Privacy Policy (REQUIRED)
**Status:** MISSING

**Action Required:**
- Create privacy policy document
- Host on public URL (website, GitHub Pages, etc.)
- Add link to Play Console listing
- Must cover:
  - Data collection (location, user info, photos)
  - How data is used
  - Third-party services (Firebase, Google Maps)
  - User rights (access, deletion)
  - Contact information

### 3. Data Safety Form (REQUIRED)
**Status:** NEEDS COMPLETION

**Action Required in Play Console:**
- Data types collected:
  - ✓ Location (precise, coarse)
  - ✓ Personal info (name, email, phone)
  - ✓ Photos and videos
  - ✓ Device ID
- Data usage:
  - ✓ App functionality
  - ✓ Personalization
  - ✓ Analytics
- Data sharing:
  - ✓ Firebase (Google)
  - ✓ Google Maps
- Security practices:
  - ✓ Data encrypted in transit (HTTPS)
  - ✓ Users can request deletion
  - ✓ Committed to Google Play Families Policy

### 4. API Key Security
**Status:** NEEDS RESTRICTION

**Action Required:**
1. Go to Google Cloud Console
2. Find your Google Maps API key
3. Add restrictions:
   - Application restrictions: Android apps
   - Package name: com.travelbuddylk.app
   - SHA-1 certificate fingerprint: [Add your release key SHA-1]

**Get SHA-1:**
```bash
cd android
./gradlew signingReport
```

### 5. App Signing
**Status:** CONFIGURED

**Action Required:**
- Ensure `key.properties` file exists with:
  ```
  storePassword=<your-keystore-password>
  keyPassword=<your-key-password>
  keyAlias=<your-key-alias>
  storeFile=<path-to-keystore.jks>
  ```
- Keep keystore file secure (DO NOT commit to git)
- Backup keystore file safely

### 6. Content Rating
**Status:** NEEDS COMPLETION

**Action Required in Play Console:**
- Complete content rating questionnaire
- Expected rating: PEGI 3 / ESRB Everyone
- No violent, sexual, or inappropriate content

### 7. Target Audience
**Status:** NEEDS DECLARATION

**Action Required:**
- Declare target age group (likely 13+)
- If targeting children, comply with COPPA/GDPR-K

## 📋 PRE-SUBMISSION CHECKLIST

### Testing
- [ ] Test on multiple devices (different screen sizes)
- [ ] Test on Android 13+ (target SDK 35)
- [ ] Test all permissions flows
- [ ] Test Google Sign-In
- [ ] Test offline functionality
- [ ] Test location services
- [ ] Test camera/photo upload

### Assets
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (at least 2, max 8)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)

### Legal
- [ ] Privacy policy URL
- [ ] Terms of service (optional but recommended)
- [ ] Contact email
- [ ] Developer address (required for paid apps)

## 🚀 BUILD COMMANDS

### Generate Release APK
```bash
cd android
./gradlew assembleRelease
```

### Generate Release AAB (Recommended for Play Store)
```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## 📝 NOTES

1. **First-time submission:** Review can take 3-7 days
2. **Updates:** Usually reviewed within 1-2 days
3. **Rejections:** Common reasons are privacy policy, permissions, or content issues
4. **Internal testing:** Use internal testing track first to verify everything works

## 🔗 USEFUL LINKS

- [Play Console](https://play.google.com/console)
- [Google Cloud Console](https://console.cloud.google.com)
- [Firebase Console](https://console.firebase.google.com)
- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Data Safety Form Guide](https://support.google.com/googleplay/android-developer/answer/10787469)
