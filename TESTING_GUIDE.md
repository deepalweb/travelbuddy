# Quick Testing Guide - Mobile App Profile Features

## 🚀 Quick Start

All features are ready to test. Follow this 15-minute testing flow:

---

## 1️⃣ Social Links (3 mins)

**Path:** Settings → Social Links

```
✓ Tap "+" button
✓ Select "Instagram" from dropdown
✓ Enter URL: https://instagram.com/travelbuddy
✓ Tap "Add"
✓ Verify success snackbar appears
✓ Close app → Reopen
✓ Verify link still shows
✓ Tap delete icon → Confirm removed
```

**Expected Backend Call:**
```
PUT /api/users/social-links
Body: { "instagram": "https://instagram.com/travelbuddy" }
```

---

## 2️⃣ Travel Preferences (3 mins)

**Path:** Settings → Travel Preferences

```
✓ Select Budget: "Luxury ($$$)"
✓ Select Pace: "Fast-Paced"
✓ Toggle "Accessibility Needs" ON
✓ Select interests: Culture, Adventure, Food, Beach
✓ Tap "Save Preferences"
✓ Verify success snackbar
✓ Close app → Reopen
✓ Verify all selections persist
```

**Expected Backend Call:**
```
PUT /api/users/preferences
Body: {
  "budgetRange": "luxury",
  "travelPace": "fast",
  "accessibility": true,
  "interests": ["culture", "adventure", "food", "beach"]
}
```

---

## 3️⃣ Security Settings (2 mins)

**Path:** Settings → Security Settings

```
✓ Verify email displays correctly
✓ Toggle "Two-Factor Authentication" ON
✓ Verify success snackbar
✓ See green info box appear
✓ Close app → Reopen
✓ Verify 2FA still ON
✓ Tap "Change Password"
✓ Tap "Send Email"
✓ Verify success message
```

**Expected Backend Calls:**
```
GET /api/users/security
Response: { "twoFactorEnabled": false, "emailVerified": true }

PUT /api/users/security
Body: { "twoFactorEnabled": true }

POST /api/users/password-reset
```

---

## 4️⃣ Privacy & Notifications (3 mins)

**Path:** Settings → Privacy & Notifications

```
✓ Change "Profile Visibility" to "Private"
✓ Toggle "Hide Travel History" ON
✓ Toggle "Hide Activity" ON
✓ Toggle "Email Notifications" OFF
✓ Toggle "Push Notifications" OFF
✓ Close app → Reopen
✓ Verify all settings persist
```

**Expected Backend Calls:**
```
PUT /api/users/privacy
Body: {
  "profileVisibility": "private",
  "hideTravel": true,
  "hideActivity": true
}

PUT /api/users/notifications
Body: {
  "emailNotifications": false,
  "pushNotifications": false,
  ...
}
```

---

## 5️⃣ Bookmark Management (2 mins)

**Path:** Community → Any Post

```
✓ Tap bookmark icon on a post
✓ Verify icon changes to filled
✓ Go to Profile → Bookmarked Posts
✓ Verify post appears in list
✓ Tap bookmark icon again
✓ Verify post removed from list
```

**Expected Backend Calls:**
```
POST /api/users/bookmark/:postId
DELETE /api/users/bookmark/:postId
```

---

## 6️⃣ Posts Count (1 min)

**Path:** Profile Screen

```
✓ Open Profile
✓ Check "Posts" count
✓ Go to Community → Create Post
✓ Submit a new post
✓ Return to Profile
✓ Verify count incremented by 1
```

**Expected Backend Call:**
```
GET /api/users/posts/count
Response: { "count": 5 }
```

---

## 7️⃣ Visited Places (1 min)

**Manual Test (requires code integration):**

Add this to any place detail screen:
```dart
await ApiService().addVisitedPlace(place.id);
```

**Expected Backend Call:**
```
POST /api/users/visited-places
Body: {
  "placeId": "abc123",
  "visitedAt": "2024-01-15T10:30:00Z"
}
```

**Verify:**
```
✓ Check backend: User.visitedPlaces array has new entry
✓ Check Profile → Travel Stats
✓ Verify "Places Visited" count incremented
```

---

## 🐛 Common Issues & Fixes

### Issue: "Authentication required" error
**Fix:** Ensure user is logged in with valid Firebase token

### Issue: Settings don't persist after app restart
**Fix:** Check backend response - should return `{ "success": true }`

### Issue: Social links not loading
**Fix:** Backend returns object `{}`, mobile expects array format - already handled in `getSocialLinks()`

### Issue: 2FA toggle doesn't work
**Fix:** Ensure using `/api/users/security` endpoint, not `/api/users/2fa`

---

## ✅ Success Criteria

All tests pass if:
- ✅ No error snackbars appear
- ✅ Success messages show after saves
- ✅ Data persists after app restart
- ✅ Backend logs show correct API calls
- ✅ MongoDB shows updated user documents

---

## 📊 Backend Verification

Check MongoDB after testing:

```javascript
db.users.findOne({ firebaseUid: "your-test-user-uid" })
```

Should see:
```json
{
  "socialLinks": { "instagram": "https://..." },
  "travelPreferences": {
    "budgetRange": "luxury",
    "travelPace": "fast",
    "accessibility": true,
    "interests": ["culture", "adventure", "food", "beach"]
  },
  "twoFactorEnabled": true,
  "privacySettings": {
    "profileVisibility": "private",
    "hideTravel": true,
    "hideActivity": true
  },
  "notificationPreferences": {
    "emailNotifications": false,
    "pushNotifications": false
  },
  "bookmarkedPosts": ["postId1", "postId2"],
  "visitedPlaces": [
    { "placeId": "abc123", "visitedAt": "2024-01-15T10:30:00Z" }
  ]
}
```

---

## 🎯 Performance Check

All API calls should complete in:
- GET requests: < 200ms
- PUT/POST requests: < 500ms
- No network errors
- Smooth UI transitions

---

## 📱 Test Devices

Recommended testing on:
- Android emulator (API 30+)
- iOS simulator (iOS 14+)
- Real device (optional)

---

## 🔧 Debug Mode

Enable debug logging in `api_service.dart`:
```dart
print('🌐 API Call: $endpoint');
print('📤 Request: $data');
print('📥 Response: ${response.data}');
```

All API calls already have debug prints enabled.

---

## ✨ Next Steps After Testing

1. Fix any bugs found
2. Add visited places tracking to place detail screens
3. Update bookmark UI to pass `isBookmarked` state
4. Consider adding loading skeletons
5. Add offline support with local caching
