import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// User Schema (simplified version)
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, index: true, sparse: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'regular', enum: ['regular', 'merchant', 'agent', 'admin'] },
  isAdmin: { type: Boolean, default: false },
  tier: { type: String, default: 'free', enum: ['free', 'basic', 'premium', 'pro'] },
  subscriptionStatus: { type: String, default: 'none', enum: ['none', 'trial', 'active', 'expired', 'canceled'] },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createDemoAdmin() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI || MONGO_URI === 'disabled') {
      console.error('❌ MONGO_URI not configured');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@travelbuddy.com' },
        { username: 'admin' },
        { isAdmin: true }
      ]
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', {
        id: existingAdmin._id,
        username: existingAdmin.username,
        email: existingAdmin.email,
        isAdmin: existingAdmin.isAdmin
      });
      process.exit(0);
    }

    // Create demo admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@travelbuddy.com',
      role: 'admin',
      isAdmin: true,
      tier: 'pro',
      subscriptionStatus: 'active'
    });

    await adminUser.save();
    
    console.log('✅ Demo admin user created successfully!');
    console.log('📧 Email: admin@travelbuddy.com');
    console.log('👤 Username: admin');
    console.log('🔑 User ID:', adminUser._id);
    console.log('🛡️ Admin Status: true');
    
    console.log('\n🔐 To access admin panel:');
    console.log('1. Login with Firebase Auth using admin@travelbuddy.com');
    console.log('2. Or use the user ID in your frontend auth system');
    console.log('3. Navigate to /admin in your application');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

createDemoAdmin();