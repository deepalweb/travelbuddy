import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/rbac.js';
import TravelAgent from '../models/TravelAgent.js';

const router = express.Router();

// CORS headers for all routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Handle preflight requests
router.options('*', (req, res) => {
  res.sendStatus(200);
});

// MongoDB storage - no in-memory array needed

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Travel agents API is working', timestamp: new Date().toISOString() });
});

// Travel agent registration (no auth required)
router.post('/register', async (req, res) => {
  try {
    console.log('Travel agent registration request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);

    const {
      agencyName,
      ownerName,
      email,
      phone,
      whatsapp,
      website,
      address,
      location,
      licenseNumber,
      experienceYears,
      about,
      priceRange,
      operatingRegions,
      specialties,
      languages,
      profilePhoto,
      portfolioImages,
      documents
    } = req.body;

    // Basic validation
    if (!agencyName || !ownerName || !email || !phone) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['agencyName', 'ownerName', 'email', 'phone'],
        received: { agencyName: !!agencyName, ownerName: !!ownerName, email: !!email, phone: !!phone }
      });
    }

    console.log('Validation passed, creating agent profile');

    const agentProfile = new TravelAgent({
      agencyName,
      ownerName,
      email,
      phone,
      whatsapp,
      website,
      address,
      location: address,
      licenseNumber,
      experienceYears,
      about,
      priceRange,
      operatingRegions: Array.isArray(operatingRegions) ? operatingRegions : [],
      specialties: Array.isArray(specialties) ? specialties : [],
      languages: Array.isArray(languages) ? languages : [],
      profilePhoto,
      portfolioImages: Array.isArray(portfolioImages) ? portfolioImages : [],
      documents,
      name: ownerName,
      agency: agencyName,
      photo: profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      specializations: Array.isArray(specialties) ? specialties : [],
      rating: 4.5,
      reviewCount: 0,
      verified: true,
      experience: parseInt(experienceYears) || 0,
      description: about || '',
      responseTime: '< 2 hours',
      totalTrips: 0,
      trustBadges: ['New Agent'],
      profileCompletion: 85,
      status: 'approved',
      submittedDate: new Date().toISOString().split('T')[0]
    });

    await agentProfile.save();
    console.log('Agent profile saved to MongoDB:', agentProfile._id);
    
    console.log('Travel agent registration successful:', agentProfile._id);

    res.json({
      success: true,
      message: 'Travel agent registration submitted successfully',
      status: 'approved',
      agentId: agentProfile._id
    });
  } catch (error) {
    console.error('Travel agent registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to register travel agent',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get all verified agents
router.get('/', async (req, res) => {
  try {
    const { location, specialty, language, minRating } = req.query;
    
    const query = { status: 'approved' };
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (specialty) {
      query.specializations = { $regex: specialty, $options: 'i' };
    }
    if (language) {
      query.languages = { $regex: language, $options: 'i' };
    }
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const agents = await TravelAgent.find(query).lean();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch travel agents' });
  }
});

// Get agent profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock agent profile
    const agent = {
      id,
      name: 'Sarah Johnson',
      agency: 'Adventure Lanka Tours',
      photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      location: 'Colombo, Sri Lanka',
      specializations: ['Adventure', 'Cultural', 'Wildlife'],
      rating: 4.8,
      reviewCount: 127,
      languages: ['English', 'Sinhala'],
      verified: true,
      experience: 8,
      description: 'Specialized in authentic Sri Lankan experiences with focus on adventure and cultural immersion.',
      phone: '+94 77 123 4567',
      email: 'sarah@adventurelanka.com',
      priceRange: '$50-150/day',
      packages: [
        {
          id: '1',
          title: '7-Day Cultural Triangle Tour',
          duration: '7 days',
          price: 850,
          description: 'Explore ancient cities of Anuradhapura, Polonnaruwa, and Sigiriya'
        }
      ],
      reviews: [
        {
          id: '1',
          customerName: 'John D.',
          rating: 5,
          comment: 'Excellent service! Sarah planned our perfect Sri Lankan adventure.',
          date: '2024-01-10'
        }
      ]
    };

    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent profile' });
  }
});

// Create travel package
router.post('/packages', async (req, res) => {
  try {
    const { uid } = req.user;
    const packageData = req.body;

    const User = req.app.get('User') || global.User;
    const user = await User.findOne({ firebaseUid: uid });
    
    if (!user || user.role !== 'travel_agent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mock package creation
    const travelPackage = {
      id: Date.now().toString(),
      agentId: user._id,
      ...packageData,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    res.status(201).json({ success: true, package: travelPackage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create travel package' });
  }
});

// Get agent's packages
router.get('/my/packages', async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Mock agent packages
    const packages = [
      {
        id: '1',
        title: '7-Day Cultural Triangle Tour',
        duration: '7 days',
        price: 850,
        bookings: 5,
        revenue: 4250,
        status: 'active'
      }
    ];

    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Get agent bookings
router.get('/my/bookings', async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Mock bookings
    const bookings = [
      {
        id: '1',
        customerName: 'John Doe',
        package: '7-Day Cultural Triangle Tour',
        startDate: '2024-02-15',
        endDate: '2024-02-22',
        travelers: 2,
        amount: 1700,
        status: 'confirmed'
      }
    ];

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update agent profile
router.put('/profile', async (req, res) => {
  try {
    const { uid } = req.user;
    const updates = req.body;

    const User = req.app.get('User') || global.User;
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { 'agentProfile': { ...updates } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, profile: user.agentProfile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Admin: Get all travel agent applications
router.get('/admin/applications', async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = status ? { status } : {};
    const applications = await TravelAgent.find(query).lean();
    
    const summary = {
      total: await TravelAgent.countDocuments(),
      pending: await TravelAgent.countDocuments({ status: 'pending' }),
      approved: await TravelAgent.countDocuments({ status: 'approved' }),
      rejected: await TravelAgent.countDocuments({ status: 'rejected' })
    };
    
    res.json({ applications, summary });
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Admin: Approve/reject agent
router.put('/admin/approve/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { action } = req.body;
    
    const agent = await TravelAgent.findByIdAndUpdate(
      agentId,
      { 
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({
      success: true,
      message: `Agent ${action}d successfully`,
      agentId,
      status: agent.status
    });
  } catch (error) {
    console.error('Failed to process approval:', error);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

// Get single agent by ID
router.get('/:id', async (req, res) => {
  try {
    const agent = await TravelAgent.findById(req.params.id).lean();
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

export default router;