import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import PartnerApplication from '../models/PartnerApplication.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/partners';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Partner registration endpoint
router.post('/register', upload.array('images', 5), async (req, res) => {
  try {
    const partnerApplication = new PartnerApplication({
      businessName: req.body.businessName,
      contactName: req.body.contactName,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,
      serviceTypes: JSON.parse(req.body.serviceTypes || '[]'),
      fleetSize: req.body.fleetSize,
      yearsInBusiness: req.body.yearsInBusiness,
      description: req.body.description,
      languages: JSON.parse(req.body.languages || '[]'),
      operatingHours: req.body.operatingHours,
      specialties: JSON.parse(req.body.specialties || '[]'),
      priceRange: req.body.priceRange,
      responseTime: req.body.responseTime,
      images: req.files ? req.files.map(file => file.filename) : []
    });

    await partnerApplication.save();

    res.json({
      success: true,
      applicationId: partnerApplication.applicationId,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Partner registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
});

// Get application status
router.get('/status/:applicationId', async (req, res) => {
  try {
    const application = await PartnerApplication.findOne({
      applicationId: req.params.applicationId
    }).select('applicationId status submittedAt adminNotes reviewedAt');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);

  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Admin endpoints
router.get('/admin/applications', async (req, res) => {
  try {
    const applications = await PartnerApplication.find()
      .sort({ submittedAt: -1 })
      .lean();

    res.json(applications);

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/applications/:applicationId', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const application = await PartnerApplication.findOne({
      applicationId: req.params.applicationId
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    application.adminNotes = adminNotes;
    application.reviewedAt = new Date();

    await application.save();

    // If approved, optionally create a TransportProvider record
    // This is a placeholder - you may want to implement this based on your business logic
    if (status === 'approved') {
      // TODO: Create TransportProvider record or send notification
      console.log('Partner application approved:', application.applicationId);
    }

    res.json({ success: true, message: 'Application updated successfully' });

  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;