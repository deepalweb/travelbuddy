# TravelBuddy Core MVP Architecture & Implementation Specification

## 1. Overview and Objectives
TravelBuddy core MVP focuses on the seamless traveler journey:
1. **Home**: Destination inspiration, fast planner entry, recent drafts, and quick-start links.
2. **Plan a Trip**: AI-assisted and manual itinerary creation with structured days, activities, visit durations, transport guidance, and costs.
3. **Find Nearby Places**: Factual, real-world location-based discovery with map and list views, search radius controls, category filters, and direct actions ("Get Directions", "Save Place", "Add to Trip").
4. **My Trips**: Secure persistence, trip editing (add/remove/reorder stops and days), unsaved-change protection, and concurrent-edit prevention using versioning and stable stop IDs.
5. **Profile**: Account management, travel preferences, and saved locations.

Secondary features (community stories, deals, events, transport providers, subscriptions) remain accessible through secondary navigation.

---

## 2. Monorepo Structure & Stack
- **Web Client**: `frontend/` (React 19, TypeScript, Vite 7, Tailwind CSS 4, Lucide icons, React Router 7).
- **Mobile Client**: `travel_buddy_mobile/` (Flutter 3.41, Dart 3.11, Dio, Provider, Geolocator).
- **Backend API**: `backend/` (Node.js 22, Express 4, Mongoose 8, MongoDB).
- **AI Providers**: Configurable abstraction (`backend/config/ai-provider.js`) supporting Azure OpenAI, NVIDIA OpenAI-compatible API, and OpenAI.
- **Maps & Places Providers**: Google Places API (Text Search, Nearby, Geocoding) and external directions via Google Maps / Apple Maps deep links.

---

## 3. Audited Defects & Corrections

| Issue Area | Previous Defect | Architecture Correction |
| :--- | :--- | :--- |
| **Coordinate Validation** | `if (!lat || !lng)` in clients rejected `0` (Equator / Prime Meridian) and accepted non-numeric strings or out-of-range coordinates. | Replaced with strict numeric range checks: finite numbers with `-90 <= lat <= 90` and `-180 <= lng <= 180`. Validated in client services and backend middleware. |
| **Mock Fallback** | Backend endpoints (`places.js`, `azureMapsSearch.js`) fabricated mock places or returned Colombo ("Galle Face Green") anywhere on error. | Strictly removed silent mock generation. Errors return explicit HTTP 502/503 or empty results with clear provider status messages. |
| **Nearby Web Route** | Web app redirected `/places` to `/trips` and lacked a dedicated Nearby discovery interface and primary navigation link. | Added `/nearby` route, `NearbyPage.tsx` with interactive list/map views, permission handling, manual address fallback, and "Add to Trip". |
| **Trip Persistence (Single Item)** | Web `tripService.getTripById(id)` queried `GET /api/users/trip-plans/:id` which did not exist on the backend (returned 404). | Added authorized `GET /api/users/trip-plans/:id` requiring ownership check and returning structured itinerary. |
| **Concurrency & Stop IDs** | Unsaved changes could be overwritten; stops lacked stable IDs; no versioning existed between web and mobile. | Added `version` field to `TripPlan` schema for optimistic concurrency control (`409 Conflict` on stale version) and stable `stopId` generation on activities. |
| **Manual Stop Editing** | `TripDayCard` was read-only with no stop addition, deletion, or reordering. | Added full interactive editing: Add Stop modal, Remove Stop, Reorder (Move Up / Down), and Edit Notes. |

---

## 4. Shared API Contracts

### A. Nearby Places Discovery
- **Endpoint**: `GET /api/places/nearby`
- **Query Parameters**:
  - `lat`: number (`-90` to `90`, required)
  - `lng`: number (`-180` to `180`, required)
  - `q` or `category`: string (optional, e.g., 'restaurants', 'attractions', 'parks', 'culture', 'accommodation')
  - `radius`: number in meters (`1000` to `50000`, default `5000`, server-clamped)
  - `sort`: `'distance' | 'rating'` (default: `'distance'`)
- **Response**:
```json
{
  "success": true,
  "provider": "google_places",
  "center": { "lat": 6.9271, "lng": 79.8612 },
  "radiusMeters": 5000,
  "count": 15,
  "results": [
    {
      "placeId": "ChIJ...",
      "name": "National Museum",
      "category": "culture",
      "address": "Albert Crescent, Colombo",
      "location": { "lat": 6.9108, "lng": 79.8612 },
      "distanceMeters": 1820,
      "rating": 4.5,
      "userRatingsTotal": 3120,
      "openNow": null,
      "photoUrl": "https://...",
      "photoReference": "AZ1...",
      "googleMapsUrl": "https://www.google.com/maps/place/?q=place_id:ChIJ..."
    }
  ]
}
```

### B. User Trip Plans
- **Endpoints**:
  - `GET /api/users/trip-plans`: List authenticated user's trips.
  - `GET /api/users/trip-plans/:id`: Retrieve single trip (authorized owner only).
  - `POST /api/users/trip-plans`: Create trip (manual or AI draft). Generates `stopId` and initializes `version: 1`.
  - `PUT /api/users/trip-plans/:id`: Update trip with optimistic concurrency (`version` checked and incremented).
  - `DELETE /api/users/trip-plans/:id`: Delete trip (authorized owner only).
  - `PATCH /api/users/trip-plans/:id/activities`: Toggle activity visited status.

---

## 5. Security and Location Privacy
- **Foreground Only**: Location permissions are requested only on explicit user interaction ("Use my location") with an explanation displayed before triggering the browser or mobile prompt.
- **No Background Tracking**: Neither web nor mobile continuously tracks coordinates or stores background location trails.
- **No Sensitive Leakage**: Provider credentials and AI keys remain server-side only. Client builds contain zero privileged secrets.
- **Ownership Authorization**: Trip endpoints verify the authenticated Firebase/JWT identity against `userId`. Access by non-owners returns `403 Forbidden` or `404 Not Found`.
