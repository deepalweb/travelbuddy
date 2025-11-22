import mongoose from 'mongoose';

const travelAgentSchema = new mongoose.Schema({
  // Basic Information
  agencyName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: String,
  website: String,
  address: String,
  location: String,
  
  // Professional Details
  licenseNumber: String,
  experienceYears: String,
  about: String,
  priceRange: String,
  
  // Service Details
  operatingRegions: [String],
  specialties: [String],
  languages: [String],
  
  // Media
  profilePhoto: String,
  portfolioImages: [String],
  documents: String,
  
  // Frontend Display Fields
  name: String,
  agency: String,
  photo: String,
  specializations: [String],
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: true },
  experience: Number,
  description: String,
  responseTime: { type: String, default: '< 2 hours' },
  totalTrips: { type: Number, default: 0 },
  trustBadges: [String],
  profileCompletion: { type: Number, default: 85 },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'approved' 
  },
  submittedDate: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

travelAgentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

travelAgentSchema.index({ email: 1 });
travelAgentSchema.index({ status: 1 });
travelAgentSchema.index({ agencyName: 1 });

const TravelAgent = mongoose.model('TravelAgent', travelAgentSchema);

export default TravelAgent;
