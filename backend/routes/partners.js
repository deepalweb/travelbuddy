import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
    const applicationId = 'APP-' + Date.now();
    
    const partnerApplication = {
      applicationId,
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
      images: req.files ? req.files.map(file => file.filename) : [],
      status: 'pending', // pending, approved, rejected
      submittedAt: new Date(),
      adminNotes: ''
    };

    // Save to database (using file for demo)
    const applicationsFile = 'data/partner-applications.json';
    let applications = [];
    
    if (fs.existsSync(applicationsFile)) {
      applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
    }
    
    applications.push(partnerApplication);
    
    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
    }
    
    fs.writeFileSync(applicationsFile, JSON.stringify(applications, null, 2));

    // TODO: Send email confirmation to partner
    // TODO: Send notification to admin

    res.json({
      success: true,
      applicationId,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Partner registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

// Get application status
router.get('/status/:applicationId', (req, res) => {
  try {
    const applicationsFile = 'data/partner-applications.json';
    
    if (!fs.existsSync(applicationsFile)) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    const applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
    const application = applications.find(app => app.applicationId === req.params.applicationId);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({
      applicationId: application.applicationId,
      status: application.status,
      submittedAt: application.submittedAt,
      adminNotes: application.adminNotes
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin endpoints
router.get('/admin/applications', (req, res) => {
  try {
    const applicationsFile = 'data/partner-applications.json';
    
    if (!fs.existsSync(applicationsFile)) {
      return res.json([]);
    }
    
    const applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
    res.json(applications);
    
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/applications/:applicationId', (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const applicationsFile = 'data/partner-applications.json';
    
    if (!fs.existsSync(applicationsFile)) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    let applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
    const appIndex = applications.findIndex(app => app.applicationId === req.params.applicationId);
    
    if (appIndex === -1) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    applications[appIndex].status = status;
    applications[appIndex].adminNotes = adminNotes;
    applications[appIndex].reviewedAt = new Date();
    
    // If approved, add to active providers
    if (status === 'approved') {
      const providersFile = 'data/transport-providers.json';
      let providers = [];
      
      if (fs.existsSync(providersFile)) {
        providers = JSON.parse(fs.readFileSync(providersFile, 'utf8'));
      }
      
      const newProvider = {
        id: applications[appIndex].applicationId,
        name: applications[appIndex].businessName,
        image: applications[appIndex].images[0] ? `/uploads/partners/${applications[appIndex].images[0]}` : '',
        location: applications[appIndex].location,
        serviceTypes: applications[appIndex].serviceTypes,
        languages: applications[appIndex].languages,
        rating: 0,
        reviewCount: 0,
        priceRange: applications[appIndex].priceRange,
        verified: true,
        availability: 'Available',
        description: applications[appIndex].description,
        yearsInService: parseInt(applications[appIndex].yearsInBusiness),
        fleetSize: parseInt(applications[appIndex].fleetSize),
        operatingHours: applications[appIndex].operatingHours,
        specialties: applications[appIndex].specialties,
        contactPhone: applications[appIndex].phone,
        contactEmail: applications[appIndex].email,
        responseTime: applications[appIndex].responseTime
      };
      
      providers.push(newProvider);
      fs.writeFileSync(providersFile, JSON.stringify(providers, null, 2));
    }
    
    fs.writeFileSync(applicationsFile, JSON.stringify(applications, null, 2));
    
    // TODO: Send email notification to partner
    
    res.json({ success: true, message: 'Application updated successfully' });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;