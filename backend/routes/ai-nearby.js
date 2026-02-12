import express from 'express';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import axios from 'axios';

const router = express.Router();

const client = new OpenAIClient(
  process.env.AZURE_OPENAI_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_OPENAI_KEY)
);

// Function to search nearby places using Google Places API
async function searchNearbyPlaces(latitude, longitude, type) {
  try {
    const placeTypes = {
      'hospital': 'hospital',
      'police': 'police',
      'safe_place': 'lodging|police'
    };
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${latitude},${longitude}`,
        radius: 5000,
        type: placeTypes[type] || 'hospital',
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });
    
    if (response.data.results && response.data.results.length > 0) {
      const places = response.data.results.slice(0, 3).map(place => ({
        name: place.name,
        address: place.vicinity,
        rating: place.rating || 'N/A',
        distance: calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng)
      }));
      
      return places;
    }
    
    return [];
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
}

router.post('/find-nearby', async (req, res) => {
  try {
    const { latitude, longitude, type, query } = req.body;
    
    if (!latitude || !longitude || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const places = await searchNearbyPlaces(latitude, longitude, type);
    
    if (places.length === 0) {
      return res.json({ result: 'No nearby locations found. Try expanding search radius.' });
    }
    
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful emergency assistant. Format location information clearly and concisely for travelers in distress. Be calm and direct.'
      },
      {
        role: 'user',
        content: `${query}\n\nNearby locations:\n${places.map((p, i) => `${i+1}. ${p.name} - ${p.distance} away\n   Address: ${p.address}\n   Rating: ${p.rating}`).join('\n\n')}\n\nProvide the NEAREST location with distance in a single clear sentence.`
      }
    ];
    
    const result = await client.getChatCompletions(
      process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages,
      {
        maxTokens: 100,
        temperature: 0.3
      }
    );
    
    const aiResponse = result.choices[0]?.message?.content || places[0].name + ' - ' + places[0].distance;
    
    res.json({ 
      result: aiResponse,
      places: places
    });
    
  } catch (error) {
    console.error('Error in find-nearby:', error);
    res.status(500).json({ error: 'Failed to find nearby locations' });
  }
});

export default router;
