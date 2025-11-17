import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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

const Deal = mongoose.model('Deal', dealSchema);

const sampleDeals = [
  {
    title: '50% Off Pizza Special',
    description: 'Get 50% off on all pizzas this weekend! Fresh ingredients, authentic Italian taste.',
    discount: '50% OFF',
    placeName: 'Mario\'s Pizzeria',
    businessName: 'Mario\'s Pizzeria',
    businessType: 'restaurant',
    businessAddress: '123 Main Street, Downtown',
    businessPhone: '+1-555-0123',
    price: {
      amount: 15.99,
      currencyCode: 'USD'
    },
    originalPrice: '$31.98',
    discountedPrice: '$15.99',
    location: {
      lat: 40.7128,
      lng: -74.0060,
      address: '123 Main Street, Downtown'
    },
    images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'],
    views: 245,
    claims: 12,
    isPremium: false,
    isActive: true,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    contactInfo: {
      phone: '+1-555-0123',
      email: 'info@mariospizza.com'
    }
  },
  {
    title: 'Buy One Get One Free Coffee',
    description: 'Start your morning right! Buy any coffee and get another one absolutely free.',
    discount: 'BOGO',
    placeName: 'Coffee Corner Cafe',
    businessName: 'Coffee Corner Cafe',
    businessType: 'cafe',
    businessAddress: '456 Coffee Street',
    businessPhone: '+1-555-0456',
    price: {
      amount: 4.50,
      currencyCode: 'USD'
    },
    originalPrice: '$9.00',
    discountedPrice: '$4.50',
    location: {
      lat: 40.7589,
      lng: -73.9851,
      address: '456 Coffee Street'
    },
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
    views: 189,
    claims: 8,
    isPremium: false,
    isActive: true,
    validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    contactInfo: {
      phone: '+1-555-0456',
      email: 'hello@coffeecorner.com'
    }
  },
  {
    title: '20% Off Luxury Hotel Stay',
    description: 'Experience luxury at its finest with 20% off weekend stays. Premium amenities included.',
    discount: '20% OFF',
    placeName: 'Grand Luxury Hotel',
    businessName: 'Grand Luxury Hotel',
    businessType: 'hotel',
    businessAddress: '789 Luxury Avenue',
    businessPhone: '+1-555-0789',
    price: {
      amount: 120.00,
      currencyCode: 'USD'
    },
    originalPrice: '$150.00',
    discountedPrice: '$120.00',
    location: {
      lat: 40.7505,
      lng: -73.9934,
      address: '789 Luxury Avenue'
    },
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'],
    views: 567,
    claims: 23,
    isPremium: true,
    isActive: true,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    contactInfo: {
      phone: '+1-555-0789',
      email: 'reservations@grandluxury.com',
      website: 'https://grandluxuryhotel.com'
    }
  }
];

async function seedDeals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Deal.deleteMany({});
    console.log('🗑️ Cleared existing deals');

    const insertedDeals = await Deal.insertMany(sampleDeals);
    console.log(`✅ Inserted ${insertedDeals.length} sample deals`);

    insertedDeals.forEach((deal, index) => {
      console.log(`${index + 1}. ${deal.title} - ${deal.discount}`);
    });

    console.log('\n🎉 Deals seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding deals:', error);
    process.exit(1);
  }
}

seedDeals();