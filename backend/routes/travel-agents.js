import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/rbac.js';

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

// In-memory storage for travel agent applications
let agentApplications = [];

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

    // Simplified data structure to avoid potential serialization issues
    const agentProfile = {
      id: Date.now().toString(),
      name: String(ownerName || ''),
      agency: String(agencyName || ''),
      photo: profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      location: String(address || ''),
      specializations: Array.isArray(specialties) ? specialties : [],
      rating: 4.5,
      reviewCount: 0,
      languages: Array.isArray(languages) ? languages : [],
      verified: true,
      experience: parseInt(experienceYears) || 0,
      description: String(about || ''),
      phone: String(phone || ''),
      email: String(email || ''),
      priceRange: String(priceRange || ''),
      responseTime: '< 2 hours',
      totalTrips: 0,
      trustBadges: ['New Agent'],
      profileCompletion: 85,
      // Keep original fields for admin
      agencyName: String(agencyName || ''),
      ownerName: String(ownerName || ''),
      whatsapp: String(whatsapp || ''),
      website: String(website || ''),
      address: String(address || ''),
      licenseNumber: String(licenseNumber || ''),
      experienceYears: String(experienceYears || ''),
      operatingRegions: Array.isArray(operatingRegions) ? operatingRegions : [],
      portfolioImages: Array.isArray(portfolioImages) ? portfolioImages : [],
      documents: documents || null,
      status: 'approved',
      submittedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    console.log('Agent profile created:', { id: agentProfile.id, agencyName: agentProfile.agencyName });

    // Add to applications array
    agentApplications.push(agentProfile);
    
    console.log('Travel agent registration successful:', agentProfile.id);
    console.log('Total applications:', agentApplications.length);

    res.json({
      success: true,
      message: 'Travel agent registration submitted successfully',
      status: 'pending',
      agentId: agentProfile.id
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
    
    // Get approved agents from in-memory storage
    const agents = agentApplications.filter(app => app.status === 'approved');

    // Apply filters
    let filteredAgents = agents;
    if (location) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.location && agent.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    if (specialty) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.specializations && agent.specializations.some(spec => 
          spec.toLowerCase().includes(specialty.toLowerCase())
        )
      );
    }
    if (language) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.languages && agent.languages.some(lang => 
          lang.toLowerCase().includes(language.toLowerCase())
        )
      );
    }
    if (minRating) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.rating >= parseFloat(minRating)
      );
    }

    res.json(filteredAgents);
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
    
    let applications = agentApplications;
    if (status) {
      applications = applications.filter(app => app.status === status);
    }
    
    const summary = {
      total: agentApplications.length,
      pending: agentApplications.filter(app => app.status === 'pending').length,
      approved: agentApplications.filter(app => app.status === 'approved').length,
      rejected: agentApplications.filter(app => app.status === 'rejected').length
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
    const { action } = req.body; // 'approve' or 'reject'
    
    const agentIndex = agentApplications.findIndex(app => app.id === agentId);
    if (agentIndex === -1) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    agentApplications[agentIndex].status = action === 'approve' ? 'approved' : 'rejected';
    agentApplications[agentIndex].processedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: `Agent ${action}d successfully`,
      agentId,
      status: agentApplications[agentIndex].status
    });
  } catch (error) {
    console.error('Failed to process approval:', error);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

export default router;