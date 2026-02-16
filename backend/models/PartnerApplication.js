import mongoose from 'mongoose';

const partnerApplicationSchema = new mongoose.Schema({
    applicationId: {
        type: String,
        required: true,
        unique: true,
        default: () => `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },

    // Business Information
    businessName: { type: String, required: true },
    contactName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    location: { type: String, required: true },

    // Service Details
    serviceTypes: [String],
    fleetSize: String,
    yearsInBusiness: String,
    description: String,
    languages: [String],
    operatingHours: String,
    specialties: [String],
    priceRange: String,
    responseTime: String,

    // Uploaded Images
    images: [String],

    // Application Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    // Timestamps
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date,

    // Admin Review
    adminNotes: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

// Indexes for efficient queries
partnerApplicationSchema.index({ applicationId: 1 });
partnerApplicationSchema.index({ email: 1 });
partnerApplicationSchema.index({ status: 1 });
partnerApplicationSchema.index({ submittedAt: -1 });

const PartnerApplication = mongoose.model('PartnerApplication', partnerApplicationSchema);

export default PartnerApplication;
