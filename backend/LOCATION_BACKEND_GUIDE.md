# 🗄️ Backend Location Implementation Guide

## 1️⃣ Update MongoDB Schemas

### **Deal Schema** (`models/Deal.js`)
```javascript
const dealSchema = new mongoose.Schema({
  // ... existing fields
  location: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    city: String,
    country: String
  }
}, { timestamps: true })

// Add geospatial index for proximity queries
dealSchema.index({ 'location.coordinates': '2dsphere' })
```

### **TravelAgent Schema** (`models/TravelAgent.js`)
```javascript
const travelAgentSchema = new mongoose.Schema({
  // ... existing fields
  location: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    city: String,
    country: String
  }
}, { timestamps: true })

travelAgentSchema.index({ 'location.coordinates': '2dsphere' })
```

### **TransportProvider Schema** (`models/TransportProvider.js`)
```javascript
const transportProviderSchema = new mongoose.Schema({
  // ... existing fields
  location: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [lng, lat]
    },
    city: String,
    country: String
  }
}, { timestamps: true })

transportProviderSchema.index({ 'location.coordinates': '2dsphere' })
```

---

## 2️⃣ Update Registration Endpoints

### **Transform Frontend Data to MongoDB Format**

```javascript
// routes/deals.js
router.post('/deals', async (req, res) => {
  try {
    const { location, ...otherData } = req.body
    
    // Transform: { lat, lng } → { coordinates: [lng, lat] }
    const dealData = {
      ...otherData,
      location: {
        address: location.address,
        coordinates: {
          type: 'Point',
          coordinates: [location.coordinates.lng, location.coordinates.lat] // MongoDB uses [lng, lat]
        },
        city: location.city,
        country: location.country
      }
    }
    
    const deal = await Deal.create(dealData)
    res.status(201).json(deal)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})
```

---

## 3️⃣ Create Proximity Search Endpoints

### **Deals Nearby** (`routes/deals.js`)
```javascript
// GET /api/deals/nearby?lat=6.9271&lng=79.8612&radius=5000
router.get('/deals/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, limit = 50 } = req.query
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' })
    }
    
    const deals = await Deal.find({
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)] // [lng, lat]
          },
          $maxDistance: parseInt(radius) // meters
        }
      }
    })
    .limit(parseInt(limit))
    .select('title businessName location discount images validUntil')
    
    // Add distance to each result
    const dealsWithDistance = deals.map(deal => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        deal.location.coordinates.coordinates[1],
        deal.location.coordinates.coordinates[0]
      )
      return {
        ...deal.toObject(),
        distance: Math.round(distance) // meters
      }
    })
    
    res.json(dealsWithDistance)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c // Distance in meters
}
```

### **Travel Agents Nearby** (`routes/travel-agents.js`)
```javascript
// GET /api/travel-agents/nearby?lat=6.9271&lng=79.8612&radius=10000
router.get('/travel-agents/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, specialization } = req.query
    
    const query = {
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    }
    
    // Filter by specialization if provided
    if (specialization) {
      query.specializations = specialization
    }
    
    const agents = await TravelAgent.find(query)
      .limit(50)
      .select('fullName agencyName location specializations dayRate languages')
    
    res.json(agents)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

### **Transport Providers Nearby** (`routes/transport-providers.js`)
```javascript
// GET /api/transport-providers/nearby?lat=6.9271&lng=79.8612&radius=15000&vehicleType=Car
router.get('/transport-providers/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 15000, vehicleType } = req.query
    
    const query = {
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    }
    
    // Filter by vehicle type if provided
    if (vehicleType) {
      query.vehicleTypes = vehicleType
    }
    
    const providers = await TransportProvider.find(query)
      .limit(50)
      .select('companyName location vehicleTypes fleetSize phone availability247')
    
    res.json(providers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

---

## 4️⃣ Update Existing Data (Migration)

### **One-time Migration Script** (`scripts/add-coordinates.js`)
```javascript
const mongoose = require('mongoose')
const Deal = require('../models/Deal')

async function migrateDeals() {
  const deals = await Deal.find({ 'location.coordinates': { $exists: false } })
  
  console.log(`Migrating ${deals.length} deals...`)
  
  for (const deal of deals) {
    // Set default coordinates (0,0) or use geocoding API
    deal.location = {
      address: deal.location?.address || 'Unknown',
      coordinates: {
        type: 'Point',
        coordinates: [0, 0] // [lng, lat] - Update manually or use geocoding
      }
    }
    await deal.save()
  }
  
  console.log('Migration complete!')
}

// Run: node scripts/add-coordinates.js
migrateDeals().then(() => process.exit())
```

---

## 5️⃣ API Response Format

### **Frontend Expects:**
```json
{
  "location": {
    "address": "123 Main St, Colombo, Sri Lanka",
    "coordinates": {
      "lat": 6.9271,
      "lng": 79.8612
    },
    "city": "Colombo",
    "country": "Sri Lanka"
  }
}
```

### **MongoDB Stores:**
```json
{
  "location": {
    "address": "123 Main St, Colombo, Sri Lanka",
    "coordinates": {
      "type": "Point",
      "coordinates": [79.8612, 6.9271]
    },
    "city": "Colombo",
    "country": "Sri Lanka"
  }
}
```

### **Transform on Response:**
```javascript
// Transform MongoDB format to frontend format
router.get('/deals/:id', async (req, res) => {
  const deal = await Deal.findById(req.params.id)
  
  const response = {
    ...deal.toObject(),
    location: {
      address: deal.location.address,
      coordinates: {
        lat: deal.location.coordinates.coordinates[1],
        lng: deal.location.coordinates.coordinates[0]
      },
      city: deal.location.city,
      country: deal.location.country
    }
  }
  
  res.json(response)
})
```

---

## 6️⃣ Testing

### **Test Proximity Query**
```bash
# Find deals within 5km of Colombo
curl "http://localhost:5000/api/deals/nearby?lat=6.9271&lng=79.8612&radius=5000"

# Find travel agents within 10km specializing in Adventure
curl "http://localhost:5000/api/travel-agents/nearby?lat=6.9271&lng=79.8612&radius=10000&specialization=Adventure"

# Find transport providers with Cars within 15km
curl "http://localhost:5000/api/transport-providers/nearby?lat=6.9271&lng=79.8612&radius=15000&vehicleType=Car"
```

---

## 7️⃣ Important Notes

⚠️ **Coordinate Order:**
- **Frontend/GPS:** `{ lat, lng }` or `(latitude, longitude)`
- **MongoDB GeoJSON:** `[longitude, latitude]` - **REVERSED!**
- **Always transform** when saving/retrieving

✅ **Index Required:**
- Must create `2dsphere` index for `$near` queries
- Run: `db.deals.createIndex({ "location.coordinates": "2dsphere" })`

🔒 **Validation:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Validate before saving to database

📏 **Distance Units:**
- MongoDB uses **meters** by default
- 1 km = 1000 meters
- 5 km = 5000 meters

---

## ✅ Implementation Checklist

- [ ] Update Deal schema with location.coordinates
- [ ] Update TravelAgent schema with location.coordinates
- [ ] Update TransportProvider schema with location.coordinates
- [ ] Add 2dsphere indexes to all schemas
- [ ] Update POST endpoints to transform coordinates
- [ ] Create /nearby endpoints for all resources
- [ ] Add distance calculation helper function
- [ ] Transform responses to frontend format
- [ ] Test proximity queries
- [ ] Migrate existing data (if any)

---

**Ready to implement!** Follow this guide step-by-step for full location functionality.
