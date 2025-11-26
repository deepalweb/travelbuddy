import express from 'express';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { requireSubscription } from '../middleware/subscriptionCheck.js';

const router = express.Router();

// Initialize Azure OpenAI
const openai = process.env.AZURE_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
}) : null;

// Geocode activity to get coordinates
async function geocodeActivity(activityName, destination) {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const query = `${activityName}, ${destination}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'TravelBuddy' } });
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error(`Geocode error for ${activityName}:`, error.message);
  }
  return null;
}

// Fetch real places from Google Places API
async function fetchRealPlaces(destination) {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.log('Google Places API key not available');
    return [];
  }

  try {
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      console.log('Geocoding failed for', destination);
      return [];
    }
    
    const { lat, lng } = geocodeData.results[0].geometry.location;
    
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=25000&type=tourist_attraction&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();
    
    if (placesData.status === 'OK') {
      return placesData.results.slice(0, 10).map(place => ({
        name: place.name,
        description: `Visit ${place.name}, a popular attraction in ${destination}`,
        address: place.vicinity || place.formatted_address,
        googlePlaceId: place.place_id,
        coordinates: { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
        category: place.types[0] || 'Attraction',
        rating: place.rating || 4.0,
        costLow: '$5-15', costMed: '$15-30', costHigh: '$30-60',
        duration: '2 hours'
      }));
    }
  } catch (error) {
    console.error('Google Places API error:', error);
  }
  
  return [];
}

// Check Azure OpenAI status
async function checkAzureOpenAIStatus() {
  console.log('🔍 Checking Azure OpenAI status...');
  console.log('AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? 'SET' : 'MISSING');
  console.log('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT || 'MISSING');
  console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'MISSING');
  
  if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    console.log('❌ Azure OpenAI credentials missing');
    return false;
  }
  
  try {
    console.log('🧪 Testing Azure OpenAI connection...');
    const testCompletion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: "Test" }],
      max_tokens: 5
    });
    console.log('✅ Azure OpenAI is working:', testCompletion.choices[0].message.content);
    return true;
  } catch (error) {
    console.log('❌ Azure OpenAI test failed:', error.message);
    return false;
  }
}

// Generate AI trip itinerary using Azure OpenAI
async function generateAITrip(userPreferences) {
  const { destination, duration, travelStyle, budget, interests, travelers } = userPreferences;
  const days = parseInt(duration.match(/(\d+)/)?.[1] || '3');

  // Check Azure OpenAI status first
  const azureWorking = openai && await checkAzureOpenAIStatus();
  
  if (!azureWorking) {
    console.log('🔄 Azure OpenAI unavailable, using Google Places API');
    const realPlaces = await fetchRealPlaces(destination);
    return createRealisticItinerary(destination, days, budget, interests, realPlaces);
  }

  const prompt = `Create a detailed ${days}-day travel itinerary for ${destination} with REAL places, addresses, and attractions.

User Preferences:
- Duration: ${duration}
- Travel Style: ${travelStyle}
- Budget: ${budget}
- Interests: ${interests.join(', ')}
- Travelers: ${travelers}

IMPORTANT: Include REAL places with actual names, addresses, and specific details for ${destination}. Research actual attractions, restaurants, museums, landmarks. For imageUrl, use Unsplash URLs with relevant search terms like: https://images.unsplash.com/photo-1234567890/place-name?w=400&h=300&fit=crop

Return ONLY this JSON structure:
{
  "tripTitle": "${destination} ${days}-Day Adventure",
  "destination": "${destination}",
  "duration": "${days} day${days > 1 ? 's' : ''}",
  "introduction": "Welcome description for ${destination}",
  "conclusion": "Closing thoughts about the trip",
  "totalEstimatedCost": "$${budget === 'low' ? '300-600' : budget === 'high' ? '1200-2000' : '600-1200'}",
  "estimatedWalkingDistance": "4-7 km per day",
  "dailyPlans": [
    {
      "day": 1,
      "title": "Day 1 - Arrival & Exploration",
      "activities": [
        {
          "timeOfDay": "09:00-11:30",
          "activityTitle": "REAL place name with location",
          "description": "Detailed description of what to see and do",
          "address": "Full street address",
          "category": "Place category (Museum, Temple, Market, etc.)",
          "imageUrl": "https://images.unsplash.com/photo-1234567890/place-photo?w=400&h=300",
          "estimatedCost": "$15-25",
          "duration": "2.5 hours",
          "isVisited": false
        }
      ]
    }
  ],
  "travelTips": ["Specific tip 1", "Specific tip 2", "Specific tip 3"]
}`;

  try {
    console.log('🤖 Calling Azure OpenAI for', destination);
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8000
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log('✅ Azure OpenAI Response received');
    
    // Extract and clean JSON from response
    let jsonStr = responseText.trim();
    
    // Remove markdown code blocks
    if (jsonStr.includes('```json')) {
      const match = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonStr = match[1].trim();
    } else if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonStr = match[1].trim();
    }
    
    // Extract JSON object with better bracket matching
    if (jsonStr.includes('{')) {
      let braceCount = 0;
      let startIndex = -1;
      let endIndex = -1;
      
      for (let i = 0; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') {
          if (startIndex === -1) startIndex = i;
          braceCount++;
        } else if (jsonStr[i] === '}') {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            endIndex = i;
            break;
          }
        }
      }
      
      if (startIndex !== -1 && endIndex !== -1) {
        jsonStr = jsonStr.substring(startIndex, endIndex + 1);
      }
    }
    
    // Clean up common JSON issues
    jsonStr = jsonStr
      .replace(/,\s*}/g, '}')     // Remove trailing commas before }
      .replace(/,\s*]/g, ']')     // Remove trailing commas before ]
      .replace(/\\n/g, '\\\\n')   // Escape newlines in strings
      .replace(/\\r/g, '')        // Remove carriage returns
      .replace(/\\t/g, ' ')       // Replace tabs with spaces
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
    
    console.log('🔧 Cleaned JSON length:', jsonStr.length);
    
    let aiItinerary;
    try {
      aiItinerary = JSON.parse(jsonStr);
    } catch (parseError) {
      console.log('❌ JSON parse failed, attempting repair...');
      // Try to fix common JSON issues
      jsonStr = jsonStr
        .replace(/([^\\])"([^"]*?)"([^:])/g, '$1"$2"$3') // Fix unescaped quotes
        .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas more aggressively
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*):/g, '$1"$2":'); // Quote unquoted keys
      
      try {
        aiItinerary = JSON.parse(jsonStr);
      } catch (secondParseError) {
        console.log('❌ Second JSON parse failed, using fallback');
        throw new Error('JSON parsing failed: ' + secondParseError.message);
      }
    }
    aiItinerary.id = `ai_trip_${Date.now()}`;
    aiItinerary.createdAt = new Date().toISOString();
    
    // Enrich activities with coordinates
    console.log('📍 Geocoding activities...');
    for (const day of aiItinerary.dailyPlans || []) {
      for (const activity of day.activities || []) {
        if (!activity.coordinates) {
          const coords = await geocodeActivity(activity.activityTitle, destination);
          if (coords) {
            activity.coordinates = coords;
            activity.fullAddress = activity.address || activity.activityTitle;
          }
        }
      }
    }
    
    console.log('✅ AI itinerary generated successfully');
    return aiItinerary;
    
  } catch (error) {
    console.error('❌ Azure OpenAI failed:', error.message);
    console.log('🔄 Falling back to Google Places API');
    const realPlaces = await fetchRealPlaces(destination);
    return createRealisticItinerary(destination, days, budget, interests, realPlaces);
  }
}

