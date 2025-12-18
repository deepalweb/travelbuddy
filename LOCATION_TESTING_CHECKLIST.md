# ✅ GPS Location Testing Checklist

## 🧪 **Frontend Testing**

### **LocationPicker Component**

#### **Search Functionality**
- [ ] Type 3+ characters in search box
- [ ] Verify suggestions dropdown appears
- [ ] Select a suggestion
- [ ] Verify coordinates auto-fill
- [ ] Verify address auto-fills
- [ ] Verify city/country extracted

#### **Current Location Button**
- [ ] Click "Use My Current Location"
- [ ] Browser permission dialog appears
- [ ] Click "Allow"
- [ ] Verify coordinates captured
- [ ] Verify address generated via reverse geocoding
- [ ] Verify loading spinner shows during fetch
- [ ] Test "Deny" permission → fallback to manual entry

#### **Manual Entry**
- [ ] Enter latitude: `6.9271`
- [ ] Enter longitude: `79.8612`
- [ ] Verify coordinates accepted
- [ ] Type address manually
- [ ] Verify all fields editable

#### **Validation**
- [ ] Leave latitude empty → error shown
- [ ] Leave longitude empty → error shown
- [ ] Enter invalid lat (>90) → validation error
- [ ] Enter invalid lng (>180) → validation error
- [ ] Leave address empty → error shown

#### **Map Preview**
- [ ] Enter valid coordinates
- [ ] Verify "View on Map" link appears
- [ ] Click link → opens OpenStreetMap in new tab
- [ ] Verify correct location shown on map

---

### **Create Deal Page**

#### **Location Section**
- [ ] Navigate to Create Deal page
- [ ] Scroll to "Location & Validity" section
- [ ] Verify LocationPicker component renders
- [ ] Test search functionality
- [ ] Test current location button
- [ ] Test manual entry
- [ ] Fill all required fields
- [ ] Submit form
- [ ] Verify no console errors
- [ ] Check network tab → location data sent correctly

#### **Data Format**
```json
Expected payload:
{
  "location": {
    "address": "123 Main St, Colombo",
    "coordinates": {
      "lat": 6.9271,
      "lng": 79.8612
    },
    "city": "Colombo",
    "country": "Sri Lanka"
  }
}
```

---

### **Travel Agent Registration**

#### **Location Section**
- [ ] Navigate to Travel Agent Registration
- [ ] Find "Your Business Location" section
- [ ] Verify LocationPicker renders
- [ ] Test all location entry methods
- [ ] Complete registration form
- [ ] Submit
- [ ] Verify location data saved

---

### **Transport Provider Registration**

#### **Location Section**
- [ ] Navigate to Transport Registration
- [ ] Find "Business Location (GPS)" section
- [ ] Verify LocationPicker renders
- [ ] Test all location entry methods
- [ ] Complete registration form
- [ ] Submit
- [ ] Verify location syncs with address field

---

## 🗄️ **Backend Testing**

### **Schema Updates**

#### **Check Schemas**
- [ ] Open `models/Deal.js`
- [ ] Verify `location.coordinates` field exists
- [ ] Verify GeoJSON format: `{ type: 'Point', coordinates: [Number] }`
- [ ] Check `2dsphere` index exists
- [ ] Repeat for TravelAgent model
- [ ] Repeat for TransportProvider model

#### **Test Data Save**
```bash
# Create a test deal via API
curl -X POST http://localhost:5000/api/deals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Deal",
    "location": {
      "address": "Colombo, Sri Lanka",
      "coordinates": {
        "lat": 6.9271,
        "lng": 79.8612
      }
    }
  }'

# Verify in MongoDB
mongo
> use travelbuddy
> db.deals.findOne({ title: "Test Deal" })
# Check: location.coordinates.coordinates = [79.8612, 6.9271]
```

---

### **Proximity Endpoints**

#### **Test Nearby Deals**
```bash
# Test 1: Basic query
curl "http://localhost:5000/api/deals/nearby?lat=6.9271&lng=79.8612&radius=5000"

# Expected: Array of deals within 5km
# Verify: Each deal has distance field
# Verify: Sorted by distance (closest first)

# Test 2: Different radius
curl "http://localhost:5000/api/deals/nearby?lat=6.9271&lng=79.8612&radius=10000"

# Expected: More results (10km radius)

# Test 3: No results area
curl "http://localhost:5000/api/deals/nearby?lat=0&lng=0&radius=1000"

# Expected: Empty array or no results

# Test 4: Missing parameters
curl "http://localhost:5000/api/deals/nearby"

# Expected: 400 error "Latitude and longitude required"
```

#### **Test Nearby Travel Agents**
```bash
curl "http://localhost:5000/api/travel-agents/nearby?lat=6.9271&lng=79.8612&radius=10000"

# Verify: Returns agents within 10km
# Verify: Distance calculated correctly
```

#### **Test Nearby Transport Providers**
```bash
curl "http://localhost:5000/api/transport-providers/nearby?lat=6.9271&lng=79.8612&radius=15000&vehicleType=Car"

# Verify: Returns providers within 15km
# Verify: Filtered by vehicle type
```

---

### **Coordinate Transformation**

#### **Verify Transform on Save**
```javascript
// Frontend sends:
{ lat: 6.9271, lng: 79.8612 }

// Backend should save as:
{ coordinates: [79.8612, 6.9271] } // [lng, lat]

// Test:
const deal = await Deal.findOne({ title: "Test Deal" })
console.log(deal.location.coordinates.coordinates)
// Should print: [79.8612, 6.9271]
```

