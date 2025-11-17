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

// GET /api/deals - Get active deals
router.get('/', async (req, res) => {
  try {
    const { isActive = 'true', limit = '20' } = req.query;
    
    const query = {};
    if (isActive === 'true') {
      query.isActive = true;
      query.validUntil = { $gte: new Date() };
    }
    
    const deals = await Deal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    console.log(`✅ Found ${deals.length} active deals`);
    res.json(deals);
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

export default router;