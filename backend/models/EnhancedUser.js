import mongoose from 'mongoose';

const businessProfileSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  businessType: { 
    type: String, 
    enum: ['hotel', 'restaurant', 'cafe', 'shop', 'attraction'],
    required: true 
  },
  businessAddress: { type: String, required: true },
  businessPhone: { type: String, required: true },
  businessEmail: { type: String, required: true },
  businessHours: { type: String, required: true },
  businessDescription: { type: String, required: true },
  businessLogo: { type: String },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  subscriptionTier: { 
    type: String, 
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic'
  },
  commissionRate: { type: Number, default: 0.15 }
});

const serviceProfileSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  serviceType: { 
    type: String, 
    enum: ['guide', 'driver', 'tour_operator', 'transport'],
    required: true 
  },
  serviceDescription: { type: String, required: true },
  serviceArea: { type: String, required: true },
  languages: [{ type: String }],
  pricing: {
    hourlyRate: { type: Number },
    dailyRate: { type: Number },
    fixedPrice: { type: Number },
    currency: { type: String, default: 'USD' }
  },
  availability: {
    days: [{ type: String }],
    hours: { type: String }
  },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rating: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firebaseUid: { type: String, unique: true, sparse: true },
  
  role: { 
    type: String, 
    enum: ['regular', 'merchant', 'agent', 'admin'],
    default: 'regular'
  },
  permissions: [{ type: String }],
  
  subscriptionTier: { 
    type: String, 
    enum: ['free', 'basic', 'premium', 'pro'],
    default: 'free'
  },
  subscriptionStatus: { 
    type: String, 
    enum: ['none', 'trial', 'active', 'expired', 'canceled'],
    default: 'none'
  },
  
  businessProfile: businessProfileSchema,
  serviceProfile: serviceProfileSchema,
  
  adminLevel: { 
    type: String, 
    enum: ['moderator', 'admin', 'super_admin'],
    default: 'admin'
  },
  
  profilePicture: { type: String },
  isVerified: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now }
}, {
  timestamps: true
});

userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.permissions.includes(permission);
};

export default mongoose.model('EnhancedUser', userSchema);