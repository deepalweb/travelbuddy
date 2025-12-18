# 📍 GPS Location Flow Diagram

## 🔄 **Complete Data Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                     WEB APP (Business Users)                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────┐
        │      LocationPicker Component         │
        │  ┌─────────────────────────────────┐  │
        │  │  1. Search Location             │  │
        │  │     "Colombo Fort Station"      │  │
        │  │     ↓ Nominatim API             │  │
        │  │     Returns: lat, lng, address  │  │
        │  └─────────────────────────────────┘  │
        │                                        │
        │  ┌─────────────────────────────────┐  │
        │  │  2. Current Location            │  │
        │  │     Click button                │  │
        │  │     ↓ Browser Geolocation       │  │
        │  │     Returns: lat, lng           │  │
        │  │     ↓ Reverse Geocode           │  │
        │  │     Returns: address            │  │
        │  └─────────────────────────────────┘  │
        │                                        │
        │  ┌─────────────────────────────────┐  │
        │  │  3. Manual Entry                │  │
        │  │     Lat: 6.9271                 │  │
        │  │     Lng: 79.8612                │  │
        │  │     Address: (type manually)    │  │
        │  └─────────────────────────────────┘  │
        └───────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Form Submission     │
                    │   {                   │
                    │     location: {       │
                    │       address: "...", │
                    │       coordinates: {  │
                    │         lat: 6.9271,  │
                    │         lng: 79.8612  │
                    │       }               │
                    │     }                 │
                    │   }                   │
                    └───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Coordinate Transform │
                    │  Frontend: {lat, lng} │
                    │      ↓                │
                    │  MongoDB: [lng, lat]  │
                    │  (REVERSED!)          │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Save to MongoDB     │
                    │   {                   │
                    │     location: {       │
                    │       address: "...", │
                    │       coordinates: {  │
                    │         type: "Point",│
                    │         coordinates:  │
                    │           [79.8612,   │
                    │            6.9271]    │
                    │       }               │
                    │     }                 │
                    │   }                   │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Create 2dsphere      │
                    │  Geospatial Index     │
                    │  (for proximity       │
                    │   queries)            │
                    └───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE APP (Travelers)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Get User Location    │
                    │  GPS: 6.9271, 79.8612 │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  API Request:         │
                    │  GET /api/deals/      │
                    │    nearby?            │
                    │    lat=6.9271&        │
                    │    lng=79.8612&       │
                    │    radius=5000        │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Backend Query:       │
                    │  $near operator       │
                    │  finds all deals      │
                    │  within 5km           │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Calculate Distance   │
                    │  Haversine formula    │
                    │  Returns meters       │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Response:            │
                    │  [                    │
                    │    {                  │
                    │      title: "50% Off",│
                    │      location: {...}, │
                    │      distance: 2300   │
                    │    },                 │
                    │    ...                │
                    │  ]                    │
                    └───────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Display Results:     │
                    │  ┌─────────────────┐  │
                    │  │ 50% Off Pizza   │  │
                    │  │ 📍 2.3 km away  │  │
                    │  │ [View on Map]   │  │
                    │  └─────────────────┘  │
                    │  ┌─────────────────┐  │
                    │  │ Hotel Deal      │  │
                    │  │ 📍 3.7 km away  │  │
                    │  │ [View on Map]   │  │
                    │  └─────────────────┘  │
                    └───────────────────────┘
```

---

## 🎯 **Use Cases**

### **Use Case 1: Merchant Creates Deal**
```
1. Merchant opens "Create Deal" page
2. Searches "Galle Face Hotel, Colombo"
3. Selects from dropdown
4. Coordinates auto-filled: 6.9271, 79.8612
5. Submits form
6. Backend saves with GeoJSON format
7. Deal now discoverable by mobile users nearby
```

### **Use Case 2: Travel Agent Registers**
```
1. Agent opens registration form
2. Clicks "Use My Current Location"
3. Browser asks permission → Allow
4. GPS coordinates captured: 6.9271, 79.8612
5. Address auto-generated via reverse geocoding
6. Agent submits form
7. Profile saved with location
8. Travelers can find "Travel Agents Near Me"
```

### **Use Case 3: Traveler Searches Nearby**
```
1. Traveler opens mobile app in Colombo
2. App gets GPS: 6.9271, 79.8612
3. Taps "Restaurants Near Me"
4. App calls: /api/deals/nearby?lat=6.9271&lng=79.8612&radius=5000
5. Backend finds all restaurants within 5km
6. Calculates distance for each
7. Returns sorted by distance
8. App displays: "Pizza Place - 2.3 km away"
9. Traveler taps to view on map
10. Navigation starts
```

---

## 🔄 **Coordinate Transformation**

### **Why Transform?**
MongoDB GeoJSON uses `[longitude, latitude]` order (reversed from standard)

```javascript
// Frontend sends:
{
  coordinates: {
    lat: 6.9271,    // Latitude first
    lng: 79.8612    // Longitude second
  }
}

