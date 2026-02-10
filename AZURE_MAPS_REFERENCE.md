# Azure Maps API Quick Reference

## 🔑 Your API Key
```
AZURE_MAPS_API_KEY=your-azure-maps-api-key-here
```

---

## 📍 Common Endpoints

### 1. Fuzzy Search (General Search)
```
GET https://atlas.microsoft.com/search/fuzzy/json
  ?subscription-key={YOUR_KEY}
  &api-version=1.0
  &query=restaurants
  &lat=6.9271
  &lon=79.8612
  &radius=5000
  &limit=100
```

### 2. POI Search (Category-based)
```
GET https://atlas.microsoft.com/search/poi/json
  ?subscription-key={YOUR_KEY}
  &api-version=1.0
  &lat=6.9271
  &lon=79.8612
  &radius=5000
  &categorySet=7315
  &limit=100
```

### 3. Geocoding (Address → Coordinates)
```
GET https://atlas.microsoft.com/search/address/json
  ?subscription-key={YOUR_KEY}
  &api-version=1.0
  &query=Colombo, Sri Lanka
```

### 4. Reverse Geocoding (Coordinates → Address)
```
GET https://atlas.microsoft.com/search/address/reverse/json
  ?subscription-key={YOUR_KEY}
  &api-version=1.0
  &query=6.9271,79.8612
```

### 5. Route Directions
```
GET https://atlas.microsoft.com/route/directions/json
  ?subscription-key={YOUR_KEY}
  &api-version=1.0
  &query=6.9271,79.8612:6.9319,79.8478
  &travelMode=car
```

---

## 🏷️ Category IDs (categorySet)

### Food & Drink
- `7315` - Restaurant
- `7315001` - Fast Food
- `7315025` - Fine Dining
- `9376001` - Cafe/Coffee Shop
- `9376003` - Bar/Pub
- `9376005` - Nightclub

### Accommodation
- `7314` - Hotel/Motel
- `7314002` - Resort
- `7314015` - Guest House

### Attractions
- `7376` - Tourist Attraction
- `7317` - Museum
- `7318` - Historical Site
- `9362` - Park/Garden
- `9992` - Beach

### Shopping
- `7373` - Shopping Center
- `7373002` - Department Store
- `9537` - Market

### Services
- `7321` - Hospital
- `7326` - Pharmacy
- `7328` - Bank
- `7397` - ATM
- `7311` - Gas Station

### Transport
- `7383` - Airport
- `7380` - Train/Bus Station
- `7522` - Parking

---

## 🌍 Travel Modes (for Routing)

- `car` - Driving
- `truck` - Truck routing
- `taxi` - Taxi routing
- `bus` - Bus routing
- `van` - Van routing
- `motorcycle` - Motorcycle
- `bicycle` - Cycling
- `pedestrian` - Walking

---

## 📊 Response Format

### Search Response
```json
{
  "summary": {
    "query": "restaurants",
    "queryType": "NON_NEAR",
    "queryTime": 123,
    "numResults": 10
  },
  "results": [
    {
      "type": "POI",
      "id": "unique-id",
      "score": 2.5,
      "dist": 245.5,
      "info": "search:ta:840061001234567-US",
      "poi": {
        "name": "Restaurant Name",
        "phone": "+1234567890",
        "categorySet": [{ "id": 7315 }],
        "categories": ["restaurant"],
        "classifications": [
          {
            "code": "RESTAURANT",
            "names": [{ "nameLocale": "en-US", "name": "restaurant" }]
          }
        ],
        "url": "http://website.com"
      },
      "address": {
        "streetNumber": "123",
        "streetName": "Main Street",
        "municipalitySubdivision": "Downtown",
        "municipality": "Colombo",
        "countrySecondarySubdivision": "Western",
        "countrySubdivision": "Western Province",
        "postalCode": "00100",
        "countryCode": "LK",
        "country": "Sri Lanka",
        "countryCodeISO3": "LKA",
        "freeformAddress": "123 Main Street, Colombo 00100"
      },
      "position": {
        "lat": 6.9271,
        "lon": 79.8612
      },
      "viewport": {
        "topLeftPoint": { "lat": 6.9281, "lon": 79.8602 },
        "btmRightPoint": { "lat": 6.9261, "lon": 79.8622 }
      },
      "entryPoints": [
        {
          "type": "main",
          "position": { "lat": 6.9271, "lon": 79.8612 }
        }
      ]
    }
  ]
}
```

