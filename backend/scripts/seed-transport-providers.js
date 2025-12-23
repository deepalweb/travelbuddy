import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TransportProvider from '../models/TransportProvider.js';

dotenv.config();

const sampleProviders = [
  {
    companyName: 'Colombo Express Taxi',
    ownerName: 'Rajesh Silva',
    email: 'colomboexpress@transport.lk',
    phone: '+94-77-123-4567',
    address: '45 Galle Road, Colombo 03',
    licenseNumber: 'TL-2024-001',
    vehicleTypes: ['Car', 'Van'],
    serviceAreas: ['Colombo', 'Gampaha', 'Kalutara'],
    fleetSize: '15',
    description: 'Reliable taxi service covering Colombo and suburbs. 24/7 availability.',
    userId: 'seed-user-1',
    verificationStatus: 'approved',
    isActive: true,
    location: {
      address: '45 Galle Road, Colombo 03',
      coordinates: {
        type: 'Point',
        coordinates: [79.8612, 6.9271]
      },
      city: 'Colombo',
      country: 'Sri Lanka'
    }
  },
  {
    companyName: 'Kandy Hill Transport',
    ownerName: 'Nimal Perera',
    email: 'kandyhill@transport.lk',
    phone: '+94-81-234-5678',
    address: '12 Temple Street, Kandy',
    licenseNumber: 'TL-2024-002',
    vehicleTypes: ['Bus', 'Van'],
    serviceAreas: ['Kandy', 'Nuwara Eliya', 'Matale'],
    fleetSize: '8',
    description: 'Hill country specialist. Comfortable rides to tea country.',
    userId: 'seed-user-2',
    verificationStatus: 'approved',
    isActive: true,
    location: {
      address: '12 Temple Street, Kandy',
      coordinates: {
        type: 'Point',
        coordinates: [80.6337, 7.2906]
      },
      city: 'Kandy',
      country: 'Sri Lanka'
    }
  },
  {
    companyName: 'Galle Beach Transfers',
    ownerName: 'Sunil Fernando',
    email: 'gallebeach@transport.lk',
    phone: '+94-91-345-6789',
    address: '78 Beach Road, Galle',
    licenseNumber: 'TL-2024-003',
    vehicleTypes: ['Car', 'Van', 'Bus'],
    serviceAreas: ['Galle', 'Matara', 'Hikkaduwa'],
    fleetSize: '12',
    description: 'Southern coast transport specialist. Airport transfers available.',
    userId: 'seed-user-3',
    verificationStatus: 'approved',
    isActive: true,
    location: {
      address: '78 Beach Road, Galle',
      coordinates: {
        type: 'Point',
        coordinates: [80.2170, 6.0535]
      },
      city: 'Galle',
      country: 'Sri Lanka'
    }
  }
];

async function seedTransportProviders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await TransportProvider.deleteMany({});
    console.log('🗑️ Cleared existing providers');

    const created = await TransportProvider.insertMany(sampleProviders);
    console.log(`✅ Created ${created.length} transport providers`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedTransportProviders();
