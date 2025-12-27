# Real/AI Places Toggle Implementation

## Overview
Added a toggle button to the Places screen that allows users to switch between Real Places (Google Places API) and AI-generated places.

## Changes Made

### 1. UI Component (places_screen.dart)
- Added `SegmentedButton` widget with two options:
  - **Real Places** (icon: place)
  - **AI Places** (icon: auto_awesome)
- Positioned below the app bar, above the search bar
- Uses `appProvider.useRealPlaces` state to track selection

### 2. State Management (app_provider.dart)

#### New State Variable
```dart
bool _useRealPlaces = true; // true = Google Places, false = AI Places
```

#### New Getter
```dart
bool get useRealPlaces => _useRealPlaces;
```

#### New Method
```dart
void setPlacesSource(bool useReal) {
  _useRealPlaces = useReal;
  _places.clear();
  _currentPage = 1;
  _hasMorePlaces = true;
  notifyListeners();
  loadNearbyPlaces();
}
```

### 3. Data Fetching Logic (app_provider.dart)

Updated `loadNearbyPlaces()` method to check `_useRealPlaces`:

#### AI Places Mode (`_useRealPlaces = false`)
- Fetches from: `${backendUrl}/api/ai-places/nearby`
- Query params: `lat`, `lng`, `radius`, `limit`
- Returns AI-generated places with realistic data
- Timeout: 15 seconds

#### Real Places Mode (`_useRealPlaces = true`)
- Uses existing Google Places API pipeline
- Fetches real places via `PlacesService`
- Includes all existing features (ranking, filtering, caching)

## API Endpoint

### AI Places Endpoint
```
GET /api/ai-places/nearby
```

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Search radius in meters (default: 20000)
- `limit` (optional): Number of places to return (default: 10)

**Response Format:**
```json
{
  "places": [
    {
      "id": "ai_123456",
      "name": "Restaurant Name",
      "address": "123 Main St",
      "latitude": 6.9271,
      "longitude": 79.8612,
      "rating": 4.5,
      "type": "restaurant",
      "photoUrl": "https://...",
      "description": "AI-generated description",
      "localTip": "AI-generated tip",
      "handyPhrase": "AI-generated phrase"
    }
  ]
}
```

## User Flow

1. User opens Places screen
2. Sees toggle button at the top: **Real Places** | **AI Places**
3. Default selection: **Real Places** (Google data)
4. User taps **AI Places**:
   - Places list clears
   - Loading indicator shows
   - Fetches AI-generated places from backend
   - Displays AI places with realistic data
5. User taps **Real Places**:
   - Places list clears
   - Fetches real places from Google Places API
   - Displays actual places

## Benefits

### For Users
- **Real Places**: Accurate, verified data from Google
- **AI Places**: Fast, always available, no API limits
- Seamless switching between modes
- No data loss when switching

### For Development
- Test AI generation without Google API costs
- Demonstrate AI capabilities
- Fallback option if Google API fails
- Easy A/B testing

## Testing

### Test Real Places Mode
1. Open app
2. Navigate to Places screen
3. Verify "Real Places" is selected by default
4. Verify places load from Google Places API
5. Check place details are accurate

### Test AI Places Mode
1. Tap "AI Places" toggle
2. Verify places list clears and reloads
3. Verify AI-generated places appear
4. Check AI descriptions and tips
5. Verify realistic data (names, ratings, addresses)

### Test Toggle Switching
1. Switch from Real to AI
2. Verify smooth transition
3. Switch from AI to Real
4. Verify data refreshes correctly
5. Test multiple rapid switches

## Backend Requirements

The backend must have the `/api/ai-places/nearby` endpoint implemented. This endpoint should:
1. Accept lat/lng coordinates
2. Generate realistic place data using AI
3. Return places in the expected format
4. Handle errors gracefully

## Future Enhancements

1. **Hybrid Mode**: Mix real and AI places
2. **AI Quality Indicator**: Show confidence scores
3. **User Preference**: Remember last selected mode
4. **Analytics**: Track which mode users prefer
5. **Smart Fallback**: Auto-switch to AI if Google API fails

## Notes

- Default mode is **Real Places** for production quality
- AI mode is instant (no Google API delays)
- Both modes use the same UI components
- Toggle state is not persisted (resets on app restart)
- AI places have `id` prefix: `ai_` for identification
