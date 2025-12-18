# 📍 GPS Location - Quick Reference Card

## 🎯 **What Was Done**

✅ **Created LocationPicker component** with:
- Address search (OpenStreetMap)
- Current location detection (GPS)
- Manual lat/lng entry
- Map preview link

✅ **Updated 3 forms:**
- Create Deal Page
- Travel Agent Registration
- Transport Provider Registration

---

## 🚀 **How to Use (Business Users)**

### **Option 1: Search**
1. Type location name
2. Select from dropdown
3. Done! ✅

### **Option 2: Current Location**
1. Click "Use My Current Location"
2. Allow browser permission
3. Done! ✅

### **Option 3: Manual**
1. Enter latitude
2. Enter longitude
3. Edit address
4. Done! ✅

---

## 💻 **For Developers**

### **Use LocationPicker in Any Form:**
```tsx
import { LocationPicker } from '../components/LocationPicker'

<LocationPicker
  value={formData.location}
  onChange={(location) => setFormData({ ...formData, location })}
  required
/>
```

### **Data Structure:**
```typescript
{
  address: string
  coordinates: {
    lat: number  // -90 to 90
    lng: number  // -180 to 180
  }
  city?: string
  country?: string
}
```

---

## 🗄️ **Backend Implementation**

### **1. Update Schema:**
```javascript
location: {
  address: String,
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number] // [lng, lat] - REVERSED!
  }
}

// Add index:
schema.index({ 'location.coordinates': '2dsphere' })
```

### **2. Transform on Save:**
```javascript
// Frontend sends: { lat, lng }
// Save as: [lng, lat]
coordinates: {
  type: 'Point',
  coordinates: [location.coordinates.lng, location.coordinates.lat]
}
```

### **3. Create Proximity Endpoint:**
```javascript
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query
  
  const results = await Model.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius)
      }
    }
  })
  
  res.json(results)
})
```

---

## 📱 **Mobile App Usage**

### **Get Nearby Items:**
```dart
// 1. Get user location
Position position = await Geolocator.getCurrentPosition();

// 2. API call
final response = await http.get(
  Uri.parse('$apiUrl/api/deals/nearby?'
    'lat=${position.latitude}&'
    'lng=${position.longitude}&'
    'radius=5000')
);

// 3. Calculate distance
double distance = Geolocator.distanceBetween(
  position.latitude,
  position.longitude,
  deal.location.coordinates.lat,
  deal.location.coordinates.lng
);

// 4. Display
Text('${(distance / 1000).toStringAsFixed(1)} km away')
```

---

## 🔑 **Key Points**

### **Coordinate Order:**
- **Frontend/GPS:** `(lat, lng)` or `{ lat, lng }`
- **MongoDB:** `[lng, lat]` ← **REVERSED!**
- **Always transform** when saving/loading

### **Distance Units:**
- MongoDB uses **meters**
- 1 km = 1000 meters
- 5 km = 5000 meters

### **Validation:**
- Latitude: -90 to 90
- Longitude: -180 to 180

---

## 📚 **Documentation Files**

| File | Purpose |
|------|---------|
| `LOCATION_PICKER_IMPLEMENTATION.md` | Full frontend details |
| `backend/LOCATION_BACKEND_GUIDE.md` | Backend implementation |
| `GPS_LOCATION_SUMMARY.md` | Overview & status |
| `LOCATION_FLOW_DIAGRAM.md` | Visual flow diagrams |
| `QUICK_REFERENCE.md` | This file |

---

## 🧪 **Testing**

### **Frontend:**
```bash
cd frontend
npm run dev
# Visit: http://localhost:5173
# Test: Create Deal → Location section
```

### **Backend:**
```bash
# Test proximity query
curl "http://localhost:5000/api/deals/nearby?lat=6.9271&lng=79.8612&radius=5000"
```

---

## ⚠️ **Common Issues**

### **"Location not working"**
- ✅ Check HTTPS (required for geolocation)
- ✅ Check browser permissions
- ✅ Use manual entry as fallback

### **"No results in mobile app"**
- ✅ Check backend has coordinates saved
- ✅ Check geospatial index exists
- ✅ Check coordinate order (lng, lat)

### **"Wrong distances"**
- ✅ Verify lat/lng not swapped
- ✅ Check radius in meters (not km)
- ✅ Validate coordinates in range

---

## 🎯 **Next Steps**

1. ✅ Frontend complete
2. ⏳ Implement backend (see guide)
3. ⏳ Update mobile app
4. ⏳ Test end-to-end
5. ⏳ Deploy to production

---

## 📞 **Quick Help**

**Q: How do I add LocationPicker to a new form?**
A: Import component, add to form, connect to state. See examples in CreateDealPage.tsx

**Q: What API does it use?**
A: OpenStreetMap Nominatim (free, no key needed)

**Q: Does it work offline?**
A: Manual entry works offline. Search requires internet.

**Q: How accurate is it?**
A: GPS: ~10-50m accuracy. Search: depends on address quality.

---

## ✅ **Status**

| Component | Status |
|-----------|--------|
| Frontend | ✅ Complete |
| Backend | ⏳ Pending |
| Mobile | ⏳ Pending |

---

**🚀 Ready to enable "Near Me" functionality!**

**Next:** Implement backend using `backend/LOCATION_BACKEND_GUIDE.md`
