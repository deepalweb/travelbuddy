# Tourist Attraction Base Query Architecture

## 🎯 Overview

This document explains the optimized places search architecture that uses **"tourist attraction"** as the base query with category filtering applied post-processing.

## 🧠 Why This Works

### Google Places API Behavior
- **Base Query**: "tourist attraction" returns comprehensive results including:
  - Landmarks & monuments
  - Museums & galleries
  - Parks & nature spots
  - Famous restaurants & cafes
  - Popular shopping areas
  - Viewpoints & scenic spots
  - Entertainment venues

- **Better Results**: Single comprehensive query > Multiple specific queries
- **Faster Performance**: 1 API call instead of 10+ calls
- **Consistent Quality**: Google's algorithm optimized for "tourist attraction"
- **Cost Effective**: Reduced API usage

### What NOT to Do ❌
```
// DON'T: Diluted query with too many keywords
q = "tourist attraction restaurant cafe bar museum park shopping spa"
```

**Problems**:
- Dilutes search intent
- Worse ranking quality
- Inconsistent results
- Higher API noise

## ✅ Recommended Architecture

### 1️⃣ Base Query (Always)
```
baseQuery = "tourist attraction"
```

**Used when**:
- Default "All" category
- Home / Discover view
- First app open
- Cold start

### 2️⃣ Category Filters (Post-Processing)

Instead of changing the Google query, filter using:

**A. Category Keywords**
```dart
final categoryKeywords = {
  'restaurant': ['restaurant', 'cafe', 'food', 'dining', 'eatery'],
  'hotel': ['hotel', 'hostel', 'accommodation', 'resort', 'lodging'],
  'landmark': ['landmark', 'monument', 'attraction', 'historic'],
  'museum': ['museum', 'gallery', 'art', 'cultural'],
  'park': ['park', 'garden', 'nature', 'outdoor', 'beach'],
  'entertainment': ['cinema', 'theater', 'entertainment', 'concert'],
  'bar': ['bar', 'pub', 'nightclub', 'lounge', 'nightlife'],
  'shopping': ['shopping', 'mall', 'market', 'store', 'boutique'],
  'spa': ['spa', 'wellness', 'massage', 'beauty', 'salon'],
  'viewpoint': ['viewpoint', 'scenic', 'observation', 'lookout', 'rooftop'],
};
```

**B. Google Place Types**
```dart
types: ["restaurant", "museum", "park"]
```

### 3️⃣ Ranking Formula

```dart
finalScore = 
  distanceScore +
  ratingScore +
  popularityScore +
  categoryMatchScore +  // NEW: keyword-based
  userInterestScore +
  timeContextScore
```

## 🗂️ Category Filtering Logic

### Filter Chips Behavior

| Selected | Google Query | Filtering |
|----------|-------------|-----------|
| All | tourist attraction | none |
| Food | tourist attraction | restaurant + cafe keywords |
| Culture | tourist attraction | museum + gallery keywords |
| Nature | tourist attraction | park + beach keywords |
| Shopping | tourist attraction | mall + market keywords |
| Spa | tourist attraction | spa + wellness keywords |

### Implementation Example

```dart
// Mobile App (places_service.dart)
List<Place> _filterByCategory(List<Place> places, String category, String originalQuery) {
  if (category == 'all') return places;
  
  final keywords = categoryKeywords[category.toLowerCase()]!;
  
  return places.where((place) {
    final searchText = '${place.name} ${place.types.join(' ')} ${place.description}'.toLowerCase();
    return keywords.any((keyword) => searchText.contains(keyword));
  }).toList();
}
```

```javascript
// Backend (places.js)
if (categoryFilter && categoryFilter !== 'all') {
  const keywords = categoryKeywords[categoryFilter.toLowerCase()] || [categoryFilter];
  
  results = results.filter(place => {
    const searchText = `${place.name} ${place.types?.join(' ') || ''} ${place.description || ''}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  });
}
```

## 🌦️ Time & Weather Integration

Because the base query stays the same, you can dynamically change filters without new API calls:

```dart
// Evening
if (isEvening) {
  categoryKeywords['food'].addAll(['bar', 'pub', 'nightclub']);
}

// Rainy
if (isRainy) {
  categoryKeywords.remove('beach');
  categoryKeywords.remove('outdoor');
  categoryKeywords['indoor'] = ['museum', 'shopping mall', 'cinema'];
}
```

**Result**: Instant UI update 🔥 (no API call needed)

## 📊 Performance Benefits

### Before (Multiple Queries)
```
API Calls: 10+ per category
Load Time: 15-30 seconds
Cache Complexity: High
Cost: $$$
```

### After (Single Query + Filtering)
```
API Calls: 1 per location
Load Time: 0ms (instant cache) + 8s (fresh)
Cache Complexity: Low
Cost: $
```

## 🔄 Data Flow

```
User Opens App
    ↓
Check Cache (cacheKey = "lat_lng_tourist_attraction")
    ↓
[INSTANT] Return cached results (0ms)
    ↓
Apply category filter if selected
    ↓
Display to user
    ↓
[BACKGROUND] Refresh cache with fresh data
    ↓
Update UI when complete
```

## 🎨 UI/UX Pattern

### Category Chips
```dart
['All', 'Food', 'Culture', 'Nature', 'Shopping', 'Spa', 'Nightlife']
```

**Behavior**:
- Tap "All" → Show all cached places
- Tap "Food" → Filter cached places by food keywords
- **No loading spinner** (instant filter)
- Background refresh updates results

## 🚀 Implementation Checklist

### Mobile App (Flutter)
- [x] Update `fetchPlacesPipeline()` to use "tourist attraction" base query
- [x] Add `categoryFilter` parameter
- [x] Implement `_filterByCategory()` method
- [x] Update cache key to use base query
- [x] Update `searchPlaces()` and `getNearbyPlaces()` to pass category filter

### Backend (Node.js)
- [x] Update `/api/places/mobile/nearby` to use "tourist attraction" base query
- [x] Add category filtering logic
- [x] Return `categoryFilter` in response
- [x] Update logs to show base query + filter

### Testing
- [ ] Test "All" category (no filter)
- [ ] Test each category filter
- [ ] Test cache behavior
- [ ] Test background refresh
- [ ] Test weather-based filtering
- [ ] Test time-based filtering

## 📝 API Response Format

```json
{
  "status": "OK",
  "results": [...],
  "query": "tourist attraction",
  "categoryFilter": "restaurant",
  "location": { "lat": 6.9271, "lng": 79.8612 },
  "radius": 20000
}
```

## 🎯 Key Advantages

1. **Faster**: 1 API call vs 10+
2. **Cheaper**: Reduced API usage
3. **Better Quality**: Google's optimized algorithm
4. **Instant Filtering**: No API call for category changes
5. **Simpler Cache**: Single cache key per location
6. **Weather-Aware**: Dynamic filtering without API calls
7. **Time-Aware**: Evening/morning adjustments without API calls

## 🔮 Future Enhancements

- **ML-Based Filtering**: Use user preferences to boost/demote categories
- **Personalized Keywords**: Learn user's favorite place types
- **Smart Ranking**: Combine category match with user history
- **A/B Testing**: Compare base query variations

## 📚 References

- Google Places API: https://developers.google.com/maps/documentation/places/web-service
- Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula
- Mobile UX Best Practices: https://material.io/design

---

**Last Updated**: 2024
**Architecture Version**: 2.0
**Status**: ✅ Implemented
