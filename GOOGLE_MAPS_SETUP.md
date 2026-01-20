# Google Maps API Configuration Issue

## Problem
The map is not loading in post creation on `/community` page with error:
```
Google Maps JavaScript API error: RefererNotAllowedMapError
Your site URL to be authorized: https://travelbuddylk.com/community
```

### Root Causes (Multiple Issues)
1. **HTTP Referrer Restrictions**: Domain not authorized in API key config
2. **IP Address Restrictions**: API key restricted to backend IPs only (127.0.0.1, 128.85.209.147, 172.175.18.112, 20.*.*.*, 4.*.*.*, 9.*.*.*)
3. **Client-Side API Call**: Frontend makes direct Google Maps API calls from user browsers (different IPs than your servers)

## Solution

### ⚠️ TWO ISSUES DISCOVERED

**Issue 1: Frontend Maps** (Maps won't load)
- Cause: IP address restrictions blocking user browsers
- Solution: Switch to HTTP referrer restrictions

**Issue 2: Backend API Calls** (Places search returns 500 error)
- Cause: HTTP referrer restrictions blocking backend server calls  
- Solution: Use separate API key for backend OR add backend referrer

### RECOMMENDED: Use Two Separate API Keys

**Key 1: VITE_GOOGLE_MAPS_API_KEY (Frontend Maps)**
- Restriction: HTTP referrers only
- Used by: LocationPicker, InteractiveMap, StoryMap, TripMap
- Allows: User browsers from `travelbuddylk.com/*`

**Key 2: GOOGLE_PLACES_API_KEY (Backend Services)**
- Restriction: IP addresses (your Azure backend IPs)
- Used by: enhanced-places, search, geocoding, places routes
- Allows: Only backend server requests

### Step 1: Create New API Key for Frontend

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services → Credentials → Create Credentials → API Key**
3. Name it: `Web Maps Key (Frontend Only)`
4. Click the new key to configure it
5. **Application restrictions → HTTP referrers (web sites)**
6. Add these domains:
   ```
   https://travelbuddylk.com/*
   http://localhost:3000/*
   http://localhost:5173/*
   ```
7. **API restrictions → Select "Maps JavaScript API" and "Places API"**
8. Save and copy the key

### Step 2: Keep Existing Backend Key

Keep your current key `AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ` configured with:
- **Application restrictions**: IP addresses (keep current)
- **API restrictions**: Keep all APIs enabled
- **Backend usage**: Places search, geocoding, enrichment

### Step 3: Update Frontend Configuration

Update `frontend/index.html` (line 44):
```html
<!-- Use new frontend-only key -->
<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_NEW_FRONTEND_KEY_HERE&libraries=places"></script>
```

Or use environment variable:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSy..." data-api-key="" id="google-maps-script"></script>
<script>
  // Load dynamically if needed
  const script = document.getElementById('google-maps-script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${window.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
</script>
```

### Step 4: Keep Backend Configuration

Backend continues using `GOOGLE_PLACES_API_KEY` environment variable:
```bash
GOOGLE_PLACES_API_KEY=AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ  # Existing backend key
```

### Step 5: Test Both Systems

**Frontend Maps Test:**
1. Visit `https://travelbuddylk.com/community`
2. Click "Review a Place"
3. Map should load ✓
4. Location picker should work ✓

**Backend Places Search Test:**
1. Visit `https://travelbuddylk.com/` (Discovery page)
2. Search for "Nuwara Eliya"
3. Results should appear ✓
4. No 500 errors ✓

### Why This Happens

**With Single Key + HTTP Referrers:**
```
Frontend Browser (✓ Works)
  → API request includes referrer: "https://travelbuddylk.com/community"
  → Matches HTTP referrer restriction
  → Maps loads ✓

Backend Server (✗ Fails)
  → API request from: 128.85.209.147
  → No valid referrer header
  → Blocked by HTTP referrer restriction
  → 500 error ✗
```

**With Two Keys (✓ Optimal):**
```
Frontend Browser (✓ Works)
  → Calls VITE_GOOGLE_MAPS_API_KEY
  → HTTP referrer: "https://travelbuddylk.com/community"
  → Matched against HTTP restrictions
  → Maps loads ✓

Backend Server (✓ Works)
  → Calls GOOGLE_PLACES_API_KEY  
  → IP: 128.85.209.147
  → Matched against IP restrictions
  → Places search works ✓
```

## How Google Maps Script is Loaded

In `frontend/index.html` (line 44):
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ&libraries=places"></script>
```

This script loads the Google Maps library globally for use in:
- **LocationPicker.tsx** - Location selection in post creation
- **InteractiveMap.tsx** - Interactive map with draggable marker
- **StoryMap.tsx** - Map view in community feed
- **TripMap.tsx** - Map view in trip planning
- Other map-based components

## Map Components Using Google Maps

### 1. LocationPicker Component
- **Path**: `frontend/src/components/LocationPicker.tsx`
- **Use**: Select location for posting/reviewing places
- **Features**:
  - Search by address (Nominatim/OpenStreetMap)
  - Get current location (browser geolocation)
  - Manual coordinate entry
  - Address display

### 2. InteractiveMap Component
- **Path**: `frontend/src/components/InteractiveMap.tsx`
- **Use**: Embedded map for location selection
- **Features**:
  - Draggable marker
  - Click to set location
  - Automatic address reverse geocoding
  - Zoom and pan controls

### 3. Fallback: OpenStreetMap (Nominatim)
- Used for reverse geocoding addresses
- No API key required
- Alternative when Google Maps unavailable

## API Key Restrictions

### Current Setup ⚠️ BLOCKING MAPS
- **Restriction Type**: IP addresses (blocks client-side requests)
- **Allowed IPs**: Azure backend servers only
- **Problem**: Frontend maps called from user browsers → Different IPs → Blocked

### Recommended Configuration ✅
- **Restriction Type**: HTTP referrers only
- **Allowed Domains**: `https://travelbuddylk.com/*` and localhost
- **Benefit**: Allows user browsers to access maps
- **Security**: Still protected by domain-based restrictions

### Best Practices for Different Use Cases

**Use Case 1: Frontend Maps (Your Current Setup)**
```
Restriction: HTTP referrers only
Domains:
  - https://travelbuddylk.com/*
  - http://localhost:3000/*
  - http://localhost:5173/*
```

**Use Case 2: Backend API Calls**
```
Restriction: IP addresses
IPs: Your backend server IPs
(Keep IP restrictions for backend services)
```

## Implementation Guide: Two Separate API Keys

### Phase 1: Google Cloud Console Setup (User Action)

#### Step 1.1: Keep Existing Backend Key
Your current key: `AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ`
- ✅ Keep **IP Address restrictions** 
- ✅ Keep all APIs enabled
- ✅ Environment variable: `GOOGLE_PLACES_API_KEY`

#### Step 1.2: Create New Frontend Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Create Credentials → API Key**
3. Name it: `TravelBuddy Web Maps (Frontend)`
4. Click the new key to open settings
5. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add these domains:
     ```
     https://travelbuddylk.com/*
     http://localhost:3000/*
     http://localhost:5173/*
     ```
6. Under **API restrictions**:
   - Select **Restrict key**
   - Choose only: **Maps JavaScript API** and **Places API**
7. Copy the new key and save it

### Phase 2: Environment Configuration (Local)

#### Step 2.1: Update Backend `.env`
```bash
# Keep existing key for backend
GOOGLE_PLACES_API_KEY=AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ
```

#### Step 2.2: Update Frontend `.env`
```bash
# Add new frontend key
VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_FRONTEND_API_KEY_HERE
```

#### Step 2.3: Update Frontend `.env.production`
```bash
# Production frontend key
VITE_GOOGLE_MAPS_API_KEY=YOUR_NEW_FRONTEND_API_KEY_HERE
```

### Phase 3: Code Updates (Automatic via this guide)

#### Step 3.1: Update Frontend HTML

Update `frontend/index.html` to use environment variable:

```html
<!-- OLD: Hardcoded key (remove) -->
<!-- <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ&libraries=places"></script> -->

<!-- NEW: Use environment variable -->
<script async defer id="google-maps-script"></script>
<script>
  // Load Google Maps with environment-specific key
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_DEFAULT_KEY';
  document.getElementById('google-maps-script').src = 
    `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
</script>
```

#### Step 3.2: Backend Configuration (No Changes Needed)

Backend uses `GOOGLE_PLACES_API_KEY` which continues working:
- All routes automatically use the backend key
- IP restrictions still protect server calls
- No code changes required

### Phase 4: Testing

#### Test 1: Frontend Maps
```
1. Set VITE_GOOGLE_MAPS_API_KEY in .env
2. Run: npm run dev (frontend)
3. Visit: http://localhost:5173/community
4. Click "Review a Place"
5. ✅ Map should load with draggable marker
6. ✅ Location search should work
```

#### Test 2: Backend Places Search
```
1. Set GOOGLE_PLACES_API_KEY in backend .env
2. Run: npm start (backend)
3. Visit: http://localhost:3000/
4. Search for "Nuwara Eliya"
5. ✅ Results should appear
6. ✅ No 500 errors
```

#### Test 3: Production
```
1. Deploy with VITE_GOOGLE_MAPS_API_KEY (frontend key)
2. Visit: https://travelbuddylk.com/community
3. Click "Review a Place"
4. ✅ Map should load
5. Visit: https://travelbuddylk.com/
6. Search should work
7. ✅ No errors on either system
```

### Summary of Changes

| Component | Old Setup | New Setup |
|-----------|-----------|-----------|
| **Frontend Maps** | Backend IP key (❌ Blocked) | Frontend HTTP key (✅ Works) |
| **Backend Places** | Backend IP key (✅ Works) | Backend IP key (✅ Continues) |
| **Frontend .env** | Not needed | VITE_GOOGLE_MAPS_API_KEY |
| **Backend .env** | GOOGLE_PLACES_API_KEY | GOOGLE_PLACES_API_KEY (unchanged) |
| **index.html** | Hardcoded key | Environment variable |
| **Security** | Mixed restrictions | Separated & optimized |
| **User Experience** | Maps blocked (❌) | Maps work (✅) |
| **Places Search** | Works (✅) | Works (✅) |

### Why You're Getting RefererNotAllowedMapError
1. You have IP restrictions enabled
2. IP restrictions reject all requests not from those IPs
3. Browser requests from users fail before checking referrer
4. Error message mentions "referrer" but real issue is IP block

### Environment Variable Setup
Add to `.env` files:
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ
```

Then update `index.html`:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${VITE_GOOGLE_MAPS_API_KEY}&libraries=places"></script>
```

## Troubleshooting

### Issue: RefererNotAllowedMapError persists
- **Solution**: Clear browser cache completely
- **Solution**: Try incognito/private browsing
- **Solution**: Wait up to 5 minutes for API changes to propagate
- **Solution**: Verify the exact referrer URL in developer console

### Issue: Maps API shows blank
- **Check**: Browser console for errors (F12)
- **Check**: Network tab to see if API script loaded
- **Check**: API key hasn't been regenerated

### Issue: Can't authorize `https://travelbuddylk.com/community`
- **Reason**: You need the parent domain pattern `https://travelbuddylk.com/*`
- **Not needed**: Individual page URLs (community, community/*, etc.)
- **Wildcard**: The `/*` pattern covers all subpaths automatically

## Related Components Status
- ✅ LocationPicker: Fully functional
- ✅ InteractiveMap: Fully functional
- ✅ StoryMap: Awaiting referrer authorization
- ✅ Community posting: Blocked until referrers configured
- ⚠️ All map features: Require proper API key authorization

## Complete Component Mapping

### Frontend Components (Need: VITE_GOOGLE_MAPS_API_KEY)
1. **LocationPicker** (`LocationPicker.tsx`) - Post creation location
2. **InteractiveMap** (`InteractiveMap.tsx`) - Draggable map marker
3. **StoryMap** (`StoryMap.tsx`) - Community feed map view
4. **TripMap** (`TripMap.tsx`) - Trip planning visualization

### Backend Services (Need: GOOGLE_PLACES_API_KEY)
1. **enhanced-places** - AI-powered place search & enrichment
2. **places** - Place search & nearby places
3. **search** - Global search including places
4. **geocoding** - Address/coordinates conversion
5. **place-details** - Rich place information
6. Plus 15+ other routes making Google Places calls

### Error States to Watch For

**Maps Won't Load:**
- Error: `RefererNotAllowedMapError`
- Status: 403
- Cause: IP restrictions or missing referrer
- Fix: Switch to HTTP referrer restrictions

**Places Search Returns 500:**
- Error: `Google Places API error: REQUEST_DENIED`
- Status: 500
- Cause: HTTP referrers blocking backend
- Fix: Use separate backend API key with IP restrictions
