import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dealSchema = new mongoose.Schema({
  title: String,
  description: String,
  discount: String,
  businessName: String,
  businessType: String,
  originalPrice: String,
  discountedPrice: String,
  location: {
    address: String,
    lat: Number,
    lng: Number
  },
  images: [String],
  views: { type: Number, default: 0 },
  claims: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  validUntil: Date,
  createdAt: { type: Date, default: Date.now }
});

const Deal = mongoose.model('Deal', dealSchema);

const testDeals = [
  {
    title: '50% Off Lunch Special',
    description: 'Get 50% off on all lunch items. Valid Monday to Friday.',
    discount: '50%',
    businessName: 'Tasty Bites Restaurant',
    businessType: 'restaurant',
    originalPrice: '2000',
    discountedPrice: '1000',
    location: {
      address: 'Colombo, Sri Lanka',
      lat: 6.9271,
      lng: 79.8612
    },
    images: [],
    views: 45,
    claims: 12,
    isActive: true,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Weekend Hotel Deal - 30% Off',
    description: 'Book your weekend stay and save 30% on room rates.',
    discount: '30%',
    businessName: 'Ocean View Hotel',
    businessType: 'hotel',
    originalPrice: '15000',
    discountedPrice: '10500',
    location: {
      address: 'Galle, Sri Lanka',
      lat: 6.0535,
      lng: 80.2210
    },
    images: [],
    views: 89,
    claims: 23,
    isActive: true,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Coffee & Pastry Combo',
    description: 'Buy any coffee and get a free pastry!',
    discount: '40%',
    businessName: 'Morning Brew Cafe',
    businessType: 'cafe',
    originalPrice: '800',
    discountedPrice: '480',
    location: {
      address: 'Kandy, Sri Lanka',
      lat: 7.2906,
      lng: 80.6337
    },
    images: [],
    views: 67,
    claims: 34,
    isActive: true,
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
  }
];

async function addTestDeals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    await Deal.deleteMany({});
    console.log('🗑️ Cleared existing deals');
    
    const created = await Deal.insertMany(testDeals);
    console.log(`✅ Created ${created.length} test deals`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestDeals();
