import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://techzdr_db_user:ufTD4zMi1g1LaHdR@travelbuddy.xmaur8g.mongodb.net/?retryWrites=true&w=majority&appName=travelbuddy';

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
