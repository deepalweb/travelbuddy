import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbuddy';

async function checkMissingUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Post = mongoose.model('Post');
    const User = mongoose.model('User');

    const posts = await Post.find().limit(10).lean();
    
    console.log('\n🔍 Checking userId references:\n');
    
    for (const post of posts) {
      if (post.userId) {
        const user = await User.findById(post.userId).lean();
        console.log(`Post ${post._id}:`);
        console.log(`  userId: ${post.userId}`);
        console.log(`  User found: ${user ? 'YES' : 'NO'}`);
        if (user) {
          console.log(`  Username: ${user.username || 'N/A'}`);
        }
        console.log('');
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMissingUsers();
