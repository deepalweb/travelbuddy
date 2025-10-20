import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Get directions using Google Directions API
router.post('/directions', async (req, res) => {
  try {
    const { origin, destination, mode = 'walking', waypoints } = req.body;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        status: 'ERROR',
        error_message: 'Google Maps API key not configured' 
      });
    }
    
    if (!origin || !destination) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        error_message: 'Origin and destination are required' 
      });
    }
    
    console.log(`🗺️ Directions request: ${origin} → ${destination} (${mode})`);
    
    // Build Google Directions API URL
    const params = new URLSearchParams({
      origin: origin,
      destination: destination,
      mode: mode,
      key: apiKey
    });
    
    if (waypoints) {
      params.append('waypoints', waypoints);
    }
    
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
    
    // Call Google Directions API
    const response = await fetch(directionsUrl);
    const data = await response.json();
    
    console.log(`📍 Google Directions response: ${data.status}`);
    
    if (data.status === 'OK') {
      // Return the full Google response
      res.json(data);
    } else {
      res.status(400).json({
        status: data.status,
        error_message: data.error_message || 'Directions request failed'
      });
    }
    
  } catch (error) {
    console.error('❌ Directions API error:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error_message: 'Internal server error' 
    });
  }
});

// Get route optimization suggestions
router.post('/optimize', async (req, res) => {
  try {
    const { origin, destinations, mode = 'walking' } = req.body;
    
    if (!origin || !destinations || !Array.isArray(destinations)) {
      return res.status(400).json({ 
        status: 'INVALID_REQUEST',
        error_message: 'Origin and destinations array are required' 
      });
    }
    
    console.log(`🔄 Route optimization: ${destinations.length} destinations`);
    
    // Simple nearest-neighbor optimization
    const optimizedOrder = [];
    const remaining = [...destinations];
    let currentLocation = origin;
    
    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      
      for (let i = 0; i < remaining.length; i++) {
        const distance = calculateDistance(currentLocation, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      const nearest = remaining.splice(nearestIndex, 1)[0];
      optimizedOrder.push(nearest);
      currentLocation = nearest;
    }
    
    res.json({
      status: 'OK',
      optimized_order: optimizedOrder,
      original_count: destinations.length,
      optimization_method: 'nearest_neighbor'
    });
    
  } catch (error) {
    console.error('❌ Route optimization error:', error);
    res.status(500).json({ 
      status: 'ERROR',
      error_message: 'Route optimization failed' 
    });
  }
});

// Calculate distance between two points (Haversine formula)
function calculateDistance(point1, point2) {
  const lat1 = parseFloat(point1.split(',')[0]);
  const lng1 = parseFloat(point1.split(',')[1]);
  const lat2 = parseFloat(point2.split(',')[0]);
  const lng2 = parseFloat(point2.split(',')[1]);
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Return distance in meters
}

export default router;