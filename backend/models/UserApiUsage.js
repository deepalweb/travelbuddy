import mongoose from 'mongoose';

const userApiUsageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true
  },
  exploreRequests: {
    type: Number,
    default: 0
  },
  lastRequest: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient lookups
userApiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

// Auto-delete after 7 days
userApiUsageSchema.index({ lastRequest: 1 }, { expireAfterSeconds: 604800 });

export default mongoose.model('UserApiUsage', userApiUsageSchema);
