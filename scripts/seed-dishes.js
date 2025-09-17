import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Dish Schema (matching the backend)
const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  cuisine: String,
  location: {
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  ingredients: [String],
  preparationTime: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  servings: Number,
  image: String,
  recipe: {
    instructions: [String],
    tips: [String]
  },
  nutritionalInfo: {
    calories: Number,
    protein: String,
    carbs: String,
    fat: String
  },
  tags: [String],
  isPopular: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Dish = mongoose.model('Dish', dishSchema);

// Sample dishes data
const sampleDishes = [
  {
    name: 'Sri Lankan Rice and Curry',
    description: 'Traditional Sri Lankan meal with rice and multiple curries',
    cuisine: 'Sri Lankan',
    location: {
      city: 'Colombo',
      country: 'Sri Lanka',
      coordinates: { lat: 6.9271, lng: 79.8612 }
    },
    ingredients: ['Rice', 'Coconut', 'Curry leaves', 'Spices', 'Vegetables'],
    preparationTime: '45 minutes',
    difficulty: 'Medium',
    servings: 4,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    tags: ['traditional', 'spicy', 'vegetarian-option'],
    isPopular: true
  },
  {
    name: 'Fish Tacos',
    description: 'Fresh grilled fish with cabbage slaw and lime crema',
    cuisine: 'Mexican',
    location: {
      city: 'San Francisco',
      country: 'USA',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    ingredients: ['White fish', 'Corn tortillas', 'Cabbage', 'Lime', 'Cilantro'],
    preparationTime: '25 minutes',
    difficulty: 'Easy',
    servings: 2,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
    tags: ['seafood', 'fresh', 'gluten-free-option'],
    isPopular: true
  },
  {
    name: 'Ramen Bowl',
    description: 'Rich tonkotsu broth with fresh noodles and toppings',
    cuisine: 'Japanese',
    location: {
      city: 'Tokyo',
      country: 'Japan',
      coordinates: { lat: 35.6762, lng: 139.6503 }
    },
    ingredients: ['Ramen noodles', 'Pork broth', 'Chashu pork', 'Green onions', 'Nori'],
    preparationTime: '2 hours',
    difficulty: 'Hard',
    servings: 2,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    tags: ['comfort-food', 'hearty', 'traditional'],
    isPopular: true
  },
  {
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with tomato, mozzarella, and basil',
    cuisine: 'Italian',
    location: {
      city: 'Naples',
      country: 'Italy',
      coordinates: { lat: 40.8518, lng: 14.2681 }
    },
    ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Fresh basil', 'Olive oil'],
    preparationTime: '30 minutes',
    difficulty: 'Medium',
    servings: 2,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    tags: ['vegetarian', 'classic', 'wood-fired'],
    isPopular: true
  },
  {
    name: 'Pad Thai',
    description: 'Stir-fried rice noodles with shrimp, tofu, and peanuts',
    cuisine: 'Thai',
    location: {
      city: 'Bangkok',
      country: 'Thailand',
      coordinates: { lat: 13.7563, lng: 100.5018 }
    },
    ingredients: ['Rice noodles', 'Shrimp', 'Tofu', 'Bean sprouts', 'Peanuts', 'Tamarind'],
    preparationTime: '20 minutes',
    difficulty: 'Medium',
    servings: 2,
    image: 'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400',
    tags: ['stir-fry', 'sweet-sour', 'gluten-free'],
    isPopular: true
  },
  {
    name: 'Croissant',
    description: 'Buttery, flaky French pastry perfect for breakfast',
    cuisine: 'French',
    location: {
      city: 'Paris',
      country: 'France',
      coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    ingredients: ['Flour', 'Butter', 'Yeast', 'Milk', 'Sugar'],
    preparationTime: '3 hours',
    difficulty: 'Hard',
    servings: 8,
    image: 'https://images.unsplash.com/photo-1555507036-ab794f4afe5e?w=400',
    tags: ['pastry', 'breakfast', 'buttery'],
    isPopular: false
  }
];

async function seedDishes() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI || MONGO_URI === 'disabled') {
      console.log('MongoDB not configured, skipping dish seeding');
      return;
    }

    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing dishes
    await Dish.deleteMany({});
    console.log('Cleared existing dishes');

    // Insert sample dishes
    const insertedDishes = await Dish.insertMany(sampleDishes);
    console.log(`Inserted ${insertedDishes.length} sample dishes`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error seeding dishes:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDishes();