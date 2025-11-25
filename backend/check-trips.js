import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://techzdr_db_user:ufTD4zMi1g1LaHdR@travelbuddy.xmaur8g.mongodb.net/?retryWrites=true&w=majority&appName=travelbuddy';

const tripPlanSchema = new mongoose.Schema({}, { strict: false, collection: 'tripplans' });
const TripPlan = mongoose.model('TripPlan', tripPlanSchema);

async function checkTrips() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const count = await TripPlan.countDocuments();
    console.log(`\n📊 Total trip plans in database: ${count}`);
    
    if (count > 0) {
      const trips = await TripPlan.find().select('tripTitle destination userId createdAt').sort({ createdAt: -1 }).limit(10);
      console.log('\n📋 Recent trips:');
      trips.forEach((trip, i) => {
        console.log(`${i + 1}. ${trip.tripTitle} - ${trip.destination} (${new Date(trip.createdAt).toLocaleString()})`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTrips();
