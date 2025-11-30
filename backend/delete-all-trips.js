import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbuddy';

const tripPlanSchema = new mongoose.Schema({}, { strict: false, collection: 'tripplans' });
const TripPlan = mongoose.model('TripPlan', tripPlanSchema);

async function deleteAllTrips() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const result = await TripPlan.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} trip plans`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteAllTrips();
