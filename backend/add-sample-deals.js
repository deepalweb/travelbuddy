import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dealSchema = new mongoose.Schema({
  title: String,
  businessName: String,
  businessType: String,
  discount: String,
  originalPrice: String,
  discountedPrice: String,
  validUntil: Date,
  isActive: Boolean,
  images: [String],
  createdAt: { type: Date, default: Date.now }
});

const Deal = mongoose.model('Deal', dealSchema);

async function addSampleDeals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const sampleDeals = [
      {
        title: 'Special Dinner Menu',
        businessName: 'Golden Gate Restaurant',
        businessType: 'restaurant',
        discount: '25% OFF',
        originalPrice: '80',
        discountedPrice: '60',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop']
      },
      {
        title: 'Weekend Hotel Stay',
        businessName: 'Bay View Hotel',
        businessType: 'hotel',
        discount: '30% OFF',
        originalPrice: '200',
        discountedPrice: '140',
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        isActive: true,
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop']
      },
      {
        title: 'Coffee & Pastry Deal',
        businessName: 'Morning Brew Cafe',
        businessType: 'cafe',
        discount: '20% OFF',
        originalPrice: '15',
        discountedPrice: '12',
        validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        isActive: true,
        images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop']
      },
      {
        title: 'City Tour Package',
        businessName: 'SF Tours',
        businessType: 'attraction',
        discount: '15% OFF',
        originalPrice: '120',
        discountedPrice: '102',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isActive: true,
        images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop']
      }
    ];

    await Deal.deleteMany({}); // Clear existing deals
    await Deal.insertMany(sampleDeals);
    
    console.log(`✅ Added ${sampleDeals.length} sample deals`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addSampleDeals();