### Geocoding Response
```json
{
  "summary": {
    "query": "colombo",
    "queryType": "NON_NEAR",
    "queryTime": 45,
    "numResults": 1
  },
  "results": [
    {
      "type": "Geography",
      "id": "LK/GEO/p0/12345",
      "score": 5.0,
      "address": {
        "municipality": "Colombo",
        "countrySubdivision": "Western Province",
        "countryCode": "LK",
        "country": "Sri Lanka",
        "freeformAddress": "Colombo, Sri Lanka"
      },
      "position": {
        "lat": 6.9271,
        "lon": 79.8612
      }
    }
  ]
}
```

### Route Response
```json
{
  "formatVersion": "0.0.12",
  "routes": [
    {
      "summary": {
        "lengthInMeters": 1234,
        "travelTimeInSeconds": 456,
        "trafficDelayInSeconds": 0,
        "departureTime": "2024-01-01T10:00:00Z",
        "arrivalTime": "2024-01-01T10:07:36Z"
      },
      "legs": [
        {
          "summary": {
            "lengthInMeters": 1234,
            "travelTimeInSeconds": 456
          },
          "points": [
            { "latitude": 6.9271, "longitude": 79.8612 },
            { "latitude": 6.9319, "longitude": 79.8478 }
          ]
        }
      ],
      "sections": [
        {
          "startPointIndex": 0,
          "endPointIndex": 1,
          "sectionType": "TRAVEL_MODE",
          "travelMode": "car"
        }
      ]
    }
  ]
}
```

---

## 💡 Tips & Best Practices

### 1. Rate Limiting
- Free tier: 50 requests/second
- Implement caching to reduce API calls
- Use database cache (already implemented in your code)

### 2. Radius Limits
- Maximum radius: 50,000 meters (50 km)
- Optimal radius: 5,000-20,000 meters for best results

### 3. Query Optimization
- Use specific queries: "italian restaurants" vs "restaurants"
- Combine fuzzy search + POI search for better coverage
- Use categorySet for precise results

### 4. Caching Strategy
```javascript
// Already implemented in your code
const cacheKey = `${lat}_${lng}_${query}_${radius}`;
const cached = await PlacesCache.findOne({ key: cacheKey });
```

### 5. Error Handling
```javascript
try {
  const results = await azureMaps.searchPlacesComprehensive(...);
} catch (error) {
  // Fallback to AI-generated places
  const aiPlaces = await AIPlacesGenerator.generatePlaces(...);
}
```

---

## 🔍 Testing Commands

### Test Search
```bash
curl "https://atlas.microsoft.com/search/fuzzy/json?subscription-key=YOUR_KEY&api-version=1.0&query=restaurants&lat=6.9271&lon=79.8612&limit=5"
```

### Test Geocoding
```bash
curl "https://atlas.microsoft.com/search/address/json?subscription-key=YOUR_KEY&api-version=1.0&query=Colombo"
```

### Test Routing
```bash
curl "https://atlas.microsoft.com/route/directions/json?subscription-key=YOUR_KEY&api-version=1.0&query=6.9271,79.8612:6.9319,79.8478&travelMode=car"
```

---

## 📈 Monitoring Usage

### Azure Portal
1. Go to: https://portal.azure.com
2. Navigate to your Azure Maps account
3. Click "Metrics" to see:
   - Total requests
   - Success rate
   - Latency
   - Errors

### Free Tier Limits
- **Search:** 1,000 transactions/day (30,000/month)
- **Routing:** 1,000 transactions/day
- **Geocoding:** 1,000 transactions/day

---

## 🆘 Common Issues

### Issue: "Invalid subscription key"
**Solution:** Check API key in .env file

### Issue: "No results found"
**Solution:** 
- Increase radius
- Use more general query terms
- Try fuzzy search instead of POI search

### Issue: "Rate limit exceeded"
**Solution:**
- Implement caching (already done)
- Add request throttling
- Upgrade to paid tier if needed

---

## 📚 Documentation Links

- **Azure Maps Docs:** https://docs.microsoft.com/en-us/azure/azure-maps/
- **Search API:** https://docs.microsoft.com/en-us/rest/api/maps/search
- **Route API:** https://docs.microsoft.com/en-us/rest/api/maps/route
- **Pricing:** https://azure.microsoft.com/en-us/pricing/details/azure-maps/

---

**Quick Start:** Run `node test-azure-maps.js` to verify everything works! 🚀