// Backend transforms to:
{
  coordinates: {
    type: "Point",
    coordinates: [79.8612, 6.9271]  // [lng, lat] - REVERSED!
  }
}

// Backend returns to mobile:
{
  coordinates: {
    lat: 6.9271,    // Back to lat first
    lng: 79.8612    // lng second
  },
  distance: 2300    // Added distance in meters
}
```

---

## 📊 **Proximity Query Visualization**

```
        User Location (6.9271, 79.8612)
                    ⭐
                    │
        ┌───────────┼───────────┐
        │           │           │
        │    5km radius         │
        │           │           │
        │     🏪 Deal 1 (2.3km) │
        │           │           │
        │           │  🏨 Deal 2 (3.7km)
        │           │           │
        │     ✈️ Agent (4.2km)  │
        │           │           │
        └───────────┼───────────┘
                    │
            🚗 Transport (6.5km) ← Outside radius
```

**Query:** `radius=5000` (5km)
**Results:** Deal 1, Deal 2, Agent (sorted by distance)
**Excluded:** Transport (too far)

---

## 🗺️ **Map Integration Flow**

```
Mobile App
    │
    ├─ Get user location (GPS)
    │
    ├─ Fetch nearby deals (API)
    │
    ├─ Display on map:
    │   ├─ Blue pin: User location
    │   ├─ Red pins: Deals
    │   ├─ Green pins: Travel agents
    │   └─ Yellow pins: Transport
    │
    ├─ User taps pin
    │   └─ Show details + distance
    │
    └─ User taps "Navigate"
        └─ Open Google Maps / Apple Maps
```

---

## 🔐 **Security & Privacy Flow**

```
1. User opens form
   ↓
2. Clicks "Use Current Location"
   ↓
3. Browser shows permission dialog
   ├─ Allow → Get GPS coordinates
   └─ Deny → Show manual entry option
   ↓
4. Coordinates sent over HTTPS
   ↓
5. Backend validates coordinates
   ├─ Lat: -90 to 90 ✓
   └─ Lng: -180 to 180 ✓
   ↓
6. Saved to encrypted database
   ↓
7. Only shared when user searches nearby
```

---

## 📱 **Mobile App "Near Me" Flow**

```
┌─────────────────────────────────────┐
│  Mobile App Home Screen             │
│  ┌───────────────────────────────┐  │
│  │  🔍 Search                    │  │
│  │  [Restaurants Near Me]        │  │
│  └───────────────────────────────┘  │
│                                     │
│  Filters:                           │
│  ○ 1 km   ● 5 km   ○ 10 km         │
│                                     │
│  Sort by: Distance ▼                │
│                                     │
│  Results:                           │
│  ┌───────────────────────────────┐  │
│  │ 🍕 Pizza Palace               │  │
│  │ 50% Off All Pizzas            │  │
│  │ 📍 2.3 km away                │  │
│  │ [View] [Navigate]             │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ 🍔 Burger King                │  │
│  │ Buy 1 Get 1 Free              │  │
│  │ 📍 3.7 km away                │  │
│  │ [View] [Navigate]             │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## ✅ **Implementation Checklist**

### **Frontend (✅ DONE)**
- [x] LocationPicker component created
- [x] Create Deal page updated
- [x] Travel Agent registration updated
- [x] Transport registration updated
- [x] Search functionality
- [x] Current location detection
- [x] Manual entry option

### **Backend (⏳ TODO)**
- [ ] Update Deal schema
- [ ] Update TravelAgent schema
- [ ] Update TransportProvider schema
- [ ] Add geospatial indexes
- [ ] Create /nearby endpoints
- [ ] Add coordinate transformation
- [ ] Add distance calculation
- [ ] Test proximity queries

### **Mobile App (⏳ TODO)**
- [ ] Add "Near Me" button
- [ ] Implement distance display
- [ ] Add radius filters
- [ ] Sort by distance
- [ ] Map view with markers
- [ ] Navigation integration

---

**🎯 This flow enables the complete "Near Me" experience for travelers!**
