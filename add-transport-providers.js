import mongoose from 'mongoose';
import TransportProvider from './backend/models/TransportProvider.js';

const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-connection-string';

const providers = [
  {
    companyName: 'Lanka Express Transport',
    ownerName: 'Rajesh Kumar',
    email: 'info@lankaexpress.lk',
    phone: '+94 11 234 5678',
    address: 'Colombo, Sri Lanka',
    licenseNumber: 'LK-BUS-2024-001',
    vehicleTypes: ['Bus'],
    serviceAreas: ['Colombo', 'Kandy'],
    fleetSize: '10',
    basePrice: '500',
    amenities: ['AC', 'WiFi', 'Charging Ports', 'Refreshments'],
    description: 'Comfortable air-conditioned bus service with modern amenities',
    verificationStatus: 'approved',
    isActive: true,
    approvedAt: new Date()
  },
  {
    companyName: 'Island Taxi Service',
    ownerName: 'Priya Fernando',
    email: 'bookings@islandtaxi.lk',
    phone: '+94 77 987 6543',
    address: 'Colombo Airport, Sri Lanka',
    licenseNumber: 'LK-CAR-2024-002',
    vehicleTypes: ['Car'],
    serviceAreas: ['Bandaranaike Airport', 'Colombo City'],
    fleetSize: '25',
    basePrice: '2500',
    amenities: ['AC', 'English Speaking Driver', 'Child Seats Available'],
    description: 'Professional airport transfer service with experienced drivers',
    verificationStatus: 'approved',
    isActive: true,
    approvedAt: new Date()
  },
  {
    companyName: 'Coastal Ferry Services',
    ownerName: 'Nimal Perera',
    email: 'ferry@coastal.lk',
    phone: '+94 91 456 7890',
    address: 'Colombo Port, Sri Lanka',
    licenseNumber: 'LK-FERRY-2024-003',
    vehicleTypes: ['Ferry'],
    serviceAreas: ['Colombo Port', 'Galle Harbor'],
    fleetSize: '3',
    basePrice: '1200',
    amenities: ['Sea Views', 'Onboard Cafe', 'Deck Access', 'Life Jackets'],
    description: 'Scenic coastal ferry with beautiful ocean views',
    verificationStatus: 'approved',
    isActive: true,
    approvedAt: new Date()
  }
];

async function addProviders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing providers (optional)
    // await TransportProvider.deleteMany({});
    
    // Add new providers
    const result = await TransportProvider.insertMany(providers);
    console.log(`✅ Added ${result.length} transport providers`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addProviders();
