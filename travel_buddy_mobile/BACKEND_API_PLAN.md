# Backend API Endpoints Required

## 1. Daily Suggestions API
```
GET /api/users/{userId}/daily-suggestions
Query params: lat, lng, weather, timeOfDay, userStyle
Response: { suggestions: string[] }
```

## 2. Local Discoveries API  
```
GET /api/discoveries/local
Query params: lat, lng, radius, userStyle
Response: { 
  title: string,
  description: string, 
  hiddenGems: object[],
  localTips: string[],
  events: object[]
}
```

## 3. Enhanced Deals API
```
GET /api/deals/nearby
Query params: lat, lng, radius, userId
Response: { deals: Deal[] }

POST /api/deals/{dealId}/claim
Body: { userId: string }
Response: { success: boolean }
```

## 4. Enhanced Travel Stats API
```
GET /api/users/{userId}/travel-stats
Response: {
  placesVisitedThisMonth: number,
  totalDistanceKm: number,
  currentStreak: number,
  favoriteCategory: string,
  totalPlacesVisited: number
}

POST /api/users/{userId}/travel-stats
Body: TravelStats
Response: { success: boolean }
```