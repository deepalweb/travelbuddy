# Testing Guide - Tourist Attraction Architecture

## 🧪 Complete Testing Checklist

### Prerequisites
- [ ] Backend server running on localhost:5000
- [ ] Mobile app connected to backend
- [ ] Google Places API key configured
- [ ] Clear app cache before testing

## 📱 Mobile App Tests

### Test 1: Cold Start (No Cache)
**Steps**:
1. Clear app cache
2. Open app
3. Navigate to Places/Discovery screen

**Expected Logs**:
```
🔍 Fetching: tourist attraction within 20000m
✅ Got 60 places
✅ Got 58 high-quality places from Google
```

**Expected UI**:
- Loading skeleton for ~8 seconds
- Then shows ~60 places
- All categories visible
- No errors

**Pass Criteria**: ✅ Shows places within 10 seconds

---

### Test 2: Warm Start (With Cache)
**Steps**:
1. Open app (cache exists from Test 1)
2. Navigate to Places/Discovery screen

**Expected Logs**:
```
⚡ INSTANT: Showing 58 cached places
🔄 Background refresh started
```

**Expected UI**:
- Places appear INSTANTLY (0ms)
- No loading skeleton
- Background refresh happens silently

**Pass Criteria**: ✅ Instant display (< 100ms)

---

### Test 3: Category Filter - Food
**Steps**:
1. Ensure cache exists
2. Tap "Food" category chip

**Expected Logs**:
```
⚡ INSTANT: Showing 58 cached places
🎯 Category filtered (restaurant): 15 places
```

**Expected UI**:
- Filter applies INSTANTLY
- Shows only food-related places
- No loading spinner
- Count updates (e.g., "15 places")

**Pass Criteria**: ✅ Instant filter (< 50ms)

---

### Test 4: Category Filter - Culture
**Steps**:
1. From Food category, tap "Culture"

**Expected Logs**:
```
⚡ INSTANT: Showing 58 cached places
🎯 Category filtered (museum): 10 places
```

**Expected UI**:
- Filter applies INSTANTLY
- Shows only museums/galleries
- No loading spinner
- Count updates

**Pass Criteria**: ✅ Instant filter (< 50ms)

---

### Test 5: Category Filter - All
**Steps**:
1. From Culture category, tap "All"

**Expected Logs**:
```
⚡ INSTANT: Showing 58 cached places
```

**Expected UI**:
- Shows all 58 places
- No loading spinner
- Count shows total

**Pass Criteria**: ✅ Shows all places instantly

---

### Test 6: Search with Category
**Steps**:
1. Select "Food" category
2. Type "pizza" in search bar

**Expected Behavior**:
- Filters food places by "pizza" keyword
- Shows only pizza restaurants
- Instant results

**Pass Criteria**: ✅ Combined filter works

---

### Test 7: Cache Expiry
**Steps**:
1. Wait 31 minutes (cache expiry = 30 min)
2. Open app

**Expected Logs**:
```
🔍 Fetching fresh places from Google API
✅ Got 60 places
```

**Expected UI**:
- Shows loading skeleton
- Fetches fresh data
- Updates cache

**Pass Criteria**: ✅ Refreshes after 30 minutes

---

### Test 8: Background Refresh
**Steps**:
1. Open app with valid cache
2. Wait for background refresh to complete
3. Check if data updated

**Expected Logs**:
```
⚡ INSTANT: Showing 58 cached places
🔄 Background refresh started
✅ Background refresh complete: 60 places
```

**Expected UI**:
- No UI interruption
- Data updates silently
- User doesn't notice

**Pass Criteria**: ✅ Silent background update

---

## 🖥️ Backend Tests

### Test 9: Base Query Endpoint
**Request**:
```bash
curl "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=tourist+attraction&radius=20000&limit=60"
```

**Expected Response**:
```json
{
  "status": "OK",
  "results": [...60 places...],
  "query": "tourist attraction",
  "categoryFilter": "tourist attraction",
  "location": { "lat": 6.9271, "lng": 79.8612 },
  "radius": 20000
}
```

**Expected Logs**:
```
🔍 Mobile places search: BASE="tourist attraction" FILTER="tourist attraction"
🔍 Enhanced search returned: 60 raw results
✅ Location filtered: 58 places within 40km
✅ Mobile search returned 58 diverse places
```

**Pass Criteria**: ✅ Returns 50+ places

---

### Test 10: Category Filter - Restaurant
**Request**:
```bash
curl "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=restaurant&radius=20000&limit=60"
```

**Expected Response**:
```json
{
  "status": "OK",
  "results": [...15 places...],
  "query": "tourist attraction",
  "categoryFilter": "restaurant",
  "location": { "lat": 6.9271, "lng": 79.8612 },
  "radius": 20000
}
```

**Expected Logs**:
```
🔍 Mobile places search: BASE="tourist attraction" FILTER="restaurant"
🎯 Category filtered (restaurant): 14 places
```

**Pass Criteria**: ✅ Returns only food places

---

### Test 11: Category Filter - Museum
**Request**:
```bash
curl "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=museum&radius=20000&limit=60"
```

**Expected Response**:
```json
{
  "status": "OK",
  "results": [...10 places...],
  "query": "tourist attraction",
  "categoryFilter": "museum",
  ...
}
```

**Expected Logs**:
```
🎯 Category filtered (museum): 10 places
```

**Pass Criteria**: ✅ Returns only museums/galleries

---

### Test 12: Invalid Category
**Request**:
```bash
curl "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=invalid_category&radius=20000&limit=60"
```

**Expected Behavior**:
- Falls back to base query
- Returns all places
- No error

