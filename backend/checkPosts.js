import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://deepalr:qn7q9Y64AOjrdLbe@cluster0.oybjzf7.mongodb.net/travelbuddy?retryWrites=true&w=majority&appName=Cluster0';

await mongoose.connect(MONGODB_URI);

const Post = mongoose.model('Post', new mongoose.Schema({}, { strict: false }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

const posts = await Post.find().limit(3).lean();
console.log('\n📝 Sample Posts:');
posts.forEach((post, i) => {
  console.log(`\n${i + 1}. Post ID: ${post._id}`);
  console.log(`   userId: ${post.userId}`);
  console.log(`   username: ${post.username || 'NOT SET'}`);
  console.log(`   content: ${post.content?.text?.substring(0, 50)}...`);
});

console.log('\n\n👥 Checking Users:');
const users = await User.find().limit(5).select('_id firebaseUid username fullName email').lean();
users.forEach((user, i) => {
  console.log(`\n${i + 1}. User:`);
  console.log(`   _id: ${user._id}`);
  console.log(`   firebaseUid: ${user.firebaseUid || 'NOT SET'}`);
  console.log(`   username: ${user.username || 'NOT SET'}`);
  console.log(`   fullName: ${user.fullName || 'NOT SET'}`);
  console.log(`   email: ${user.email || 'NOT SET'}`);
});

await mongoose.disconnect();
