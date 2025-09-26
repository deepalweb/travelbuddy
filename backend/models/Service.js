import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  duration: String,
  location: String,
  status: { type: String, enum: ['active', 'paused'], default: 'active' },
  bookings: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

serviceSchema.index({ userId: 1, status: 1 });

export default mongoose.model('Service', serviceSchema);