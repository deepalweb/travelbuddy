import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Deal Schema
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

// Test the exact route logic
app.get('/test-deals', async (req, res) => {
  try {
    console.log('🔍 Testing deals route logic...');
    
    const { isActive = 'true', limit = '20', businessType } = req.query;
    
    const query = {};
    if (isActive === 'true') {
      query.isActive = true;
      // Include deals without validUntil (no expiration) or future expiration
      query.$or = [
        { validUntil: { $gte: new Date() } },
        { validUntil: { $exists: false } },
        { validUntil: null }
      ];
    }
    
    // Add business type filter if specified
    if (businessType && businessType !== 'all') {
      query.businessType = businessType;
    }
    
    console.log('🔍 Deals query:', JSON.stringify(query, null, 2));
    
    const deals = await Deal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    console.log(`✅ Found ${deals.length} deals matching query`);
    if (deals.length > 0) {
      console.log('📋 Sample deal:', {
        title: deals[0].title,
        businessName: deals[0].businessName,
        isActive: deals[0].isActive,
        validUntil: deals[0].validUntil,
        createdAt: deals[0].createdAt
      });
    }
    
    res.json({
      success: true,
      count: deals.length,
      deals: deals
    });
  } catch (error) {
    console.error('❌ Error in deals route:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

async function startDebugServer() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const port = 3002;
    app.listen(port, () => {
      console.log(`🚀 Debug server running on port ${port}`);
      console.log(`🔍 Test URL: http://localhost:${port}/test-deals`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start debug server:', error);
  }
}

startDebugServer();