// Migration script to update existing users to new role system
import mongoose from 'mongoose';
import EnhancedUser from '../backend/models/EnhancedUser.js';
import { ROLE_PERMISSIONS } from '../services/permissionsService.js';

async function migrateUsers() {
  try {
    console.log('Starting user migration to 4-role system...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbuddy');
    
    // Get all existing users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users to migrate`);
    
    let migrated = 0;
    
    for (const user of users) {
      const updates = {};
      
      // Set default role based on existing fields
      if (user.isAdmin) {
        updates.role = 'admin';
        updates.permissions = ['*'];
      } else if (user.isMerchant) {
        updates.role = 'merchant';
        updates.permissions = ROLE_PERMISSIONS.merchant;
        
        // Migrate merchant info to businessProfile
        if (user.merchantInfo) {
          updates.businessProfile = {
            businessName: user.merchantInfo.businessName || user.username,
            businessType: user.merchantInfo.businessType || 'restaurant',
            businessAddress: user.merchantInfo.businessAddress || '',
            businessPhone: user.merchantInfo.businessPhone || '',
            businessEmail: user.email,
            businessHours: '9:00 AM - 6:00 PM',
            businessDescription: 'Business description',
            verificationStatus: user.merchantInfo.verificationStatus || 'pending'
          };
        }
      } else {
        updates.role = 'regular';
        updates.permissions = ROLE_PERMISSIONS.regular;
      }
      
      // Set verification status
      updates.isVerified = user.isAdmin || (user.merchantInfo?.verificationStatus === 'approved');
      
      // Update user
      await mongoose.connection.db.collection('users').updateOne(
        { _id: user._id },
        { $set: updates }
      );
      
      migrated++;
      console.log(`Migrated user ${user.username} to role: ${updates.role}`);
    }
    
    console.log(`Migration completed! ${migrated} users migrated.`);
    
    // Create indexes
    await mongoose.connection.db.collection('users').createIndex({ role: 1 });
    await mongoose.connection.db.collection('users').createIndex({ 'businessProfile.verificationStatus': 1 });
    
    console.log('Indexes created successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsers();
}

export { migrateUsers };