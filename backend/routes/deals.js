import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Deal Schema (if not already defined)
const dealSchema = new mongoose.Schema({
  title: String,
  description: String,
  discount: String,
  placeId: String,
  placeName: String,
  price: {
    amount: Number,
    currencyCode: String,
  },
  businessName: String,
  businessType: String,
  businessAddress: String,
  businessPhone: String,
  businessWebsite: String,
  originalPrice: String,
  discountedPrice: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  images: [String],
  views: { type: Number, default: 0 },
  claims: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  validUntil: Date,
  startsAt: { type: Date },
  endsAt: { type: Date },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contactInfo: {
    website: String,
    phone: String,
    whatsapp: String,
    facebook: String,
    instagram: String,
    email: String
  },
  createdAt: { type: Date, default: Date.now }
});

let Deal;
try {
  Deal = mongoose.model('Deal');
} catch {
  Deal = mongoose.model('Deal', dealSchema);
}

// GET /api/deals - Get active deals with AI ranking
router.get('/', async (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    const { isActive = 'true', limit = '20', businessType, lat, lng, lastVisit } = req.query;
    
    const query = {};
    if (isActive === 'true') {
      query.isActive = true;
      query.$or = [
        { validUntil: { $gte: new Date() } },
        { validUntil: { $exists: false } },
        { validUntil: null }
      ];
    }
    
    if (businessType && businessType !== 'all') {
      query.businessType = businessType;
    }
    
    let deals = await Deal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // AI-curate deals
    deals = deals.map(deal => {
      const discount = parseFloat(deal.discount?.replace('%', '') || '0');
      const daysLeft = deal.validUntil ? Math.ceil((new Date(deal.validUntil) - new Date()) / (1000 * 60 * 60 * 24)) : 999;
      const trendScore = deal.views + deal.claims * 2;
      
      let aiRank = 'best-value';
      if (daysLeft <= 3) aiRank = 'limited-time';
      else if (trendScore > 20) aiRank = 'trending';
      else if (discount >= 30) aiRank = 'best-value';
      
      let userCategory = 'budget';
      if (deal.businessType === 'restaurant' || deal.businessType === 'cafe') userCategory = 'foodie';
      else if (deal.businessType === 'attraction') userCategory = 'adventure';
      
      // Calculate distance if coordinates provided
      let distance = null;
      if (lat && lng && deal.location?.lat && deal.location?.lng) {
        const R = 6371;
        const dLat = (deal.location.lat - parseFloat(lat)) * Math.PI / 180;
        const dLng = (deal.location.lng - parseFloat(lng)) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(parseFloat(lat) * Math.PI / 180) * Math.cos(deal.location.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      }
      
      return { ...deal, aiRank, userCategory, distance };
    });
    
    // Track new deals since last visit
    let newDealsCount = 0;
    if (lastVisit) {
      const lastVisitDate = new Date(parseInt(lastVisit));
      newDealsCount = deals.filter(d => new Date(d.createdAt) > lastVisitDate).length;
    }
    
    res.json({ deals, newDealsCount });
  } catch (error) {
    console.error('❌ Error fetching deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/deals/:dealId/claim - Claim a deal
router.post('/:dealId/claim', async (req, res) => {
  try {
    const { dealId } = req.params;
    
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    if (!deal.isActive || deal.validUntil < new Date()) {
      return res.status(400).json({ error: 'Deal is no longer active' });
    }
    
    // Increment claims count
    deal.claims = (deal.claims || 0) + 1;
    await deal.save();
    
    console.log(`✅ Deal claimed: ${deal.title}`);
    res.json({ success: true, message: 'Deal claimed successfully' });
  } catch (error) {
    console.error('❌ Error claiming deal:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:userId/deals - Get user's deals
router.get('/users/:userId/deals', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find deals created by this merchant
    const deals = await Deal.find({ merchantId: userId })
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`✅ Found ${deals.length} deals for user ${userId}`);
    res.json(deals);
  } catch (error) {
    console.error('❌ Error fetching user deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/deals - Create new deal (for merchants)
router.post('/', async (req, res) => {
  try {
    const dealData = {
      ...req.body,
      merchantId: req.headers['x-user-id'] || req.body.merchantId,
      createdAt: new Date()
    };
    
    const deal = new Deal(dealData);
    await deal.save();
    
    console.log(`✅ Deal created: ${deal.title}`);
    res.status(201).json(deal);
  } catch (error) {
    console.error('❌ Error creating deal:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/deals/:dealId - Delete deal
router.delete('/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;
    const userId = req.headers['x-user-id'];
    
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Check ownership
    if (deal.merchantId && deal.merchantId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this deal' });
    }
    
    await Deal.findByIdAndDelete(dealId);
    console.log(`✅ Deal deleted: ${deal.title}`);
    res.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting deal:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;