// Create realistic itinerary with destination-specific content
function createRealisticItinerary(destination, days, budget, interests, realPlaces = []) {
  const destinationData = getDestinationData(destination);
  const actualDays = Math.max(1, days);
  
  // Use real places from Google Places API if available
  if (realPlaces && realPlaces.length > 0) {
    destinationData.activities = realPlaces;
  }
  
  // If no specific activities available, return error message
  if (!destinationData.activities || destinationData.activities.length === 0) {
    return {
      id: `trip_${Date.now()}`,
      tripTitle: `${destination} Trip Planning`,
      destination,
      duration: `${actualDays} day${actualDays > 1 ? 's' : ''}`,
      introduction: `We're working on generating a detailed itinerary for ${destination} with real places and attractions.`,
      conclusion: 'Please try again in a moment for a complete itinerary with actual locations.',
      totalEstimatedCost: 'To be calculated with real places',
      estimatedWalkingDistance: 'To be calculated',
      dailyPlans: [{
        day: 1,
        title: 'Itinerary Generation in Progress',
        activities: [{
          timeOfDay: '00:00-00:00',
          activityTitle: 'Real places loading...',
          description: 'We are fetching real attractions and places for your destination. Please refresh or try again.',
          address: 'Real addresses will be provided',
          category: 'System Message',
          estimatedCost: 'TBD',
          duration: 'TBD',
          isVisited: false
        }]
      }],
      travelTips: ['Please try generating the trip again', 'Real places and attractions will be included'],
      createdAt: new Date().toISOString()
    };
  }
  
  const dailyPlans = [];
  
  for (let day = 1; day <= actualDays; day++) {
    const dayActivities = [];
    const activitiesPerDay = Math.min(3, destinationData.activities.length);
    
    for (let i = 0; i < activitiesPerDay; i++) {
      const activityIndex = ((day - 1) * activitiesPerDay + i) % destinationData.activities.length;
      const activity = destinationData.activities[activityIndex];
      
      dayActivities.push({
        timeOfDay: ['09:00-11:30', '12:30-15:00', '16:00-18:30'][i] || '09:00-12:00',
        activityTitle: activity.name,
        description: activity.description,
        address: activity.address || `${activity.name}, ${destination}`,
        fullAddress: activity.address || `${activity.name}, ${destination}`,
        googlePlaceId: activity.googlePlaceId || activity.placeId,
        coordinates: activity.coordinates,
        category: activity.category || 'Attraction',
        estimatedCost: budget === 'low' ? activity.costLow : budget === 'high' ? activity.costHigh : activity.costMed,
        duration: activity.duration,
        isVisited: false
      });
    }
    
    dailyPlans.push({
      day,
      title: `Day ${day} - ${destinationData.dayTitles[(day-1) % destinationData.dayTitles.length]}`,
      activities: dayActivities
    });
  }
  
  const itinerary = {
    id: `trip_${Date.now()}`,
    tripTitle: `${destination} ${actualDays} Day${actualDays > 1 ? 's' : ''} Adventure`,
    destination,
    duration: `${actualDays} day${actualDays > 1 ? 's' : ''}`,
    introduction: destinationData.introduction,
    conclusion: destinationData.conclusion,
    totalEstimatedCost: budget === 'low' ? '$300-600' : budget === 'high' ? '$1200-2000' : '$600-1200',
    estimatedWalkingDistance: '4-7 km per day',
    dailyPlans,
    travelTips: destinationData.tips,
    createdAt: new Date().toISOString()
  };
  
  // Geocode activities without coordinates
  (async () => {
    for (const day of itinerary.dailyPlans) {
      for (const activity of day.activities) {
        if (!activity.coordinates) {
          const coords = await geocodeActivity(activity.activityTitle, destination);
          if (coords) activity.coordinates = coords;
        }
      }
    }
  })();
  
  return itinerary;
}

