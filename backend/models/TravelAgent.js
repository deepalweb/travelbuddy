import mongoose from 'mongoose';

const travelAgentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  languages: [{
    type: String,
    required: true
  }],
  experience: {
    type: String,
    required: true
  },
  specializations: [{
    type: String,
    required: true
  }],
  agencyName: {
    type: String,
    default: ''
  },
  agencyType: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    default: ''
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  dayRate: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  documents: [{
    type: String
  }],
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 5.0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  totalTrips: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: String,
    default: '< 24 hours'
  },
  verified: {
    type: Boolean,
    default: true
  },
  trustBadges: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    default: ''
  }
});

const TravelAgent = mongoose.model('TravelAgent', travelAgentSchema);

export default TravelAgent;
