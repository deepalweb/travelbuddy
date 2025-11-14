import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dealSchema = new mongoose.Schema({
  title: String,
  businessName: String,
  createdAt: { type: Date, default: Date.now }
});

const Deal = mongoose.model('Deal', dealSchema);

async function deleteDeals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const dealIds = [
      '69120152b65f2952c63cd02e',
      '690dcf98651138ac082f1899'
    ];

    for (const id of dealIds) {
      const result = await Deal.findByIdAndDelete(id);
      if (result) {
        console.log(`✅ Deleted: "${result.title}" by ${result.businessName}`);
      } else {
        console.log(`❌ Deal not found: ${id}`);
      }
    }

    await mongoose.disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deleteDeals();