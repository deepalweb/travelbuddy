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

const Deal = mongoose.models.Deal || mongoose.model('Deal', dealSchema);

const testDeals = [
  {
    title: '50% Off Lunch Special',
    description: 'Get 50% off on all lunch items. Valid Monday to Friday.',
    discount: '50%',
    businessName: 'Tasty Bites Restaurant',
    businessType: 'restaurant',
    originalPrice: '2000',
    discountedPrice: '1000',
    location: { address: 'Colombo, Sri Lanka', lat: 6.9271, lng: 79.8612 },
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
    location: { address: 'Galle, Sri Lanka', lat: 6.0535, lng: 80.2210 },
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
    location: { address: 'Kandy, Sri Lanka', lat: 7.2906, lng: 80.6337 },
    images: [],
    views: 67,
    claims: 34,
    isActive: true,
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Adventure Tour Package',
    description: 'Explore Sri Lanka with our guided adventure tour. Includes transport and meals.',
    discount: '25%',
    businessName: 'Adventure Lanka',
    businessType: 'attraction',
    originalPrice: '8000',
    discountedPrice: '6000',
    location: { address: 'Ella, Sri Lanka', lat: 6.8667, lng: 81.0467 },
    images: [],
    views: 120,
    claims: 45,
    isActive: true,
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Airport Transfer Special',
    description: 'Book airport transfer and get 20% off. Available 24/7.',
    discount: '20%',
    businessName: 'Quick Ride Transport',
    businessType: 'transport',
    originalPrice: '5000',
    discountedPrice: '4000',
    location: { address: 'Colombo Airport, Sri Lanka', lat: 7.1807, lng: 79.8842 },
    images: [],
    views: 78,
    claims: 56,
    isActive: true,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  }
];

async function seedDeals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const count = await Deal.countDocuments();
    console.log(`📊 Current deals count: ${count}`);
    
    if (count === 0) {
      const created = await Deal.insertMany(testDeals);
      console.log(`✅ Created ${created.length} test deals`);
    } else {
      console.log('ℹ️ Deals already exist, skipping seed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDeals();
