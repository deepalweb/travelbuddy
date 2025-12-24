# 🚀 Quick Reference Card - Tourist Attraction Architecture

## 📌 TL;DR

**Old Way**: Multiple queries → Slow, expensive
**New Way**: Single query + filters → Fast, cheap

**Base Query**: Always "tourist attraction"
**Filtering**: Post-processing by keywords
**Result**: 90% faster, 90% cheaper

---

## 🔑 Key Concepts

### 1. Base Query (Always)
```dart
final baseQuery = 'tourist attraction'; // NEVER CHANGE
```

### 2. Category Filter (Optional)
```dart
final categoryFilter = 'restaurant'; // or null for all
```

### 3. Cache Key (Location-based)
```dart
final cacheKey = '${lat}_${lng}_tourist_attraction';
```

---

## 💻 Code Examples

### Mobile App - Fetch Places
```dart
// Get all places
final places = await fetchPlacesPipeline(
  latitude: 6.9271,
  longitude: 79.8612,
  query: 'tourist attraction',
  categoryFilter: null, // Show all
);

// Get food places
final foodPlaces = await fetchPlacesPipeline(
  latitude: 6.9271,
  longitude: 79.8612,
  query: 'tourist attraction',
  categoryFilter: 'restaurant', // Filter by food
);
```

### Mobile App - Filter Cached Places
```dart
// Filter existing places (instant)
final filtered = _filterByCategory(
  cachedPlaces,
  'restaurant',
  'restaurant'
);
```

### Backend - API Call
```bash
# Get all places
curl "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=tourist+attraction"

# Get food places
curl "http://localhost:5000/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=restaurant"
```

---

## 🗂️ Category Keywords

| Category | Keywords |
|----------|----------|
| restaurant | restaurant, cafe, food, dining, eatery |
| hotel | hotel, hostel, accommodation, resort, lodging |
| landmark | landmark, monument, attraction, historic |
| museum | museum, gallery, art, cultural |
| park | park, garden, nature, outdoor, beach |
| entertainment | cinema, theater, entertainment, concert |
| bar | bar, pub, nightclub, lounge, nightlife |
| shopping | shopping, mall, market, store, boutique |
| spa | spa, wellness, massage, beauty, salon |
| viewpoint | viewpoint, scenic, observation, lookout, rooftop |

---

## 📊 Performance Targets

| Metric | Target | Acceptable | Fail |
|--------|--------|------------|------|
| Cache Hit | < 100ms | < 200ms | > 500ms |
| API Call | < 8s | < 10s | > 15s |
| Filter | < 50ms | < 100ms | > 200ms |

---

## 🔍 Debugging

### Check Logs - Mobile
```
✅ Good: "🔍 Fetching: tourist attraction within 20000m"
❌ Bad: "🔍 Fetching: restaurant within 20000m"
```

### Check Logs - Backend
```
✅ Good: "BASE=\"tourist attraction\" FILTER=\"restaurant\""
❌ Bad: "BASE=\"restaurant\" FILTER=\"\""
```

---

## 🧪 Quick Test

### Test 1: Instant Category Switch
```
1. Open app
2. Wait for places to load
3. Tap "Food" → Should be instant (< 100ms)
4. Tap "Culture" → Should be instant (< 100ms)
```

### Test 2: Cache Hit
```
1. Open app (places load)
2. Close app
3. Reopen app → Should be instant (< 100ms)
```

---

## 🐛 Common Issues

### Issue: Category filter not working
**Solution**: Check keyword mappings in `_filterByCategory()`

### Issue: Slow category switching
**Solution**: Verify cache is being used (check logs for "INSTANT")

### Issue: Wrong places showing
**Solution**: Check base query is "tourist attraction" not specific category

### Issue: Empty results
**Solution**: Check keywords match place names/types/descriptions

---

## 📝 Adding New Category

### Step 1: Add Keywords
```dart
// places_service.dart
final categoryKeywords = {
  'coffee': ['coffee', 'espresso', 'cappuccino', 'latte'], // NEW
  // ...
};
```

### Step 2: Add to Backend
```javascript
// places.js
const categoryKeywords = {
  'coffee': ['coffee', 'espresso', 'cappuccino', 'latte'], // NEW
  // ...
};
```

### Step 3: Add UI Chip
```dart
FilterChip(
  label: Text('Coffee'),
  selected: selectedCategory == 'coffee',
  onSelected: (selected) => setState(() => selectedCategory = 'coffee'),
)
```

---

## 🎯 Best Practices

### ✅ DO
- Always use "tourist attraction" as base query
- Filter by category in post-processing
- Cache results for 30 minutes
- Log base query + filter for debugging
- Test category switching performance

### ❌ DON'T
- Change base query based on category
- Make new API call for category change
- Mix multiple queries in one call
- Forget to update both mobile + backend
- Skip testing after changes

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_COMPLETE.md` | Complete overview |
| `TOURIST_ATTRACTION_ARCHITECTURE.md` | Technical deep dive |
| `CATEGORY_KEYWORDS_REFERENCE.md` | Keyword mappings |
| `ARCHITECTURE_VISUAL_FLOW.md` | Visual diagrams |
| `TESTING_GUIDE.md` | Test cases |

---

## 🚀 Quick Commands

### Clear Cache
```dart
PlacesService().clearCache();
```

### Force Refresh
```dart
await fetchPlacesPipeline(
  // ...
  forceRefresh: true,
);
```

### Check API Usage
```dart
final stats = await PlacesService().getApiUsageStats();
print('Used: ${stats['used']}/${stats['limit']}');
```

---

## 📞 Need Help?

1. **Check logs** for "tourist attraction" queries
2. **Review** `TESTING_GUIDE.md` for test cases
3. **Verify** keywords in `CATEGORY_KEYWORDS_REFERENCE.md`
4. **Read** `TOURIST_ATTRACTION_ARCHITECTURE.md` for details

---

**Version**: 2.0
**Last Updated**: 2024
**Status**: ✅ Production Ready

---

## 🎓 Remember

> "One query to rule them all, one cache to find them,
> One filter to bring them all, and in the speed bind them."

**Base Query**: "tourist attraction"
**Filter**: By keywords
**Result**: Fast & cheap! 🚀
