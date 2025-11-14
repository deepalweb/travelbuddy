import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Add CORS middleware for deals routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Deal Schema (if not already defined in server.js)
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

// Get all active deals
router.get('/', async (req, res) => {
  try {
    const { businessType, isActive, limit = '50', merchantId } = req.query;
    
    // Build query
    const query = {};
    
    if (isActive === 'true') {
      query.isActive = true;
    }
    
    if (businessType && businessType !== 'all') {
      query.businessType = businessType;
    }
    
    if (merchantId) {
      query.merchantId = merchantId;
    }
    
    // Date filtering for active deals
    if (isActive === 'true') {
      const now = new Date();
      query.$and = [
        { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }] }
      ];
    }
    
    const deals = await Deal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit.toString(), 10))
      .lean();
    
    console.log(`✅ Found ${deals.length} deals`);
    res.json(deals);
  } catch (error) {
    console.error('❌ Error fetching deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new deal
router.post('/', async (req, res) => {
  try {
    const deal = new Deal(req.body);
    await deal.save();
    console.log('✅ Created new deal:', deal.title);
    res.json(deal);
  } catch (error) {
    console.error('❌ Error creating deal:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update deal
router.put('/:id', async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    console.log('✅ Updated deal:', deal.title);
    res.json(deal);
  } catch (error) {
    console.error('❌ Error updating deal:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete deal
router.delete('/:id', async (req, res) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    console.log('✅ Deleted deal:', deal.title);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting deal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track deal views
router.post('/:id/view', async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(
      req.params.id, 
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({ success: true, views: deal.views });
  } catch (error) {
    console.error('❌ Error tracking deal view:', error);
    res.status(500).json({ error: error.message });
  }
});

// Claim deal
router.post('/:id/claim', async (req, res) => {
  try {
    const { userId } = req.body;
    const deal = await Deal.findByIdAndUpdate(
      req.params.id, 
      { $inc: { claims: 1 } },
      { new: true }
    );
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    console.log(`✅ Deal claimed: ${deal.title} by user ${userId || 'anonymous'}`);
    res.json({ success: true, claims: deal.claims });
  } catch (error) {
    console.error('❌ Error claiming deal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's claimed deals
router.get('/user/:userId/claimed', async (req, res) => {
  try {
    // In a real implementation, you'd track claimed deals in a separate collection
    // For now, return empty array as placeholder
    res.json([]);
  } catch (error) {
    console.error('❌ Error fetching user deals:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;