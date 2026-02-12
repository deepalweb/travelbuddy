# Azure OpenAI Hospital Integration

## Overview
Integrated Azure OpenAI to find nearest hospitals using user's GPS location in the Safety Hub.

## Changes Made

### 1. Backend API Endpoint (`backend/routes/ai-nearby.js`)
- Created `/api/ai/find-nearby` endpoint
- Uses Azure OpenAI to format hospital information
- Integrates with Google Places API to get real hospital data
- Returns nearest 3 hospitals with:
  - Name
  - Address
  - Distance (calculated using Haversine formula)
  - Rating

### 2. Server Registration (`backend/server.js`)
- Registered the `ai-nearby` route under `/api/ai`
- Route is now accessible at: `POST /api/ai/find-nearby`

### 3. Flutter API Service (`travel_buddy_mobile/lib/services/api_service.dart`)
- Updated `getNearbyEmergencyServices()` method
- Now tries Azure OpenAI endpoint first
- Falls back to:
  1. Backend emergency services API
  2. Direct Google Places API
- Added `_parseDistance()` helper to parse distance strings

## API Usage

### Request
```dart
POST /api/ai/find-nearby
{
  "latitude": 6.9271,
  "longitude": 79.8612,
  "type": "hospital",
  "query": "Find nearest hospitals"
}
```

### Response
```json
{
  "result": "Colombo General Hospital - 2.3km away",
  "places": [
    {
      "name": "Colombo General Hospital",
      "address": "Regent Street, Colombo 08",
      "rating": 4.2,
      "distance": "2.3km"
    }
  ]
}
```

## How It Works

1. **User opens Safety Hub** → App gets user's GPS location
2. **App calls Azure OpenAI endpoint** → Sends location + "hospital" type
3. **Backend queries Google Places API** → Gets real hospital data
4. **Azure OpenAI formats response** → Creates user-friendly message
5. **App displays hospitals** → Shows in "Nearest Hospitals" section

## Benefits

✅ **Real Data**: Uses Google Places API for actual hospital locations
✅ **Smart Formatting**: Azure OpenAI creates clear, concise messages
✅ **Accurate Distance**: Haversine formula calculates real distances
✅ **Fallback Support**: Multiple fallback options if one fails
✅ **No Fake Data**: Removed all hardcoded fake hospital information

## Testing

To test the integration:

1. Open the mobile app
2. Navigate to Safety Hub
3. Grant location permissions
4. Check "Medical Emergency" section
5. Verify "Nearest Hospitals" shows real data

## Environment Variables Required

```env
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_KEY=your_key
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment
GOOGLE_PLACES_API_KEY=your_google_key
```

## Next Steps

- [ ] Add caching for hospital data
- [ ] Implement offline support
- [ ] Add hospital phone numbers
- [ ] Show hospital operating hours
- [ ] Add directions to hospital
