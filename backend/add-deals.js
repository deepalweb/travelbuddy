import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dealSchema = new mongoose.Schema({
  title: String,
  description: String,
  discount: String,
  placeName: String,
  businessName: String,
  businessType: String,
  images: [String],
  views: Number,
  claims: Number,
  isPremium: Boolean,
  isActive: Boolean,
  validUntil: Date,
  price: {
    amount: Number,
    currencyCode: String,
  },
  createdAt: Date
});

const Deal = mongoose.model('Deal', dealSchema);

const sampleDeals = [
  {
    title: '50% Off All Pizzas',
    description: 'Get 50% off on all pizzas this weekend! Valid for dine-in and takeaway.',
    discount: '50% OFF',
    placeName: 'Mario\'s Pizza',
    businessName: 'Mario\'s Pizza',
    businessType: 'restaurant',
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800'],
    views: 245,
    claims: 12,
    isPremium: false,
    isActive: true,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    price: { amount: 15.99, currencyCode: 'USD' },
    createdAt: new Date()
  },
  {
    title: 'Buy 1 Get 1 Free Coffee',
    description: 'Buy one coffee, get one free! Available all day.',
    discount: 'Buy 1 Get 1',
    placeName: 'Coffee Corner',
    businessName: 'Coffee Corner',
    businessType: 'cafe',
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'],
    views: 189,
    claims: 8,
    isPremium: false,
    isActive: true,
    validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    price: { amount: 4.50, currencyCode: 'USD' },
    createdAt: new Date()
  },
  {
    title: '20% Off Weekend Stay',
    description: 'Special discount on weekend hotel stays. Book now!',
    discount: '20% OFF',
    placeName: 'Grand Hotel',
    businessName: 'Grand Hotel',
    businessType: 'hotel',
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
    views: 567,
    claims: 23,
    isPremium: true,
    isActive: true,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    price: { amount: 120.00, currencyCode: 'USD' },
    createdAt: new Date()
  },
  {
    title: '30% Off Spa Package',
    description: 'Relax and rejuvenate with our premium spa package at 30% off.',
    discount: '30% OFF',
    placeName: 'Serenity Spa',
    businessName: 'Serenity Spa',
    businessType: 'attraction',
    images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800'],
    views: 312,
    claims: 15,
    isPremium: true,
    isActive: true,
    validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    price: { amount: 85.00, currencyCode: 'USD' },
    createdAt: new Date()
  },
  {
    title: '40% Off Fashion Sale',
    description: 'Huge discount on all fashion items. Limited time offer!',
    discount: '40% OFF',
    placeName: 'Fashion Hub',
    businessName: 'Fashion Hub',
    businessType: 'shop',
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'],
    views: 428,
    claims: 31,
    isPremium: false,
    isActive: true,
    validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    price: { amount: 45.00, currencyCode: 'USD' },
    createdAt: new Date()
  }
];

async function addDeals() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await Deal.deleteMany({});
    console.log('🗑️  Cleared existing deals');

    const result = await Deal.insertMany(sampleDeals);
    console.log(`✅ Added ${result.length} deals to database`);

    result.forEach(deal => {
      console.log(`  - ${deal.title} (${deal.businessType})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addDeals();
