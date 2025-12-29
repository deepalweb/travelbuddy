# Final Pre-Launch Checklist

## ✅ Code Changes Complete

- [x] Removed ACCESS_BACKGROUND_LOCATION permission
- [x] Removed FOREGROUND_SERVICE permissions
- [x] HTTPS-only enforced (cleartext disabled)
- [x] ProGuard obfuscation enabled
- [x] Code shrinking enabled
- [x] Release signing configured

## 🔧 Manual Actions Required

### 1. Get SHA-1 Fingerprint
```bash
cd android
./gradlew signingReport
```
**Copy the SHA-1 from "Variant: release" section**

### 2. Restrict Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to: APIs & Services → Credentials
3. Find your Google Maps API key
4. Click "Edit API key"
5. Under "Application restrictions":
   - Select "Android apps"
   - Click "Add an item"
   - Package name: `com.travelbuddylk.app`
   - SHA-1: [paste from step 1]
6. Click "Save"

### 3. Host Privacy Policy
**Option A: GitHub Pages (Recommended)**
1. Create new repo: `travelbuddy-privacy`
2. Upload `PRIVACY_POLICY.md` as `index.md`
3. Enable GitHub Pages in repo settings
4. URL will be: `https://[username].github.io/travelbuddy-privacy`

**Option B: Website**
- Upload to: `https://travelbuddy.lk/privacy`

**Option C: Google Sites**
- Create free site at [sites.google.com](https://sites.google.com)

### 4. Build Release AAB
```bash
cd android
./gradlew bundleRelease
```
**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

### 5. Test Release Build Locally
```bash
cd android
./gradlew assembleRelease
```
**Install APK on device and test:**
- [ ] Login with email/password
- [ ] Login with Google Sign-In
- [ ] Location permissions work
- [ ] Camera/photo upload works
- [ ] Maps display correctly
- [ ] AI place generation works
- [ ] No crashes or errors

## 📤 Play Console Setup

### Step 1: Create App Listing
1. Go to [Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - App name: **Travel Buddy**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
4. Accept declarations and create

### Step 2: Store Listing
1. Navigate to: Store presence → Main store listing
2. Fill in:
   - **Short description:** (from PLAY_STORE_ASSETS.md)
   - **Full description:** (from PLAY_STORE_ASSETS.md)
   - **App icon:** Upload 512x512 PNG
   - **Feature graphic:** Upload 1024x500 PNG
   - **Phone screenshots:** Upload 2-8 images
3. Contact details:
   - **Email:** support@travelbuddy.lk
   - **Website:** https://travelbuddy.lk
   - **Privacy policy:** [Your hosted URL]
4. Click "Save"

### Step 3: Data Safety
1. Navigate to: Policy → Data safety
2. Click "Start"
3. **Data collection and security:**
   - Does your app collect or share user data? **Yes**
4. **Data types:**
   - Location → Approximate location, Precise location
   - Personal info → Name, Email address, Phone number
   - Photos and videos → Photos
   - Device or other IDs → Device or other IDs
5. **Data usage and handling (for each type):**
   - Is this data collected, shared, or both? **Collected**
   - Is this data processed ephemerally? **No**
   - Is this data required or optional? **Required** (except photos: Optional)
   - Why is this data collected? **App functionality, Personalization**
6. **Data security:**
   - Is data encrypted in transit? **Yes**
   - Can users request data deletion? **Yes**
   - Committed to Google Play Families Policy? **No** (not targeting children)
7. Click "Save" and "Submit"

### Step 4: Content Rating
1. Navigate to: Policy → App content → Content ratings
2. Click "Start questionnaire"
3. Enter email: support@travelbuddy.lk
4. Select category: **Travel & reference**
5. Answer questions:
   - Violence: **No**
   - Sexual content: **No**
   - Profanity: **No**
   - Controlled substances: **No**
   - User-generated content: **Yes** (reviews, posts)
   - User interaction: **Yes** (users can communicate)
   - Shares user location: **Yes**
   - Purchases digital goods: **No**
6. Submit and apply ratings

### Step 5: Target Audience
1. Navigate to: Policy → App content → Target audience
2. Target age groups: **13+**
3. Click "Save"

### Step 6: News Apps
1. Navigate to: Policy → App content → News apps
2. Is this a news app? **No**
3. Click "Save"

### Step 7: COVID-19 Contact Tracing
1. Navigate to: Policy → App content → COVID-19 contact tracing
2. Is this a contact tracing app? **No**
3. Click "Save"

### Step 8: Data Deletion
1. Navigate to: Policy → App content → Data deletion
2. Provide instructions:
   - Users can delete account in: **Profile → Settings → Delete Account**
   - Or email: **support@travelbuddy.lk**
3. Click "Save"

### Step 9: Government Apps
1. Navigate to: Policy → App content → Government apps
2. Is this a government app? **No**
3. Click "Save"

### Step 10: Financial Features
1. Navigate to: Policy → App content → Financial features
2. Does your app have financial features? **No**
3. Click "Save"

### Step 11: Advertising
1. Navigate to: Policy → App content → Ads
2. Does your app contain ads? **No**
3. Click "Save"

### Step 12: Upload AAB
1. Navigate to: Release → Testing → Internal testing
2. Click "Create new release"
3. Upload `app-release.aab`
4. Release name: **1.0.0 (1)**
5. Release notes:
   ```
   Initial release of Travel Buddy
   - AI-powered trip planning
   - Discover hidden gems
   - Exclusive deals and offers
   - Smart navigation with maps
   - Social features
   ```
6. Click "Save" and "Review release"
7. Click "Start rollout to Internal testing"

### Step 13: Add Testers
1. In Internal testing, click "Testers" tab
2. Create email list with test users
3. Share opt-in URL with testers
4. Wait for feedback (~1-2 days)

### Step 14: Production Release
1. After testing, navigate to: Release → Production
2. Click "Create new release"
3. Select the tested release from Internal testing
4. Click "Review release"
5. Click "Start rollout to Production"
6. Wait for review (3-7 days)

## ✅ Final Verification

Before submitting to production:
- [ ] Privacy policy is publicly accessible
- [ ] Google Maps API key is restricted
- [ ] Release AAB builds successfully
- [ ] Tested on real device (not emulator)
- [ ] All Play Console sections show green checkmarks
- [ ] Data safety form is complete
- [ ] Content rating is applied
- [ ] Store listing has all required assets
- [ ] Internal testing completed successfully

## 🎉 Post-Launch

After approval:
- Monitor crash reports in Play Console
- Respond to user reviews within 24-48 hours
- Track analytics and user feedback
- Plan updates based on user needs

## 📞 Support

If rejected, common fixes:
1. Update privacy policy with more details
2. Add in-app permission explanations
3. Provide more screenshots
4. Clarify data usage in Data Safety form

**Need help?** Email: support@travelbuddy.lk
