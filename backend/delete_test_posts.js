import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const postSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  content: Object,
  location: String,
  createdAt: Date
});

const Post = mongoose.model('Post', postSchema, 'posts');

async function deleteTestPosts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all posts from test user
    const result = await Post.deleteMany({ 
      userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
    });

    console.log(`🗑️ Deleted ${result.deletedCount} test posts`);
    
    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteTestPosts();
