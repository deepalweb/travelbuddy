import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Deal Schema (matching the one in server.js)
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

// Sample merchant deals
const sampleDeals = [
  {
    title: "20% Off All Pizzas",
    description: "Get 20% off on all our delicious wood-fired pizzas. Valid for dine-in and takeaway.",
    discount: "20% OFF",
    businessName: "Mario's Pizzeria",
    businessType: "restaurant",
    businessAddress: "123 Main Street, Downtown",
    businessPhone: "+1-555-0123",
    originalPrice: "$25",
    discountedPrice: "$20",
    views: 45,
    claims: 12,
    isActive: true,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    location: {
      lat: 40.7128,
      lng: -74.0060,
      address: "123 Main Street, Downtown"
    }
  },
  {
    title: "Buy 1 Get 1 Free Coffee",
    description: "Purchase any coffee and get another one absolutely free. Perfect for sharing with friends!",
    discount: "BOGO",
    businessName: "Central Perk Cafe",
    businessType: "cafe",
    businessAddress: "456 Coffee Lane, Midtown",
    businessPhone: "+1-555-0456",
    originalPrice: "$8",
    discountedPrice: "$4",
    views: 78,
    claims: 23,
    isActive: true,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    location: {
      lat: 40.7589,
      lng: -73.9851,
      address: "456 Coffee Lane, Midtown"
    }
  },
  {
    title: "30% Off Weekend Stay",
    description: "Book your weekend getaway with us and save 30% on all room types. Includes complimentary breakfast.",
    discount: "30% OFF",
    businessName: "Grand Plaza Hotel",
    businessType: "hotel",
    businessAddress: "789 Hotel Boulevard, Uptown",
    businessPhone: "+1-555-0789",
    originalPrice: "$200",
    discountedPrice: "$140",
    views: 156,
    claims: 8,
    isActive: true,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    location: {
      lat: 40.7831,
      lng: -73.9712,
      address: "789 Hotel Boulevard, Uptown"
    }
  },
  {
    title: "50% Off Designer Clothing",
    description: "Huge sale on all designer clothing items. Limited time offer on selected brands.",
    discount: "50% OFF",
    businessName: "Fashion Forward Boutique",
    businessType: "shop",
    businessAddress: "321 Fashion Ave, Shopping District",
    businessPhone: "+1-555-0321",
    originalPrice: "$150",
    discountedPrice: "$75",
    views: 203,
    claims: 34,
    isActive: true,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    location: {
      lat: 40.7505,
      lng: -73.9934,
      address: "321 Fashion Ave, Shopping District"
    }
  },
  {
    title: "Family Fun Package - 25% Off",
    description: "Bring the whole family for a day of fun! 25% off admission tickets for groups of 4 or more.",
    discount: "25% OFF",
    businessName: "Adventure Park",
    businessType: "attraction",
    businessAddress: "555 Fun Street, Entertainment District",
    businessPhone: "+1-555-0555",
    originalPrice: "$120",
    discountedPrice: "$90",
    views: 89,
    claims: 15,
    isActive: true,
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    location: {
      lat: 40.7282,
      lng: -73.7949,
      address: "555 Fun Street, Entertainment District"
    }
  },
  {
    title: "Happy Hour Special",
    description: "Join us for happy hour! 40% off all drinks and appetizers from 4-6 PM daily.",
    discount: "40% OFF",
    businessName: "The Rooftop Bar",
    businessType: "restaurant",
    businessAddress: "888 Sky High Ave, Downtown",
    businessPhone: "+1-555-0888",
    originalPrice: "$35",
    discountedPrice: "$21",
    views: 167,
    claims: 42,
    isActive: true,
    validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    location: {
      lat: 40.7614,
      lng: -73.9776,
      address: "888 Sky High Ave, Downtown"
    }
  }
];

async function seedMerchantDeals() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI || MONGO_URI === 'disabled') {
      console.log('MongoDB not configured, skipping seed');
      return;
    }

    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing deals (optional)
    await Deal.deleteMany({});
    console.log('Cleared existing deals');

    // Insert sample deals
    const insertedDeals = await Deal.insertMany(sampleDeals);
    console.log(`Inserted ${insertedDeals.length} sample merchant deals`);

    console.log('Sample deals:');
    insertedDeals.forEach((deal, index) => {
      console.log(`${index + 1}. ${deal.title} - ${deal.businessName} (${deal.businessType})`);
    });

  } catch (error) {
    console.error('Error seeding merchant deals:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedMerchantDeals();