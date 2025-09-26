import mongoose from 'mongoose';
import Service from './models/Service.js';
import Booking from './models/Booking.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function seedServiceData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find or create a service provider user
    let serviceProvider = await User.findOne({ role: 'agent' });
    if (!serviceProvider) {
      serviceProvider = new User({
        username: 'service_provider_demo',
        email: 'provider@demo.com',
        role: 'agent',
        profileType: 'service',
        serviceProfile: {
          serviceName: 'Demo Travel Services',
          serviceType: 'guide',
          serviceDescription: 'Professional travel guide services',
          serviceArea: 'City Center',
          verificationStatus: 'verified'
        }
      });
      await serviceProvider.save();
      console.log('Created demo service provider');
    }

    // Create sample services
    const services = [
      {
        userId: serviceProvider._id,
        name: 'City Walking Tour',
        type: 'Tour Guide',
        description: 'Explore the city with a local expert guide',
        price: 50,
        duration: '3 hours',
        location: 'Downtown',
        status: 'active',
        bookings: 8
      },
      {
        userId: serviceProvider._id,
        name: 'Airport Transfer',
        type: 'Transportation',
        description: 'Reliable airport pickup and drop-off service',
        price: 25,
        duration: '1 hour',
        location: 'Airport',
        status: 'active',
        bookings: 4
      }
    ];

    await Service.deleteMany({ userId: serviceProvider._id });
    const createdServices = await Service.insertMany(services);
    console.log('Created sample services');

    // Create sample bookings
    const bookings = [
      {
        serviceId: createdServices[0]._id,
        providerId: serviceProvider._id,
        clientId: serviceProvider._id, // Using same user for demo
        serviceName: 'City Walking Tour',
        clientName: 'John D.',
        date: '2024-01-15',
        amount: 50,
        status: 'confirmed'
      },
      {
        serviceId: createdServices[1]._id,
        providerId: serviceProvider._id,
        clientId: serviceProvider._id,
        serviceName: 'Airport Transfer',
        clientName: 'Sarah M.',
        date: '2024-01-16',
        amount: 25,
        status: 'pending'
      }
    ];

    await Booking.deleteMany({ providerId: serviceProvider._id });
    await Booking.insertMany(bookings);
    console.log('Created sample bookings');

    console.log('Service provider demo data seeded successfully!');
    console.log('Provider ID:', serviceProvider._id.toString());
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedServiceData();