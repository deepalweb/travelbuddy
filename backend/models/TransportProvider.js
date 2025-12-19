import mongoose from 'mongoose';

const transportProviderSchema = new mongoose.Schema({
  // Company Information
  companyLogo: String,
  companyName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  description: String,
  
  // GPS Location
  location: {
    address: String,
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number]
    },
    city: String,
    country: String
  },
  
  // Verification & Legal Info
  businessRegNumber: String,
  licenseNumber: { type: String, required: true },
  businessRegDoc: String, // File path or URL
  insuranceCert: String, // File path or URL
  verificationPhotos: [String], // Array of file paths/URLs
  
  // Fleet & Service Details
  fleetSize: { type: String, required: true },
  vehicleTypes: { type: [String], required: true },
  vehiclePhotos: [String], // Array of file paths/URLs
  amenities: [String],
  
  // Service Area Coverage
  country: { type: String, default: 'Sri Lanka' },
  serviceAreas: [String],
  islandWide: { type: Boolean, default: false },
  airportTransfers: { type: Boolean, default: false },
  airportPricing: String,
  
  // Pricing & Availability
  pricingModel: String,
  basePrice: String,
  minBookingHours: String,
  
  // Availability Schedule
  availability: {
    monday: { available: Boolean, hours: String },
    tuesday: { available: Boolean, hours: String },
    wednesday: { available: Boolean, hours: String },
    thursday: { available: Boolean, hours: String },
    friday: { available: Boolean, hours: String },
    saturday: { available: Boolean, hours: String },
    sunday: { available: Boolean, hours: String }
  },
  
  // Driver Information
  driverCount: String,
  driverCertifications: [String],
  driverIds: [String], // Array of file paths/URLs
  
  // Documents
  documents: [String], // Array of file paths/URLs
  
  // Account & Security
  password: String, // Should be hashed in production
  
  // Status & Verification
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  isActive: { type: Boolean, default: false },
  adminNotes: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  processedAt: Date,
  
  // Timestamps
  registrationDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
transportProviderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
transportProviderSchema.index({ email: 1 });
transportProviderSchema.index({ verificationStatus: 1 });
transportProviderSchema.index({ isActive: 1 });
transportProviderSchema.index({ country: 1, serviceAreas: 1 });
transportProviderSchema.index({ 'location.coordinates': '2dsphere' });

const TransportProvider = mongoose.model('TransportProvider', transportProviderSchema);

export default TransportProvider;