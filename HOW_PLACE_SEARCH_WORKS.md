# 🔍 How Place Search & Display Works

## 📱 Complete Flow (User → Screen → Backend → Display)

```
USER OPENS EXPLORE
       ↓
┌──────────────────────────────────────────────────────────┐
│ 1. EXPLORE SCREEN (explore_screen_redesigned.dart)      │
│    - Gets user location (GPS)                            │
│    - Calls _loadContextAwareSections()                   │
└──────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────┐
│ 2. GENERATE SECTIONS (_generateContextSections)          │
│    - Checks time (morning/afternoon/evening)             │
│    - Checks weather (sunny/rainy)                        │
│    - Creates context queries:                            │
│      • "restaurants cafes open now" (Hot Places)         │
│      • "bars nightlife" (Tonight In)                     │
│      • "museums galleries indoor" (Weather-Aware)        │
└──────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────┐
│ 3. FETCH PLACES (PlacesService.fetchPlacesPipeline)     │
│    Input: lat, lng, query, radius                        │
│    - Checks cache first (24hr expiry)                    │
│    - If not cached → API call                            │
└──────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────┐
│ 4. BACKEND API (mobile-places.js)                        │
│    URL: /api/places/mobile/nearby                        │
│    - Receives: lat, lng, query, radius                   │
│    - Uses Azure OpenAI to generate places                │
│    - Fetches photos from Google Places                   │
│    - Returns JSON with places                            │
└──────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────┐
│ 5. PROCESS RESPONSE (PlacesService)                      │
│    - Converts JSON → Place objects                       │
│    - Filters by rating (>= 2.5)                          │
│    - Filters by radius (within specified distance)       │
│    - Saves to cache (memory + offline storage)           │
└──────────────────────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────────────────────┐
│ 6. BUILD UI (Explore Screen)                             │
│    - Creates ContextSection for each category            │
│    - Renders EnhancedPlaceCard for each place            │
│    - Calculates real distance (GPS)                      │
│    - Shows verified badges (rating >= 4.5)               │
└──────────────────────────────────────────────────────────┘
       ↓
   USER SEES PLACES!
```

---

## 🎯 Example: "Hot Places Right Now"

### Step-by-Step

```dart
// 1. USER OPENS EXPLORE
ExploreScreenRedesigned()
  ↓
// 2. SCREEN LOADS
initState() → _loadContextAwareSections()
  ↓
// 3. GENERATE SECTIONS
_generateContextSections() {
  // Check time
  hour = 14 (2 PM)
  
  // Create "Hot Places" section
  query = "restaurants cafes attractions open now"
  radius = 500 // meters
  
  // Fetch places
  places = await _fetchPlacesByContext(
    appProvider,
    query,
    radius: 500
  )
}
  ↓
// 4. FETCH FROM SERVICE
PlacesService().fetchPlacesPipeline(
  latitude: 6.9271,
  longitude: 79.8612,
  query: "restaurants cafes attractions open now",
  radius: 500,
  topN: 5
)
  ↓
// 5. CHECK CACHE
cacheKey = "6.93_79.86_restaurants cafes attractions open now"
if (cache has data && < 24hrs old) {
  return cached places ✅
} else {
  call backend API ↓
}
  ↓
// 6. BACKEND API CALL
GET https://travelbuddy.../api/places/mobile/nearby
    ?lat=6.9271
    &lng=79.8612
    &q=restaurants cafes attractions open now
    &radius=500
    &limit=5
  ↓
// 7. BACKEND PROCESSES
- Gets location context (Colombo, Sri Lanka)
- Calls Azure OpenAI with prompt
- AI generates 5 places near coordinates
- Fetches photos from Google Places
- Returns JSON
  ↓
// 8. RESPONSE
{
  "status": "OK",
  "results": [
    {
      "place_id": "ai_123",
      "name": "Gangaramaya Temple",
      "formatted_address": "61 Sri Jinarathana Rd, Colombo",
      "geometry": {
        "location": { "lat": 6.9271, "lng": 79.8612 }
      },
      "rating": 4.8,
      "types": ["tourist_attraction"],
      "description": "Beautiful Buddhist temple...",
      "localTip": "Visit at 3PM for best light",
      "photoUrl": "https://.../photo?ref=xyz",
      "opening_hours": { "open_now": true }
    },
    // ... 4 more places
  ]
}
  ↓
// 9. CONVERT TO PLACE OBJECTS
places = results.map((json) => Place.fromJson(json))
  ↓
// 10. FILTER & CACHE
- Filter: rating >= 2.5 ✅
- Filter: within 500m ✅
- Save to memory cache
- Save to offline storage (Hive)
  ↓
// 11. BUILD SECTION
ContextSection(
  id: 'hot_now',
  title: '🔥 Hot Places Right Now',
  subtitle: '5 places open within 500m',
  places: [place1, place2, place3, place4, place5],
  type: SectionType.hotNow
)
  ↓
// 12. RENDER UI
ListView.builder(
  itemBuilder: (context, index) {
    return EnhancedPlaceCard(
      place: section.places[index],
      // Shows:
      // - Image
      // - ✅ Verified badge (rating 4.8 >= 4.5)
      // - Name: "Gangaramaya Temple"
      // - ⭐ 4.8 • 217m • 🟢 Open Now
      // - 💡 "Visit at 3PM for best light"
      // - [Add to Trip] [View]
    )
  }
)
  ↓
USER SEES: 🔥 Hot Places Right Now
           5 places with cards showing all details!
```

---

## 🔄 Caching Strategy