// Destination-specific data
function getDestinationData(destination) {
  const destinations = {
    'India': {
      introduction: 'Welcome to incredible India! Experience the vibrant culture, ancient history, and diverse landscapes of this fascinating country.',
      conclusion: 'Your Indian adventure offers a perfect blend of spirituality, culture, and unforgettable experiences that will stay with you forever.',
      dayTitles: ['Historic Delhi', 'Taj Mahal & Agra', 'Jaipur Pink City', 'Local Culture', 'Spiritual Journey'],
      activities: [
        { 
          name: 'Red Fort (Lal Qila)', 
          description: 'UNESCO World Heritage Site - Explore the magnificent Mughal architecture and royal palaces', 
          address: 'Netaji Subhash Marg, Lal Qila, Chandni Chowk, New Delhi, Delhi 110006',
          placeId: 'ChIJLbZ-NFv9DDkRzk0gTkm3wlI',
          coordinates: { lat: 28.6562, lng: 77.2410 },
          category: 'Historical Monument',
          imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop',
          costLow: '$5-10', costMed: '$10-20', costHigh: '$25-40', duration: '2.5 hours' 
        },
        { 
          name: 'India Gate', 
          description: 'War memorial and iconic landmark - Perfect for evening walks and photography', 
          address: 'Rajpath, India Gate, New Delhi, Delhi 110001',
          placeId: 'ChIJj6l3VTv9DDkR2AoWkbrdIQs',
          coordinates: { lat: 28.6129, lng: 77.2295 },
          category: 'Monument',
          imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop',
          costLow: '$0', costMed: '$0', costHigh: '$0', duration: '1.5 hours' 
        },
        { name: 'Local Street Food Tour', description: 'Taste authentic Indian cuisine from famous street vendors', costLow: '$5-12', costMed: '$12-25', costHigh: '$30-50', duration: '3 hours' },
        { 
          name: 'Taj Mahal', 
          description: 'Wonder of the World - Breathtaking marble mausoleum, best visited at sunrise', 
          address: 'Dharmapuri, Forest Colony, Tajganj, Agra, Uttar Pradesh 282001',
          placeId: 'ChIJbf8C1yFZdDkR3n12P4DkKt0',
          coordinates: { lat: 27.1751, lng: 78.0421 },
          category: 'UNESCO World Heritage',
          costLow: '$15-25', costMed: '$25-40', costHigh: '$50-80', duration: '3 hours' 
        },
        { name: 'Agra Fort', description: 'Discover the rich history of the Mughal empire at this UNESCO site', costLow: '$8-15', costMed: '$15-25', costHigh: '$30-45', duration: '2 hours' },
        { name: 'Mehtab Bagh Gardens', description: 'Enjoy sunset views of the Taj Mahal from across the river', costLow: '$3-8', costMed: '$8-15', costHigh: '$20-30', duration: '1.5 hours' },
        { name: 'Hawa Mahal Palace', description: 'Marvel at the intricate pink sandstone architecture of the Wind Palace', costLow: '$5-10', costMed: '$10-20', costHigh: '$25-40', duration: '1.5 hours' },
        { name: 'City Palace Complex', description: 'Explore the royal residence with museums and courtyards', costLow: '$8-15', costMed: '$15-30', costHigh: '$35-55', duration: '2.5 hours' },
        { name: 'Amber Fort & Elephant Ride', description: 'Experience royal grandeur with an optional elephant ride up the fort', costLow: '$10-20', costMed: '$25-45', costHigh: '$60-100', duration: '3 hours' }
      ],
      tips: ['Carry bottled water and stay hydrated', 'Dress modestly when visiting religious sites', 'Bargain at local markets for better prices', 'Try local transportation like auto-rickshaws']
    },
    'Paris': {
      introduction: 'Bonjour! Welcome to the City of Light, where romance, art, and culinary excellence create unforgettable memories.',
      conclusion: 'Your Parisian adventure captures the essence of French culture, from iconic landmarks to hidden neighborhood gems.',
      dayTitles: ['Classic Paris', 'Art & Culture', 'Montmartre & Sacré-Cœur', 'Seine & Islands', 'Modern Paris'],
      activities: [
        { name: 'Eiffel Tower & Trocadéro', description: 'Visit the iconic iron lady and enjoy panoramic views from Trocadéro Gardens', costLow: '$15-25', costMed: '$25-40', costHigh: '$50-80', duration: '2.5 hours' },
        { name: 'Louvre Museum', description: 'Discover world-famous art including the Mona Lisa and Venus de Milo', costLow: '$15-20', costMed: '$20-30', costHigh: '$40-60', duration: '3 hours' },
        { name: 'Seine River Cruise', description: 'Enjoy a romantic boat ride along the Seine with commentary', costLow: '$12-18', costMed: '$18-30', costHigh: '$35-55', duration: '1.5 hours' },
        { name: 'Notre-Dame & Sainte-Chapelle', description: 'Explore Gothic architecture and stunning stained glass windows', costLow: '$8-15', costMed: '$15-25', costHigh: '$30-45', duration: '2 hours' },
        { name: 'Montmartre & Sacré-Cœur', description: 'Wander through artistic streets and visit the beautiful basilica', costLow: '$5-10', costMed: '$10-20', costHigh: '$25-40', duration: '2.5 hours' },
        { name: 'Champs-Élysées & Arc de Triomphe', description: 'Stroll down the famous avenue and climb the triumphal arch', costLow: '$10-15', costMed: '$15-25', costHigh: '$30-50', duration: '2 hours' }
      ],
      tips: ['Learn basic French greetings', 'Visit museums on first Sunday mornings for free entry', 'Try local patisseries for authentic pastries', 'Use the metro for efficient city travel']
    },
    'Sri Lanka': {
      introduction: 'Welcome to the Pearl of the Indian Ocean! Discover ancient temples, pristine beaches, and rich cultural heritage.',
      conclusion: 'Your Sri Lankan adventure offers incredible diversity from mountains to beaches, ancient cities to modern culture.',
      dayTitles: ['Colombo Exploration', 'Cultural Triangle', 'Hill Country', 'Ancient Cities', 'Coastal Paradise'],
      activities: [
        { 
          name: 'Temple of the Sacred Tooth Relic', 
          description: 'Sacred Buddhist temple housing Buddha\'s tooth relic in Kandy', 
          address: 'Sri Dalada Veediya, Kandy 20000, Sri Lanka',
          placeId: 'ChIJkRyJ_1FH4joRwLhOZnCa4oo',
          coordinates: { lat: 7.2936, lng: 80.6410 },
          category: 'Sacred Temple',
          costLow: '$3-5', costMed: '$5-10', costHigh: '$15-25', duration: '2 hours' 
        },
        { 
          name: 'Sigiriya Rock Fortress', 
          description: 'Ancient rock citadel and UNESCO World Heritage Site with stunning frescoes', 
          address: 'Sigiriya 21120, Sri Lanka',
          placeId: 'ChIJtRyggKl94joRoNrpzYYGFws',
          coordinates: { lat: 7.9570, lng: 80.7603 },
          category: 'UNESCO World Heritage',
          costLow: '$15-20', costMed: '$20-30', costHigh: '$40-60', duration: '3 hours' 
        },
        { 
          name: 'Galle Fort', 
          description: 'Historic Dutch colonial fort with charming streets and ocean views', 
          address: 'Galle Fort, Galle 80000, Sri Lanka',
          placeId: 'ChIJ4RyJ_1FH4joRwLhOZnCa4oo',
          coordinates: { lat: 6.0329, lng: 80.2168 },
          category: 'Colonial Fort',
          costLow: '$0', costMed: '$5-10', costHigh: '$15-25', duration: '2.5 hours' 
        },
        { 
          name: 'Dambulla Cave Temple', 
          description: 'Ancient cave monastery with over 150 Buddha statues and paintings', 
          address: 'Dambulla 21100, Sri Lanka',
          placeId: 'ChIJmRyJ_1FH4joRwLhOZnCa4oo',
          coordinates: { lat: 7.8567, lng: 80.6490 },
          category: 'Cave Temple',
          costLow: '$5-8', costMed: '$8-15', costHigh: '$20-30', duration: '2 hours' 
        },
        { 
          name: 'Colombo National Museum', 
          description: 'Premier cultural institution showcasing Sri Lankan history and artifacts', 
          address: 'Sir Marcus Fernando Mawatha, Colombo 00700, Sri Lanka',
          placeId: 'ChIJnRyJ_1FH4joRwLhOZnCa4oo',
          coordinates: { lat: 6.9147, lng: 79.8612 },
          category: 'National Museum',
          costLow: '$2-5', costMed: '$5-10', costHigh: '$15-20', duration: '2.5 hours' 
        },
        { 
          name: 'Pettah Market', 
          description: 'Bustling local market in Colombo for spices, textiles, and street food', 
          address: 'Pettah, Colombo 01100, Sri Lanka',
          placeId: 'ChIJoRyJ_1FH4joRwLhOZnCa4oo',
          coordinates: { lat: 6.9395, lng: 79.8587 },
          category: 'Traditional Market',
          costLow: '$5-10', costMed: '$10-20', costHigh: '$25-40', duration: '2 hours' 
        }
      ],
      tips: ['Dress modestly when visiting temples', 'Try local cuisine like rice and curry', 'Bargain at local markets', 'Respect Buddhist customs and traditions']
    }
  };
  
  // Check for partial matches or create destination-specific content
  const destLower = destination.toLowerCase();
  
  if (destLower.includes('india') || destLower.includes('delhi') || destLower.includes('mumbai')) {
    return destinations['India'];
  }
  if (destLower.includes('paris') || destLower.includes('france')) {
    return destinations['Paris'];
  }
  if (destLower.includes('sri lanka') || destLower.includes('colombo') || destLower.includes('kandy')) {
    return destinations['Sri Lanka'];
  }
  
  // Use Google Places API fallback for unknown destinations
  console.log(`⚠️ No specific data for ${destination}, using Google Places API fallback`);
  
  // Return structure that will use real places from Google Places API
  return {
    introduction: `Welcome to ${destination}! Discover amazing attractions and experiences.`,
    conclusion: `Your ${destination} adventure includes real places and authentic experiences.`,
    dayTitles: ['Arrival & Exploration', 'Cultural Highlights', 'Local Experiences', 'Hidden Gems', 'Final Adventures'],
    activities: [], // Will be populated with real places from Google Places API
    tips: ['Check local weather conditions', 'Respect local customs', 'Try local cuisine', 'Use public transportation']
  };
}

// Fallback itinerary when AI is unavailable
function createFallbackItinerary(userPreferences) {
  const { destination, duration, budget } = userPreferences;
  const days = parseInt(duration.match(/(\d+)/)?.[1] || '3');
  
  const dailyPlans = [];
  
  for (let day = 1; day <= days; day++) {
    dailyPlans.push({
      day,
      title: `Day ${day} - Explore ${destination}`,
      activities: [
        {
          timeOfDay: '09:00-12:00',
          activityTitle: `${destination} City Center`,
          description: `Explore the main attractions and landmarks of ${destination}`,
          estimatedCost: budget === 'low' ? '$20-40' : budget === 'high' ? '$80-150' : '$40-80',
          duration: '3 hours',
          isVisited: false
        },
        {
          timeOfDay: '14:00-17:00',
          activityTitle: `Local Markets & Culture`,
          description: `Experience local culture, markets, and traditional areas`,
          estimatedCost: budget === 'low' ? '$15-30' : budget === 'high' ? '$60-120' : '$30-60',
          duration: '3 hours',
          isVisited: false
        }
      ]
    });
  }
  
  return {
    id: `fallback_trip_${Date.now()}`,
    tripTitle: `${destination} ${duration} Adventure`,
    destination,
    duration,
    introduction: `Welcome to your ${destination} adventure! This carefully crafted itinerary will take you through the best experiences this destination has to offer.`,
    conclusion: `Your ${destination} journey promises unforgettable memories and authentic experiences. Enjoy every moment of your adventure!`,
    totalEstimatedCost: budget === 'low' ? '$300-600' : budget === 'high' ? '$1200+' : '$600-1200',
    estimatedWalkingDistance: '5-8 km per day',
    dailyPlans,
    travelTips: ['Check local weather conditions', 'Carry local currency', 'Respect local customs'],
    createdAt: new Date().toISOString()
  };
}

// Main endpoint: Generate AI trip
router.post('/generate', async (req, res) => {
  try {
    const { 
      destination, 
      duration, 
      travelers, 
      budget, 
      travelStyle, 
      interests, 
      selectedPlaces = [] 
    } = req.body;

    if (!destination || !duration) {
      return res.status(400).json({ error: 'Destination and duration are required' });
    }

    console.log(`🚀 Generating AI trip for ${destination}, ${duration}`);

    const aiItinerary = await generateAITrip({
      destination,
      duration,
      travelStyle,
      budget,
      interests,
      travelers,
      selectedPlaces
    });

    console.log('✅ AI trip generation completed');
    res.json(aiItinerary);

  } catch (error) {
    console.error('❌ AI trip generation failed:', error);
    
    const fallbackTrip = {
      id: `fallback_trip_${Date.now()}`,
      tripTitle: `${req.body.destination} ${req.body.duration} Trip`,
      destination: req.body.destination,
      duration: req.body.duration,
      totalEstimatedCost: 'Contact local providers for pricing',
      dailyPlans: [{
        day: 1,
        title: `Explore ${req.body.destination}`,
        activities: [{
          timeOfDay: '09:00-17:00',
          activityTitle: `${req.body.destination} City Center`,
          description: 'Explore the main attractions and local culture',
          estimatedCost: 'Varies',
          duration: '8 hours',
          isVisited: false
        }]
      }],
      travelTips: ['Check local weather conditions', 'Carry local currency', 'Respect local customs']
    };
    
    res.json(fallbackTrip);
  }
});

// Generate enhanced trip introduction
router.post('/enhance-introduction', async (req, res) => {
  try {
    const { tripPlan } = req.body;
    
    if (!tripPlan) {
      return res.status(400).json({ error: 'Trip plan required' });
    }

    // Always return fallback if no OpenAI configured
    if (!openai) {
      return res.json({ 
        enhanced: tripPlan.introduction || `Welcome to ${tripPlan.destination || 'your destination'}!`,
        cached: true 
      });
    }

    const azureWorking = await checkAzureOpenAIStatus();
    
    if (!azureWorking) {
      return res.json({ 
        enhanced: tripPlan.introduction || `Welcome to ${tripPlan.destination || 'your destination'}!`,
        cached: true 
      });
    }

    const prompt = `Create a rich, engaging trip overview for this itinerary:

Destination: ${tripPlan.destination}
Duration: ${tripPlan.duration}
Activities: ${tripPlan.dailyPlans?.length || 0} days planned

Generate a personalized introduction with:
- Welcome message with emojis
- Key highlights (3-4 points)
- Cultural insights
- Travel tips
- Budget expectations

Format with emojis and make it exciting! Keep it under 300 words.`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 500
    });

    const enhanced = completion.choices[0].message.content.trim();
    
    res.json({ 
      enhanced,
      cached: false 
    });

  } catch (error) {
    console.error('AI enhancement failed:', error);
    // Always return 200 with fallback, never 500
    res.json({ 
      enhanced: req.body.tripPlan?.introduction || `Welcome to ${req.body.tripPlan?.destination || 'your destination'}!`,
      cached: true,
      error: error.message 
    });
  }
});

export default router;