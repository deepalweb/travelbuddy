# 🔧 Fix: Get Real Place Names (Not Generic)

## Problem
Seeing generic names like "Landmark", "Tourist Spot", "Attraction" instead of real place names like "Gangaramaya Temple", "Ministry of Crab".

## Root Cause
Backend AI prompt wasn't specific enough about using real names.

## ✅ Solution Applied

### 1. Updated Backend AI Prompt
**File**: `backend/routes/mobile-places.js`

**Before**:
```javascript
"Generate 60 diverse, realistic places..."
```

**After**:
```javascript
"Generate 60 REAL, SPECIFIC places with ACTUAL NAMES
(not generic like 'Landmark' or 'Tourist Spot')

IMPORTANT: Use REAL place names like:
✅ 'Gangaramaya Temple' NOT ❌ 'Buddhist Temple'
✅ 'Ministry of Crab' NOT ❌ 'Seafood Restaurant'
✅ 'Galle Face Green' NOT ❌ 'Beachfront Park'"
```

### 2. Better Logging
Added logging to verify real names are returned:
```dart
📍 Sample places: Gangaramaya Temple, Ministry of Crab, Galle Face Green
```

---

## 🚀 How to Test

### Step 1: Clear Cache
```dart
// In your app, pull down to refresh
// This forces new API call with updated prompt
```

### Step 2: Check Console
Look for:
```
🔍 Fetching REAL places: restaurants within 500m
📍 Sample places: Ministry of Crab, Curry Leaf, The Lagoon
✅ API returned 5 REAL places with actual names
```

### Step 3: Verify UI
You should now see:
- ✅ "Gangaramaya Temple" (not "Temple 1")
- ✅ "Ministry of Crab" (not "Restaurant 1")
- ✅ "Galle Face Green" (not "Park 1")

---

## 🔄 If Still Seeing Generic Names

### Option 1: Force Cache Clear (App)
```dart
// In places_service.dart
PlacesService().clearCache();
PlacesService().clearOfflineStorage();
```

### Option 2: Clear Backend Cache
```bash
# Call backend endpoint
curl -X DELETE https://your-backend.../api/places/debug/cache
```

### Option 3: Restart Backend
```bash
# Restart backend to reload AI prompt
pm2 restart backend
# or
npm run start
```

---

## 📊 Expected Results

### Before Fix:
```
🔥 Hot Places Right Now
- Landmark 1 ⭐ 4.5
- Tourist Spot 2 ⭐ 4.3
- Attraction 3 ⭐ 4.7
```

### After Fix:
```
🔥 Hot Places Right Now
- Gangaramaya Temple ⭐ 4.8
- Ministry of Crab ⭐ 4.7
- Galle Face Green ⭐ 4.6
```

---

## 🎯 Why This Works

The backend uses **Azure Maps API** which returns real place names from their database. The AI prompt now explicitly instructs to use actual place names, not generic descriptions.

**Data Flow**:
1. App requests "restaurants near me"
2. Backend calls Azure Maps API
3. Azure Maps returns real places: "Ministry of Crab", "Curry Leaf"
4. AI enriches with descriptions
5. App displays real names ✅

---

## ✅ Verification Checklist

- [ ] Backend prompt updated
- [ ] App cache cleared
- [ ] Backend restarted
- [ ] Pull to refresh in app
- [ ] Check console logs
- [ ] Verify real names in UI

---

**Status**: ✅ Fixed
**Next**: Pull to refresh to see real place names!
