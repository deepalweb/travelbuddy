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
  createdAt: { type: Date, default: Date.now }
});

const Deal = mongoose.model('Deal', dealSchema);

const sampleDeals = [
  {
    title: '50% OFF Local Restaurant',
    description: 'Enjoy authentic Sri Lankan cuisine with a 50% discount on all main courses. Valid for lunch and dinner.',
    discount: '50% OFF',
    businessName: 'Spice Garden Restaurant',
    businessType: 'restaurant',
    businessAddress: 'No. 123, Galle Road, Colombo 03',
    businessPhone: '+94-11-234-5678',
    businessWebsite: 'https://spicegarden.lk',
    originalPrice: '$25',
    discountedPrice: '$12.50',
    location: {
      lat: 6.9271,
      lng: 79.8612,
      address: 'Colombo, Sri Lanka'
    },
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'
    ],
    price: {
      amount: 12.50,
      currencyCode: 'USD'
    },
    views: 150,
    claims: 12,
    isPremium: false,
    isActive: true,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Free Dessert with Meal',
    description: 'Get a complimentary dessert with any main course order. Choose from our selection of traditional sweets.',
    discount: 'FREE',
    businessName: 'Cafe Mocha',
    businessType: 'cafe',
    businessAddress: 'No. 45, Duplication Road, Colombo 04',
    businessPhone: '+94-11-345-6789',
    businessWebsite: 'https://cafemocha.lk',
    originalPrice: '$8',
    discountedPrice: 'FREE',
    location: {
      lat: 6.8905,
      lng: 79.9037,
      address: 'Sri Jayawardenepura Kotte, Sri Lanka'
    },
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400'
    ],
    price: {
      amount: 0,
      currencyCode: 'USD'
    },
    views: 89,
    claims: 23,
    isPremium: false,
    isActive: true,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  },
  {
    title: '30% OFF Spa Treatment',
    description: 'Relax and rejuvenate with our premium spa treatments. 30% off all massage and wellness packages.',
    discount: '30% OFF',
    businessName: 'Serenity Wellness Center',
    businessType: 'spa',
    businessAddress: 'No. 78, Baseline Road, Colombo 09',
    businessPhone: '+94-11-456-7890',
    businessWebsite: 'https://serenitywellness.lk',
    originalPrice: '$60',
    discountedPrice: '$42',
    location: {
      lat: 6.8481,
      lng: 79.9267,
      address: 'Maharagama, Sri Lanka'
    },
    images: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    ],
    price: {
      amount: 42,
      currencyCode: 'USD'
    },
    views: 234,
    claims: 8,
    isPremium: true,
    isActive: true,
    validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
  },
  {
    title: '25% OFF Hotel Stay',
    description: 'Book your stay with us and enjoy 25% off on all room types. Includes complimentary breakfast.',
    discount: '25% OFF',
    businessName: 'Grand Palace Hotel',
    businessType: 'hotel',
    businessAddress: 'No. 200, Marine Drive, Colombo 03',
    businessPhone: '+94-11-567-8901',
    businessWebsite: 'https://grandpalace.lk',
    originalPrice: '$120',
    discountedPrice: '$90',
    location: {
      lat: 6.9319,
      lng: 79.8478,
      address: 'Colombo, Sri Lanka'
    },
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400'
    ],
    price: {
      amount: 90,
      currencyCode: 'USD'
    },
    views: 456,
    claims: 34,
    isPremium: true,
    isActive: true,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'Buy 1 Get 1 Coffee',
    description: 'Purchase any coffee and get another one absolutely free. Perfect for sharing with friends.',
    discount: 'BOGO',
    businessName: 'Bean There Coffee',
    businessType: 'cafe',
    businessAddress: 'No. 67, Ward Place, Colombo 07',
    businessPhone: '+94-11-678-9012',
    businessWebsite: 'https://beanthere.lk',
    originalPrice: '$6',
    discountedPrice: '$3',
    location: {
      lat: 6.9147,
      lng: 79.8757,
      address: 'Colombo, Sri Lanka'
    },
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'
    ],
    price: {
      amount: 3,
      currencyCode: 'USD'
    },
    views: 178,
    claims: 67,
    isPremium: false,
    isActive: true,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    startsAt: new Date(),
    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
];

async function seedDeals() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error('❌ MONGO_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing deals
    await Deal.deleteMany({});
    console.log('🗑️ Cleared existing deals');

    // Insert sample deals
    const insertedDeals = await Deal.insertMany(sampleDeals);
    console.log(`✅ Inserted ${insertedDeals.length} sample deals`);

    // Display summary
    console.log('\n📊 Deals Summary:');
    insertedDeals.forEach((deal, index) => {
      console.log(`${index + 1}. ${deal.title} - ${deal.discount} (${deal.businessName})`);
    });

    console.log('\n🎉 Deals seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding deals:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDeals();