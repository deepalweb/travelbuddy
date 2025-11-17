const express = require('express');
const router = express.Router();

// Platform detection middleware
router.use((req, res, next) => {
  req.platform = req.headers['x-platform'] || 
    (req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'web');
  next();
});

// Demo authentication endpoint
router.post('/auth/demo-login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple demo login - accept any credentials
  if (email && password) {
    res.json({
      success: true,
      user: {
        id: 'demo-user-123',
        email: email,
        name: 'Demo User'
      },
      token: 'demo-token-' + Date.now()
    });
  } else {
    res.status(400).json({ success: false, error: 'Email and password required' });
  }
});

// Unified places search
router.get('/places/search', async (req, res) => {
  try {
    const { query, lat, lng } = req.query;
    
    // Your existing search logic here
    const places = []; // Replace with actual search
    
    const response = {
      places: places.map(place => ({
        id: place.place_id,
        name: place.name,
        rating: place.rating,
        // Mobile gets smaller images
        photo: req.platform === 'mobile' ? 'small_image_url' : 'large_image_url'
      }))
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unified deals endpoint
router.get('/deals', async (req, res) => {
  try {
    const deals = await Deal.find({ isActive: true });
    
    const response = {
      deals: deals.map(deal => ({
        id: deal._id,
        title: deal.title,
        description: deal.description,
        price: deal.price,
        // Platform-specific optimizations
        ...(req.platform === 'mobile' && { 
          image: deal.images?.[0] // Single image for mobile
        }),
        ...(req.platform === 'web' && { 
          images: deal.images // All images for web
        })
      }))
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;