**Pass Criteria**: ✅ Graceful fallback

---

## 🔍 Integration Tests

### Test 13: End-to-End Flow
**Steps**:
1. Clear all caches
2. Open mobile app
3. Wait for places to load
4. Tap "Food" category
5. Tap "Culture" category
6. Tap "All" category
7. Close and reopen app

**Expected Behavior**:
- Initial load: 8 seconds
- Category switches: instant
- Reopen: instant (cache hit)

**Pass Criteria**: ✅ Complete flow works smoothly

---

### Test 14: Multiple Locations
**Steps**:
1. Load places for Location A (e.g., Colombo)
2. Move to Location B (e.g., Kandy)
3. Load places for Location B
4. Return to Location A

**Expected Behavior**:
- Each location has separate cache
- Location A cache still valid
- No mixing of results

**Pass Criteria**: ✅ Location-specific caching works

---

### Test 15: Network Failure
**Steps**:
1. Disconnect internet
2. Open app with valid cache

**Expected Behavior**:
- Shows cached places
- No error message
- Background refresh fails silently

**Pass Criteria**: ✅ Graceful offline handling

---

## 📊 Performance Tests

### Test 16: Cache Hit Performance
**Metric**: Time to display places with valid cache

**Target**: < 100ms
**Acceptable**: < 200ms
**Fail**: > 500ms

**Measurement**:
```dart
final start = DateTime.now();
final places = await fetchPlacesPipeline(...);
final duration = DateTime.now().difference(start);
print('Cache hit time: ${duration.inMilliseconds}ms');
```

---

### Test 17: API Call Performance
**Metric**: Time to fetch fresh places

**Target**: < 8s
**Acceptable**: < 10s
**Fail**: > 15s

**Measurement**:
```dart
final start = DateTime.now();
final places = await _fetchRealPlaces(...);
final duration = DateTime.now().difference(start);
print('API call time: ${duration.inSeconds}s');
```

---

### Test 18: Filter Performance
**Metric**: Time to filter 60 places by category

**Target**: < 50ms
**Acceptable**: < 100ms
**Fail**: > 200ms

**Measurement**:
```dart
final start = DateTime.now();
final filtered = _filterByCategory(places, 'restaurant', 'restaurant');
final duration = DateTime.now().difference(start);
print('Filter time: ${duration.inMilliseconds}ms');
```

---

## 🐛 Edge Case Tests

### Test 19: Empty Results
**Steps**:
1. Search in remote location (e.g., ocean)
2. Check handling

**Expected Behavior**:
- Returns empty array
- Shows "No places found" message
- No crash

**Pass Criteria**: ✅ Graceful empty state

---

### Test 20: Very Large Radius
**Request**:
```bash
curl "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=restaurant&radius=100000"
```

**Expected Behavior**:
- Filters to 2x radius (200km)
- Returns reasonable results
- No timeout

**Pass Criteria**: ✅ Handles large radius

---

### Test 21: Rapid Category Switching
**Steps**:
1. Tap "Food" → "Culture" → "Nature" → "Shopping" rapidly

**Expected Behavior**:
- All switches instant
- No lag or freeze
- Correct results each time

**Pass Criteria**: ✅ Smooth rapid switching

---

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: [ ] Dev [ ] Staging [ ] Production

Mobile App Tests:
[ ] Test 1: Cold Start - PASS / FAIL
[ ] Test 2: Warm Start - PASS / FAIL
[ ] Test 3: Filter Food - PASS / FAIL
[ ] Test 4: Filter Culture - PASS / FAIL
[ ] Test 5: Filter All - PASS / FAIL
[ ] Test 6: Search + Category - PASS / FAIL
[ ] Test 7: Cache Expiry - PASS / FAIL
[ ] Test 8: Background Refresh - PASS / FAIL

Backend Tests:
[ ] Test 9: Base Query - PASS / FAIL
[ ] Test 10: Filter Restaurant - PASS / FAIL
[ ] Test 11: Filter Museum - PASS / FAIL
[ ] Test 12: Invalid Category - PASS / FAIL

Integration Tests:
[ ] Test 13: End-to-End - PASS / FAIL
[ ] Test 14: Multiple Locations - PASS / FAIL
[ ] Test 15: Network Failure - PASS / FAIL

Performance Tests:
[ ] Test 16: Cache Hit < 100ms - PASS / FAIL
[ ] Test 17: API Call < 8s - PASS / FAIL
[ ] Test 18: Filter < 50ms - PASS / FAIL

Edge Cases:
[ ] Test 19: Empty Results - PASS / FAIL
[ ] Test 20: Large Radius - PASS / FAIL
[ ] Test 21: Rapid Switching - PASS / FAIL

Overall Result: PASS / FAIL
Notes: ___________________________________________
```

---

## 🚀 Automated Testing Script

```bash
#!/bin/bash
# test_places_api.sh

echo "🧪 Testing Tourist Attraction Architecture"
echo "=========================================="

# Test 1: Base Query
echo "Test 1: Base Query"
curl -s "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=tourist+attraction&radius=20000&limit=60" | jq '.status, .results | length'

# Test 2: Restaurant Filter
echo "Test 2: Restaurant Filter"
curl -s "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=restaurant&radius=20000&limit=60" | jq '.status, .categoryFilter, .results | length'

# Test 3: Museum Filter
echo "Test 3: Museum Filter"
curl -s "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=museum&radius=20000&limit=60" | jq '.status, .categoryFilter, .results | length'

echo "=========================================="
echo "✅ Tests Complete"
```

---

**Testing Guide Version**: 1.0
**Last Updated**: 2024
**Status**: ✅ Ready for Testing
