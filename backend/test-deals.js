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
    address: String
  },
  images: [String],
  views: { type: Number, default: 0 },
  claims: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  validUntil: Date,
  createdAt: { type: Date, default: Date.now }
});

async function testDeals() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const Deal = mongoose.model('Deal', dealSchema);
    
    // Check existing deals
    const totalDeals = await Deal.countDocuments();
    console.log(`📊 Total deals in database: ${totalDeals}`);
    
    const activeDeals = await Deal.countDocuments({ isActive: true });
    console.log(`📊 Active deals: ${activeDeals}`);
    
    // Get recent deals
    const recentDeals = await Deal.find().sort({ createdAt: -1 }).limit(5);
    console.log('📋 Recent deals:');
    recentDeals.forEach(deal => {
      console.log(`  - ${deal.title} (${deal.businessName}) - Active: ${deal.isActive} - Created: ${deal.createdAt}`);
    });
    
    // If no deals exist, create some test deals
    if (totalDeals === 0) {
      console.log('🆕 No deals found, creating test deals...');
      
      const testDeals = [
        {
          title: '30% Off All Main Courses',
          description: 'Enjoy a delicious meal with 30% off all main courses. Valid for dine-in only.',
          discount: '30% OFF',
          businessName: 'The Garden Restaurant',
          businessType: 'restaurant',
          originalPrice: '25.00',
          discountedPrice: '17.50',
          location: {
            address: '123 Main Street, Downtown'
          },
          images: ['https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=300&fit=crop'],
          views: 15,
          claims: 3,
          isActive: true,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        {
          title: 'Buy 2 Get 1 Free Coffee',
          description: 'Perfect morning deal! Buy any 2 coffees and get the third one absolutely free.',
          discount: 'Buy 2 Get 1 Free',
          businessName: 'Coffee Corner Cafe',
          businessType: 'cafe',
          originalPrice: '15.00',
          discountedPrice: '10.00',
          location: {
            address: '456 Coffee Street, City Center'
          },
          images: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop'],
          views: 28,
          claims: 8,
          isActive: true,
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
        },
        {
          title: '50% Off Weekend Stay',
          description: 'Luxury hotel weekend package with 50% discount. Includes breakfast and spa access.',
          discount: '50% OFF',
          businessName: 'Grand Plaza Hotel',
          businessType: 'hotel',
          originalPrice: '200.00',
          discountedPrice: '100.00',
          location: {
            address: '789 Hotel Avenue, Tourist District'
          },
          images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'],
          views: 42,
          claims: 12,
          isActive: true,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      ];
      
      const createdDeals = await Deal.insertMany(testDeals);
      console.log(`✅ Created ${createdDeals.length} test deals`);
      
      // Show the created deals
      createdDeals.forEach(deal => {
        console.log(`  ✨ ${deal.title} - ${deal.businessName} - $${deal.discountedPrice}`);
      });
    }
    
    // Test the query that the API uses
    console.log('\n🔍 Testing API query...');
    const query = {
      isActive: true,
      $or: [
        { validUntil: { $gte: new Date() } },
        { validUntil: { $exists: false } },
        { validUntil: null }
      ]
    };
    
    const apiResults = await Deal.find(query).sort({ createdAt: -1 }).limit(20).lean();
    console.log(`📊 API query would return ${apiResults.length} deals`);
    
    if (apiResults.length > 0) {
      console.log('📋 Sample API result:');
      const sample = apiResults[0];
      console.log(`  - Title: ${sample.title}`);
      console.log(`  - Business: ${sample.businessName}`);
      console.log(`  - Active: ${sample.isActive}`);
      console.log(`  - Valid Until: ${sample.validUntil}`);
      console.log(`  - Created: ${sample.createdAt}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testDeals();