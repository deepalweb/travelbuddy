import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { requireRole, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Transport provider registration
router.post('/register', async (req, res) => {
  try {
    const { uid } = req.user;
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

    const User = req.app.get('User') || global.User;
    
    if (!User) {
      return res.json({
        message: 'Transport provider registration submitted (demo mode)',
        status: 'pending'
      });
    }

    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role and profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        role: 'transport_provider',
        transportProfile: {
          companyName,
          ownerName,
          email,
          phone,
          address,
          licenseNumber,
          vehicleTypes,
          serviceAreas,
          fleetSize,
          documents,
          verificationStatus: 'pending',
          isActive: false
        }
      },
      { new: true }
    );

    res.json({
      message: 'Transport provider registration submitted',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register transport provider' });
  }
});

// Get transport services
router.get('/services', async (req, res) => {
  try {
    const { location, vehicleType, date } = req.query;
    
    // Mock transport services data
    const services = [
      {
        id: '1',
        providerId: 'tp1',
        companyName: 'Lanka Express Transport',
        vehicleType: 'Bus',
        route: 'Colombo - Kandy',
        price: 500,
        duration: '3 hours',
        departure: '08:00 AM',
        arrival: '11:00 AM',
        availableSeats: 25,
        amenities: ['AC', 'WiFi', 'Charging Ports']
      },
      {
        id: '2',
        providerId: 'tp2',
        companyName: 'Island Taxi Service',
        vehicleType: 'Car',
        route: 'Airport - Colombo City',
        price: 2500,
        duration: '45 minutes',
        departure: 'On Demand',
        arrival: 'On Demand',
        availableSeats: 4,
        amenities: ['AC', 'English Speaking Driver']
      }
    ];

    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transport services' });
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

// Get provider's services
router.get('/my-services', async (req, res) => {
  try {
    const { uid } = req.user;
    
    // Mock provider services
    const services = [
      {
        id: '1',
        route: 'Colombo - Kandy',
        vehicleType: 'Bus',
        price: 500,
        status: 'active',
        bookings: 15,
        revenue: 7500
      }
    ];

    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
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

// Get bookings
router.get('/bookings', async (req, res) => {
  try {
    // Mock bookings data
    const bookings = [
      {
        id: '1',
        customerName: 'John Doe',
        service: 'Colombo - Kandy',
        date: '2024-01-15',
        seats: 2,
        amount: 1000,
        status: 'confirmed'
      }
    ];

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

export default router;