import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: {
    city: { type: String, required: true },
    country: { type: String, required: true },
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  date: { type: Date, required: true },
  endDate: Date,
  time: { type: String, required: true },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  image: String,
  images: [String],
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizerName: String,
  capacity: Number,
  attendees: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  isTrending: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'published' },
  tags: [String],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

eventSchema.index({ date: 1, category: 1, 'location.city': 1 });

export default mongoose.model('Event', eventSchema);
