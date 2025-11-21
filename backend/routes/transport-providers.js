import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/rbac.js';
import TransportProvider from '../models/TransportProvider.js';

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Transport providers route is working', timestamp: new Date().toISOString() });
});

// Handle preflight OPTIONS requests
router.options('/register', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Transport provider registration
router.post('/register', async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  try {
    console.log('Registration request received');
    console.log('Request body keys:', Object.keys(req.body || {}));
    
    const {
      companyName,
      ownerName,
      email,
      phone,
      address,
      licenseNumber,
      vehicleTypes,
      serviceAreas,
      fleetSize,
      documents
    } = req.body;

    // Validation
    if (!companyName || !ownerName || !email || !phone || !licenseNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!vehicleTypes || vehicleTypes.length === 0) {
      return res.status(400).json({ error: 'Must select at least one vehicle type' });
    }

    if (!serviceAreas || serviceAreas.length === 0) {
      return res.status(400).json({ error: 'Must select at least one service area' });
    }

    // Create provider profile with minimal required fields first
    const providerData = {
      companyName,
      ownerName,
      email,
      phone,
      address: address || 'Not provided',
      licenseNumber,
      fleetSize: fleetSize || '1',
      vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes : [vehicleTypes].filter(Boolean),
      serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : [serviceAreas].filter(Boolean),
      verificationStatus: 'approved',
      isActive: true,
      approvedAt: new Date()
    };
    
    // Add optional fields if provided
    if (req.body.description) providerData.description = req.body.description;
    if (req.body.businessRegNumber) providerData.businessRegNumber = req.body.businessRegNumber;
    if (req.body.country) providerData.country = req.body.country;
    if (req.body.islandWide) providerData.islandWide = req.body.islandWide;
    if (req.body.airportTransfers) providerData.airportTransfers = req.body.airportTransfers;
    if (req.body.basePrice) providerData.basePrice = req.body.basePrice;
    if (req.body.amenities) providerData.amenities = req.body.amenities;
    
    console.log('Creating provider with data:', providerData);
    const providerProfile = new TransportProvider(providerData);

    // Save to database
    const savedProvider = await providerProfile.save();
    console.log('Stored application:', savedProvider._id);

    res.json({
      message: 'Transport provider registration submitted successfully',
      status: 'pending',
      providerId: savedProvider._id
    });


  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate email error
    if (error.code === 11000 || error.message.includes('duplicate')) {
      return res.status(400).json({ 
        error: 'Email already registered',
        details: 'A transport provider with this email already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to register transport provider',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get transport services with enhanced filtering
router.get('/services', async (req, res) => {
  try {
    const { 
      location, 
      vehicleType, 
      date, 
      minRating, 
      maxPrice, 
      verifiedOnly, 
      instantBooking, 
      ecoFriendly,
      aiSearch 
    } = req.query;
    
    // Get approved providers from database
    const approvedProviders = await TransportProvider.find({ verificationStatus: 'approved', isActive: true });
    console.log('Approved providers from DB:', approvedProviders.length);
    
    // Convert approved providers to services
    const providerServices = approvedProviders.map(provider => ({
      id: provider._id.toString(),
      providerId: provider._id.toString(),
      companyName: provider.companyName,
      vehicleType: provider.vehicleTypes[0] || 'Car',
      route: provider.islandWide ? 'Island Wide Service' : `${provider.serviceAreas[0]} - ${provider.serviceAreas[1] || 'Various'}`,
      fromLocation: provider.serviceAreas[0] || 'Various',
      toLocation: provider.serviceAreas[1] || 'Various',
      price: provider.basePrice ? parseInt(provider.basePrice.replace(/[^0-9]/g, '')) || 500 : Math.floor(Math.random() * 2000) + 500,
      duration: '2-4 hours',
      departure: 'On Demand',
      arrival: 'On Demand',
      availableSeats: Math.floor(Math.random() * 20) + 5,
      totalSeats: Math.floor(Math.random() * 30) + 20,
      amenities: provider.amenities && provider.amenities.length > 0 ? provider.amenities : ['AC', 'Professional Driver'],
      rating: 4.0 + Math.random(),
      reviewCount: Math.floor(Math.random() * 50) + 10,
      image: provider.vehiclePhotos && provider.vehiclePhotos.length > 0 ? provider.vehiclePhotos[0] : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
      description: provider.description || `Professional ${provider.vehicleTypes[0]} service by ${provider.companyName}`,
      phone: provider.phone,
      email: provider.email,
      isVerified: true,
      isLive: true,
      aiRecommended: false,
      popularRoute: false,
      instantBooking: true,
      refundable: true,
      ecoFriendly: false,
      insuranceIncluded: true,
      lastUpdated: 'Recently added'
    }));
    
    // Use only real database services
    let services = providerServices;

    // Apply filters
    if (vehicleType && vehicleType !== 'All') {
      services = services.filter(s => s.vehicleType === vehicleType);
    }
    if (minRating) {
      services = services.filter(s => s.rating >= parseFloat(minRating));
    }
    if (maxPrice) {
      services = services.filter(s => s.price <= parseInt(maxPrice));
    }
    if (verifiedOnly === 'true') {
      services = services.filter(s => s.isVerified);
    }
    if (instantBooking === 'true') {
      services = services.filter(s => s.instantBooking);
    }
    if (ecoFriendly === 'true') {
      services = services.filter(s => s.ecoFriendly);
    }

    // Sort by AI recommendations and popularity
    services.sort((a, b) => {
      if (a.aiRecommended && !b.aiRecommended) return -1;
      if (!a.aiRecommended && b.aiRecommended) return 1;
      if (a.popularRoute && !b.popularRoute) return -1;
      if (!a.popularRoute && b.popularRoute) return 1;
      return b.rating - a.rating;
    });

    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transport services' });
  }
});

// AI-powered search endpoint
router.post('/ai-search', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Mock AI processing - in real implementation, use Azure OpenAI
    const suggestions = {
      vehicleType: null,
      destination: null,
      passengers: null,
      preferences: []
    };

    // Simple keyword extraction (replace with actual AI)
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('kandy')) suggestions.destination = 'Kandy';
    if (lowerQuery.includes('galle')) suggestions.destination = 'Galle';
    if (lowerQuery.includes('comfortable') || lowerQuery.includes('luxury')) {
      suggestions.preferences.push('comfort');
    }
    if (lowerQuery.includes('cheap') || lowerQuery.includes('budget')) {
      suggestions.preferences.push('budget');
    }
    if (lowerQuery.includes('van')) suggestions.vehicleType = 'Van';
    if (lowerQuery.includes('bus')) suggestions.vehicleType = 'Bus';
    if (lowerQuery.includes('car') || lowerQuery.includes('taxi')) suggestions.vehicleType = 'Car';
    
    // Extract numbers for passenger count
    const numbers = query.match(/\d+/);
    if (numbers) suggestions.passengers = parseInt(numbers[0]);

    res.json({
      suggestions,
      message: 'AI analysis complete',
      recommendedFilters: {
        vehicleType: suggestions.vehicleType,
        destination: suggestions.destination,
        minRating: suggestions.preferences.includes('comfort') ? 4 : 0,
        maxPrice: suggestions.preferences.includes('budget') ? 1000 : 10000
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'AI search failed' });
  }
});

// Get popular routes
router.get('/popular-routes', async (req, res) => {
  try {
    const routes = [
      { route: 'Colombo - Kandy', bookings: 245, avgPrice: 650 },
      { route: 'Airport - Colombo', bookings: 189, avgPrice: 2200 },
      { route: 'Colombo - Galle', bookings: 156, avgPrice: 1100 },
      { route: 'Kandy - Nuwara Eliya', bookings: 134, avgPrice: 800 },
      { route: 'Colombo - Negombo', bookings: 98, avgPrice: 1500 }
    ];
    
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch popular routes' });
  }
});

// Get nearby services (for map view)
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    // Mock nearby services
    const nearbyServices = [
      {
        id: '1',
        companyName: 'Quick Taxi',
        vehicleType: 'Car',
        distance: '0.5 km',
        eta: '3 minutes',
        price: 500,
        coordinates: { lat: 6.9271, lng: 79.8612 }
      },
      {
        id: '2', 
        companyName: 'City Bus',
        vehicleType: 'Bus',
        distance: '0.8 km',
        eta: '5 minutes',
        price: 50,
        coordinates: { lat: 6.9280, lng: 79.8620 }
      }
    ];
    
    res.json(nearbyServices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nearby services' });
  }
});

// Create transport service
router.post('/services', async (req, res) => {
  try {
    const { uid } = req.user;
    const serviceData = req.body;

    const User = req.app.get('User') || global.User;
    const user = await User.findOne({ firebaseUid: uid });
    
    if (!user || user.role !== 'transport_provider') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mock service creation
    const service = {
      id: Date.now().toString(),
      providerId: user._id,
      ...serviceData,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    res.status(201).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transport service' });
  }
});

// Get provider's services with analytics
router.get('/my-services', async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Mock provider services with enhanced data
    const services = [
      {
        id: '1',
        route: 'Colombo - Kandy',
        vehicleType: 'Bus',
        price: 500,
        status: 'active',
        bookings: 15,
        revenue: 7500,
        rating: 4.5,
        views: 234,
        lastBooking: '2 hours ago',
        popularTimes: ['8:00 AM', '2:00 PM', '6:00 PM'],
        occupancyRate: 85
      },
      {
        id: '2',
        route: 'Kandy - Nuwara Eliya',
        vehicleType: 'Van',
        price: 800,
        status: 'active',
        bookings: 8,
        revenue: 6400,
        rating: 4.8,
        views: 156,
        lastBooking: '1 day ago',
        popularTimes: ['9:00 AM', '3:00 PM'],
        occupancyRate: 92
      }
    ];

    const analytics = {
      totalRevenue: services.reduce((sum, s) => sum + s.revenue, 0),
      totalBookings: services.reduce((sum, s) => sum + s.bookings, 0),
      averageRating: services.reduce((sum, s) => sum + s.rating, 0) / services.length,
      activeServices: services.filter(s => s.status === 'active').length
    };

    res.json({ services, analytics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Provider dashboard analytics
router.get('/provider/analytics', async (req, res) => {
  try {
    const { uid } = req.user;
    const { period = '30d' } = req.query;
    
    // Mock analytics data
    const analytics = {
      revenue: {
        current: 25000,
        previous: 22000,
        growth: 13.6
      },
      bookings: {
        current: 45,
        previous: 38,
        growth: 18.4
      },
      rating: {
        current: 4.6,
        previous: 4.4,
        growth: 4.5
      },
      views: {
        current: 890,
        previous: 756,
        growth: 17.7
      },
      popularRoutes: [
        { route: 'Colombo - Kandy', bookings: 25, revenue: 12500 },
        { route: 'Kandy - Nuwara Eliya', bookings: 20, revenue: 12500 }
      ],
      recentBookings: [
        { id: 'B001', customer: 'John D.', route: 'Colombo - Kandy', amount: 500, date: '2024-01-15' },
        { id: 'B002', customer: 'Sarah M.', route: 'Kandy - Nuwara Eliya', amount: 800, date: '2024-01-14' }
      ]
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Update service
router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Mock service update
    res.json({ success: true, message: 'Service updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Get bookings with enhanced data
router.get('/bookings', async (req, res) => {
  try {
    const { status, date, limit = 50 } = req.query;
    
    // Mock bookings data with enhanced information
    let bookings = [
      {
        id: 'B001',
        customerName: 'John Doe',
        customerPhone: '+94 77 123 4567',
        service: 'Colombo - Kandy',
        vehicleType: 'Bus',
        date: '2024-01-15',
        time: '08:00 AM',
        seats: 2,
        amount: 1000,
        status: 'confirmed',
        paymentMethod: 'card',
        bookingTime: '2024-01-14 10:30 AM',
        specialRequests: 'Window seats preferred'
      },
      {
        id: 'B002',
        customerName: 'Sarah Miller',
        customerPhone: '+94 71 987 6543',
        service: 'Airport - Colombo',
        vehicleType: 'Car',
        date: '2024-01-16',
        time: 'On Demand',
        seats: 1,
        amount: 2500,
        status: 'pending',
        paymentMethod: 'cash',
        bookingTime: '2024-01-15 02:15 PM',
        specialRequests: 'Child seat required'
      },
      {
        id: 'B003',
        customerName: 'Mike Johnson',
        customerPhone: '+94 76 456 7890',
        service: 'Colombo - Galle',
        vehicleType: 'Ferry',
        date: '2024-01-17',
        time: '09:30 AM',
        seats: 4,
        amount: 4800,
        status: 'completed',
        paymentMethod: 'card',
        bookingTime: '2024-01-16 08:45 AM',
        specialRequests: 'None'
      }
    ];

    // Apply filters
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }
    if (date) {
      bookings = bookings.filter(b => b.date === date);
    }

    // Limit results
    bookings = bookings.slice(0, parseInt(limit));

    const summary = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.amount, 0)
    };

    res.json({ bookings, summary });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Mock status update
    res.json({ 
      success: true, 
      message: `Booking ${id} status updated to ${status}`,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Real-time availability update
router.put('/services/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { availableSeats, isLive } = req.body;
    
    // Mock availability update
    res.json({ 
      success: true, 
      message: 'Availability updated successfully',
      serviceId: id,
      availableSeats,
      isLive,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Service comparison endpoint
router.post('/compare', async (req, res) => {
  try {
    const { serviceIds } = req.body;
    
    // Mock comparison data
    const comparison = {
      services: serviceIds,
      analysis: {
        cheapest: serviceIds[0],
        fastest: serviceIds[1], 
        highestRated: serviceIds[0],
        mostComfortable: serviceIds[1]
      },
      recommendation: {
        serviceId: serviceIds[0],
        reason: 'Best overall value with high rating and competitive price'
      }
    };
    
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare services' });
  }
});

// Get all transport applications for admin
router.get('/admin/applications', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    let query = {};
    if (status) {
      query.verificationStatus = status;
    }
    
    const applications = await TransportProvider.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const totalCount = await TransportProvider.countDocuments();
    const pendingCount = await TransportProvider.countDocuments({ verificationStatus: 'pending' });
    const approvedCount = await TransportProvider.countDocuments({ verificationStatus: 'approved' });
    const rejectedCount = await TransportProvider.countDocuments({ verificationStatus: 'rejected' });
    
    const summary = {
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    };
    
    res.json({ applications, summary });
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Admin: Approve/reject provider
router.put('/admin/approve/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { action, notes } = req.body;
    
    const updateData = {
      verificationStatus: action === 'approve' ? 'approved' : 'rejected',
      isActive: action === 'approve',
      adminNotes: notes,
      processedAt: new Date()
    };
    
    if (action === 'approve') {
      updateData.approvedAt = new Date();
      // Add approvedBy if admin user info is available
    }
    
    const updatedProvider = await TransportProvider.findByIdAndUpdate(
      providerId,
      updateData,
      { new: true }
    );
    
    if (!updatedProvider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    res.json({
      success: true,
      message: `Provider ${action}d successfully`,
      providerId,
      action,
      notes,
      processedAt: updateData.processedAt
    });
  } catch (error) {
    console.error('Failed to process approval:', error);
    res.status(500).json({ error: 'Failed to process approval' });
  }
});

// Get individual transport provider details
router.get('/admin/details/:id', async (req, res) => {
  try {
    const provider = await TransportProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    console.error('Failed to fetch provider details:', error);
    res.status(500).json({ error: 'Failed to fetch provider details' });
  }
});

// Test endpoint to create sample data
router.post('/admin/create-test-data', async (req, res) => {
  try {
    const testProvider = new TransportProvider({
      companyName: 'Test Transport Co.',
      ownerName: 'John Doe',
      email: 'test@transport.com',
      phone: '+94-77-123-4567',
      address: '123 Test Street, Colombo',
      licenseNumber: 'TL-2024-001',
      vehicleTypes: ['Car', 'Van'],
      serviceAreas: ['Colombo', 'Kandy'],
      fleetSize: '5',
      verificationStatus: 'pending'
    });
    
    const saved = await testProvider.save();
    res.json({ success: true, provider: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;