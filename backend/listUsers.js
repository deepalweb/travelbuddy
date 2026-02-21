import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://deepalr:qn7q9Y64AOjrdLbe@cluster0.oybjzf7.mongodb.net/travelbuddy?retryWrites=true&w=majority&appName=Cluster0';

await mongoose.connect(MONGODB_URI);

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const users = await User.find().limit(10).select('email firebaseUid fullName');

console.log(`\n📋 Found ${users.length} users:\n`);
users.forEach((user, i) => {
  console.log(`${i + 1}. Email: ${user.email || 'N/A'}`);
  console.log(`   UID: ${user.firebaseUid || 'N/A'}`);
  console.log(`   Name: ${user.fullName || 'N/A'}\n`);
});

await mongoose.disconnect();
