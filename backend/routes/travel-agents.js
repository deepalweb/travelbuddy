import express from 'express';
import TravelAgent from '../models/TravelAgent.js';

const router = express.Router();

// CORS middleware
router.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://travelbuddylk.com',
    'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
  ];
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Register travel agent
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      country,
      city,
      location,
      languages,
      experience,
      specializations,
      agencyName,
      agencyType,
      licenseNumber,
      consultationFee,
      dayRate,
      description
    } = req.body;

    // Validation
    if (!fullName || !email || !phone || !country || !city) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!languages || languages.length === 0) {
      return res.status(400).json({ error: 'Must select at least one language' });
    }

    if (!specializations || specializations.length === 0) {
      return res.status(400).json({ error: 'Must select at least one specialization' });
    }

    const agentData = {
      fullName,
      email,
      phone,
      country,
      city,
      languages,
      experience,
      specializations,
      agencyName: agencyName || '',
      agencyType,
      licenseNumber: licenseNumber || '',
      consultationFee: parseInt(consultationFee) || 0,
      dayRate: parseInt(dayRate),
      description,
      verificationStatus: 'approved',
      isActive: true,
      verified: true,
      approvedAt: new Date()
    };
    
    // Transform coordinates: frontend {lat, lng} → MongoDB [lng, lat]
    if (location?.coordinates?.lat && location?.coordinates?.lng) {
      agentData.location = {
        address: location.address,
        coordinates: {
          type: 'Point',
          coordinates: [location.coordinates.lng, location.coordinates.lat]
        },
        city: location.city,
        country: location.country
      };
    }

    const agent = new TravelAgent(agentData);
    const savedAgent = await agent.save();

    res.json({
      message: 'Travel agent registration successful',
      status: 'approved',
      agentId: savedAgent._id
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Email already registered',
        details: 'A travel agent with this email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to register travel agent',
      details: error.message
    });
  }
});

// Get all approved agents
router.get('/', async (req, res) => {
  try {
    const agents = await TravelAgent.find({ 
      verificationStatus: 'approved', 
      isActive: true 
    }).select('-adminNotes -documents');

    const formattedAgents = agents.map(agent => ({
      id: agent._id.toString(),
      name: agent.fullName,
      agency: agent.agencyName || `${agent.agencyType}`,
      photo: agent.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      location: `${agent.city}, ${agent.country}`,
      specializations: agent.specializations,
      rating: agent.rating,
      reviewCount: agent.reviewCount,
      languages: agent.languages,
      verified: agent.verified,
      experience: parseInt(agent.experience.split('-')[0]) || 5,
      description: agent.description,
      phone: agent.phone,
      email: agent.email,
      priceRange: `$${agent.consultationFee === 0 ? 'Free' : agent.consultationFee} consultation / $${agent.dayRate}/day`,
      responseTime: agent.responseTime,
      totalTrips: agent.totalTrips,
      trustBadges: agent.trustBadges
    }));

    res.json(formattedAgents);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    res.status(500).json({ error: 'Failed to fetch travel agents' });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const agent = await TravelAgent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent details' });
  }
});

// Admin: Get all applications
router.get('/admin/applications', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    let query = {};
    if (status) {
      query.verificationStatus = status;
    }
    
    const applications = await TravelAgent.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const summary = {
      total: await TravelAgent.countDocuments(),
      pending: await TravelAgent.countDocuments({ verificationStatus: 'pending' }),
      approved: await TravelAgent.countDocuments({ verificationStatus: 'approved' }),
      rejected: await TravelAgent.countDocuments({ verificationStatus: 'rejected' })
    };
    
    res.json({ applications, summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get nearby travel agents
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, limit = 50, specialization } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    const query = {
      verificationStatus: 'approved',
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    };
    
    if (specialization) {
      query.specializations = specialization;
    }
    
    const agents = await TravelAgent.find(query)
      .limit(parseInt(limit))
      .select('-adminNotes -documents')
      .lean();
    
    // Calculate distance and transform coordinates
    const agentsWithDistance = agents.map(agent => {
      let distance = null;
      if (agent.location?.coordinates?.coordinates) {
        const [agentLng, agentLat] = agent.location.coordinates.coordinates;
        const R = 6371e3;
        const φ1 = parseFloat(lat) * Math.PI / 180;
        const φ2 = agentLat * Math.PI / 180;
        const Δφ = (agentLat - parseFloat(lat)) * Math.PI / 180;
        const Δλ = (agentLng - parseFloat(lng)) * Math.PI / 180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
      }
      
      // Transform coordinates back to frontend format
      if (agent.location?.coordinates?.coordinates) {
        agent.location.coordinates = {
          lat: agent.location.coordinates.coordinates[1],
          lng: agent.location.coordinates.coordinates[0]
        };
      }
      
      return { ...agent, distance };
    });
    
    console.log(`✅ Found ${agentsWithDistance.length} agents near ${lat},${lng}`);
    res.json(agentsWithDistance);
  } catch (error) {
    console.error('❌ Error fetching nearby agents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin: Approve/reject agent
router.put('/admin/approve/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { action, notes } = req.body;
    
    const updateData = {
      verificationStatus: action === 'approve' ? 'approved' : 'rejected',
      isActive: action === 'approve',
      adminNotes: notes,
      processedAt: new Date()
    };
    
    if (action === 'approve') {
      updateData.approvedAt = new Date();
      updateData.verified = true;
    }
    
    const updatedAgent = await TravelAgent.findByIdAndUpdate(
      agentId,
      updateData,
      { new: true }
    );
    
    if (!updatedAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({
      success: true,
      message: `Agent ${action}d successfully`,
      agentId,
      action
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

export default router;