#### **Verify Transform on Response**
```javascript
// MongoDB has:
{ coordinates: [79.8612, 6.9271] }

// API should return:
{ coordinates: { lat: 6.9271, lng: 79.8612 } }

// Test:
curl "http://localhost:5000/api/deals/123"
// Check response format
```

---

## 📱 **Mobile App Testing**

### **Location Permission**
- [ ] Open mobile app
- [ ] App requests location permission
- [ ] Grant permission
- [ ] Verify GPS coordinates captured
- [ ] Deny permission → fallback behavior works

### **Near Me Search**
- [ ] Tap "Restaurants Near Me"
- [ ] Verify API call made with current location
- [ ] Verify results displayed
- [ ] Verify distance shown on each card
- [ ] Verify sorted by distance

### **Distance Display**
- [ ] Check each result card
- [ ] Verify distance format: "2.3 km away"
- [ ] Verify distance accurate (use Google Maps to verify)

### **Radius Filter**
- [ ] Select "1 km" radius
- [ ] Verify fewer results
- [ ] Select "10 km" radius
- [ ] Verify more results

### **Map View**
- [ ] Switch to map view
- [ ] Verify user location shown (blue pin)
- [ ] Verify deals shown (red pins)
- [ ] Tap a pin → details shown
- [ ] Verify distance displayed

### **Navigation**
- [ ] Tap "Navigate" on a deal
- [ ] Verify opens Google Maps / Apple Maps
- [ ] Verify correct destination
- [ ] Verify route calculated

---

## 🔒 **Security Testing**

### **Permission Handling**
- [ ] Test without HTTPS → geolocation blocked
- [ ] Test with HTTPS → geolocation works
- [ ] Test permission denial → graceful fallback
- [ ] Test permission revoked → re-request works

### **Input Validation**
- [ ] Enter lat > 90 → rejected
- [ ] Enter lat < -90 → rejected
- [ ] Enter lng > 180 → rejected
- [ ] Enter lng < -180 → rejected
- [ ] Enter non-numeric values → rejected
- [ ] SQL injection attempt → sanitized
- [ ] XSS attempt in address → escaped

### **API Security**
- [ ] Test without auth token → 401 error
- [ ] Test with invalid token → 401 error
- [ ] Test rate limiting → 429 after limit
- [ ] Test CORS → only allowed origins

---

## 🌐 **Cross-Browser Testing**

### **Desktop Browsers**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### **Mobile Browsers**
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet (Android)

### **Features to Test**
- [ ] Geolocation API works
- [ ] Search autocomplete works
- [ ] Map links open correctly
- [ ] Form submission works
- [ ] Responsive design looks good

---

## 🚀 **Performance Testing**

### **Search Performance**
- [ ] Type in search box
- [ ] Verify debouncing (500ms delay)
- [ ] Verify no excessive API calls
- [ ] Verify suggestions load quickly (<1s)

### **Proximity Query Performance**
- [ ] Query 1000+ deals
- [ ] Verify response time <500ms
- [ ] Verify geospatial index used (check MongoDB explain)
- [ ] Test with 10,000+ records

### **Mobile App Performance**
- [ ] Test on slow 3G network
- [ ] Verify loading indicators shown
- [ ] Verify graceful degradation
- [ ] Test offline behavior

---

## 🐛 **Edge Cases**

### **Location Edge Cases**
- [ ] User at North Pole (lat = 90)
- [ ] User at South Pole (lat = -90)
- [ ] User at International Date Line (lng = 180)
- [ ] User at Prime Meridian (lng = 0)
- [ ] User at Equator (lat = 0)

### **Search Edge Cases**
- [ ] Search for non-existent location
- [ ] Search with special characters
- [ ] Search with very long query
- [ ] Search with emoji
- [ ] Search in different languages

### **Data Edge Cases**
- [ ] Deal with no location
- [ ] Deal with invalid coordinates
- [ ] Deal at exact user location (distance = 0)
- [ ] Deal very far away (>10,000 km)

---

## 📊 **Acceptance Criteria**

### **Must Have ✅**
- [x] LocationPicker component works
- [x] All 3 forms updated
- [x] Search functionality works
- [x] Current location detection works
- [x] Manual entry works
- [ ] Backend saves coordinates correctly
- [ ] Proximity queries work
- [ ] Mobile app shows "Near Me" results
- [ ] Distance displayed accurately

### **Should Have 🟡**
- [ ] Map preview link works
- [ ] Reverse geocoding works
- [ ] City/country extraction works
- [ ] Radius filters work
- [ ] Sort by distance works

### **Nice to Have 🟢**
- [ ] Multiple locations per business
- [ ] Service area radius
- [ ] Geofencing notifications
- [ ] Location history

---

## ✅ **Sign-Off Checklist**

### **Frontend Developer**
- [ ] All components tested
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Cross-browser tested
- [ ] Code reviewed

### **Backend Developer**
- [ ] Schemas updated
- [ ] Indexes created
- [ ] Endpoints tested
- [ ] Coordinate transformation verified
- [ ] Performance optimized

### **Mobile Developer**
- [ ] "Near Me" functionality works
- [ ] Distance calculations accurate
- [ ] Map integration works
- [ ] Navigation works
- [ ] Tested on iOS and Android

### **QA Tester**
- [ ] All test cases passed
- [ ] Edge cases handled
- [ ] Security tested
- [ ] Performance acceptable
- [ ] User experience smooth

### **Product Owner**
- [ ] Meets requirements
- [ ] User stories completed
- [ ] Acceptance criteria met
- [ ] Ready for production

---

## 🎉 **Testing Complete!**

**Status:** ⏳ In Progress

**Next:** Complete backend implementation and mobile app integration

**Goal:** Full "Near Me" functionality for travelers! 🚀