```
┌─────────────────────────────────────────────┐
│ CACHE LAYERS (Fastest → Slowest)           │
├─────────────────────────────────────────────┤
│ 1. Memory Cache (Map)                       │
│    - Instant access                         │
│    - Lost on app restart                    │
│    - 24hr expiry                            │
├─────────────────────────────────────────────┤
│ 2. Offline Storage (Hive)                   │
│    - Persists across restarts               │
│    - Works offline                          │
│    - No expiry                              │
├─────────────────────────────────────────────┤
│ 3. Azure Blob Storage                       │
│    - Cloud backup                           │
│    - Shared across devices                  │
│    - Fallback option                        │
├─────────────────────────────────────────────┤
│ 4. Backend API                              │
│    - Fresh data                             │
│    - Costs API calls                        │
│    - Requires internet                      │
└─────────────────────────────────────────────┘

FLOW:
1. Check memory → Found? Return ✅
2. Check offline → Found? Return ✅
3. Check Azure Blob → Found? Return ✅
4. Call Backend API → Cache result → Return ✅
```

---

## 🎯 Context-Aware Queries

### How Queries Are Generated

```dart
// TIME-BASED
if (hour >= 18) {
  query = "bars restaurants nightlife entertainment"
  section = "🌙 Tonight in Colombo"
}

// WEATHER-BASED
if (isRainy) {
  query = "museums galleries shopping malls indoor"
  section = "☔ Weather-Aware Picks"
}

// PROXIMITY-BASED
query = "restaurants cafes attractions open now"
radius = 500 // meters
section = "🔥 Hot Places Right Now"

// TRAVEL-STYLE BASED
if (selectedStyles.contains('Foodie')) {
  query = "top rated restaurants local cuisine food markets"
  section = "🌟 For Your Travel Style"
}
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   USER      │
│  Location   │
│  6.9271,    │
│  79.8612    │
└──────┬──────┘
       │
       ↓
┌──────────────────────────────────────┐
│  EXPLORE SCREEN                      │
│  - Time: 2 PM                        │
│  - Weather: Sunny                    │
│  - Filters: [Foodie, Explorer]      │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  CONTEXT GENERATOR                   │
│  Creates 4 queries:                  │
│  1. "restaurants cafes open" (500m)  │
│  2. "landmarks attractions" (2km)    │
│  3. "foodie restaurants" (5km)       │
│  4. "museums culture" (5km)          │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  PLACES SERVICE                      │
│  For each query:                     │
│  - Check cache                       │
│  - If miss → API call                │
│  - Filter results                    │
│  - Save to cache                     │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  BACKEND API                         │
│  - Azure OpenAI generates places     │
│  - Google Places fetches photos      │
│  - Returns JSON                      │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  PLACE OBJECTS                       │
│  [Place1, Place2, Place3, ...]       │
│  Each with:                          │
│  - name, rating, address             │
│  - lat/lng, photo, description       │
│  - localTip, isOpenNow               │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  CONTEXT SECTIONS                    │
│  [                                   │
│    Section1: Hot Places (5 places)   │
│    Section2: Tonight (5 places)      │
│    Section3: Foodie (5 places)       │
│    Section4: Culture (3 places)      │
│  ]                                   │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  UI RENDERING                        │
│  For each section:                   │
│    - Section header                  │
│    - For each place:                 │
│      → EnhancedPlaceCard             │
│        - Image                       │
│        - Verified badge              │
│        - Distance (calculated)       │
│        - Community tip               │
│        - Action buttons              │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  USER SEES                           │
│  🔥 Hot Places Right Now             │
│  [Card] [Card] [Card] [Card] [Card]  │
│                                      │
│  🌙 Tonight in Colombo               │
│  [Card] [Card] [Card] [Card] [Card]  │
│                                      │
│  🌟 For Your Travel Style            │
│  [Card] [Card] [Card] [Card] [Card]  │
└──────────────────────────────────────┘
```

---

## 🔑 Key Components

### 1. PlacesService
**File**: `services/places_service.dart`
**Role**: Fetch, cache, and manage places data

```dart
fetchPlacesPipeline(
  latitude: 6.9271,
  longitude: 79.8612,
  query: "restaurants",
  radius: 500,
  topN: 5
)
```

### 2. Backend API
**File**: `backend/routes/mobile-places.js`
**Role**: Generate places using AI + fetch photos

```javascript
GET /api/places/mobile/nearby
  ?lat=6.9271
  &lng=79.8612
  &q=restaurants
  &radius=500
  &limit=5
```

### 3. Place Model
**File**: `models/place.dart`
**Role**: Data structure for places

```dart
class Place {
  String id;
  String name;
  double rating;
  double? latitude;
  double? longitude;
  String photoUrl;
  String description;
  String localTip;
  bool? isOpenNow;
}
```

### 4. Context Section
**File**: `models/context_section.dart`
**Role**: Group places by context

```dart
class ContextSection {
  String title;
  String subtitle;
  List<Place> places;
  SectionType type;
}
```

---

## 🎯 Summary

**The flow is:**
1. User opens Explore
2. Screen gets location + time + weather
3. Generates context-aware queries
4. Calls PlacesService for each query
5. Service checks cache → API if needed
6. Backend generates places with AI
7. Response converted to Place objects
8. Filtered, cached, and grouped into sections
9. UI renders EnhancedPlaceCards
10. User sees context-aware places!

**Key Features:**
- ✅ Smart caching (3 layers)
- ✅ Context-aware queries
- ✅ Real-time distance calculation
- ✅ AI-generated places
- ✅ Photo integration
- ✅ Offline support

---

**Want to see it in action?**
Open Explore → Pull to refresh → Watch console logs!
