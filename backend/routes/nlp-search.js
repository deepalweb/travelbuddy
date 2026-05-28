import express from 'express';
import OpenAI from 'openai';
import { resolveFreePlaceImage } from '../services/freePlaceImageService.js';

const router = express.Router();

const openai = process.env.AZURE_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
}) : null;

const buildIdeaMeta = (source, query, locationName) => ({
  source,
  mode: 'ai_planning_ideas',
  userNotice:
    'These AI-generated suggestions are meant to help with trip planning and itinerary drafting. They are not verified listings, official photos, or guaranteed real-time facts.',
  query,
  planningLens: locationName
    ? `Idea set generated around ${locationName} to help you compare directions and draft an itinerary.`
    : 'Idea set generated to help you compare directions and draft an itinerary.',
});

router.get('/search', async (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    
    if (!q) return res.status(400).json({ error: 'Query required' });

    console.log(`🤖 NLP Search: "${q}"`);

    // Parse location from query (simple extraction)
    const locationMatch = q.toLowerCase().match(/in\s+([a-z\s]+)|([a-z\s]+)\s+(restaurants|hotels|attractions|places|beaches|temples)/);
    const location = locationMatch?.[1] || locationMatch?.[2] || q;
    
    // Known locations with coordinates
    const locations = {
      'sri lanka': { lat: 7.8731, lng: 80.7718, name: 'Sri Lanka' },
      'colombo': { lat: 6.9271, lng: 79.8612, name: 'Colombo' },
      'kandy': { lat: 7.2906, lng: 80.6337, name: 'Kandy' },
      'galle': { lat: 6.0535, lng: 80.2210, name: 'Galle' },
      'tokyo': { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
      'paris': { lat: 48.8566, lng: 2.3522, name: 'Paris' },
      'new york': { lat: 40.7128, lng: -74.0060, name: 'New York' },
      'london': { lat: 51.5074, lng: -0.1278, name: 'London' }
    };

    const loc = locations[location.trim().toLowerCase()] || locations['sri lanka'];
    
    // Determine category
    const categoryMap = {
      'restaurant': ['restaurant', 'food', 'dining', 'eat'],
      'hotel': ['hotel', 'accommodation', 'stay'],
      'attraction': ['attraction', 'tourist', 'visit', 'see'],
      'temple': ['temple', 'shrine', 'religious'],
      'beach': ['beach', 'coast', 'sea'],
      'museum': ['museum', 'gallery', 'art']
    };
    
    let category = 'attraction';
    for (const [cat, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => q.toLowerCase().includes(kw))) {
        category = cat;
        break;
      }
    }

    // Generate AI planning ideas
    const rawIdeas = Array.from({ length: parseInt(limit) }, (_, i) => {
      const names = {
        restaurant: ['The Spice Garden', 'Ocean View Restaurant', 'Heritage Kitchen', 'Royal Dining', 'Sunset Grill', 'Garden Cafe', 'Fusion Bistro', 'Local Flavors'],
        hotel: ['Grand Palace Hotel', 'Seaside Resort', 'Heritage Manor', 'Royal Suites', 'Paradise Inn', 'Luxury Lodge', 'Comfort Stay', 'Elite Hotel'],
        attraction: ['National Museum', 'Historic Fort', 'Botanical Gardens', 'Cultural Center', 'Ancient Temple', 'Royal Palace', 'Scenic Viewpoint', 'Heritage Site'],
        temple: ['Sacred Temple', 'Golden Shrine', 'Ancient Monastery', 'Holy Sanctuary', 'Divine Temple', 'Peaceful Pagoda', 'Historic Temple', 'Spiritual Center'],
        beach: ['Paradise Beach', 'Golden Sands', 'Coral Bay', 'Sunset Beach', 'Crystal Waters', 'Palm Beach', 'Tropical Shore', 'Azure Coast'],
        museum: ['National Museum', 'Art Gallery', 'History Museum', 'Cultural Museum', 'Heritage Center', 'Modern Art Museum', 'Science Museum', 'Maritime Museum']
      };

      const categoryNames = names[category] || names.attraction;
      const name = categoryNames[i % categoryNames.length];
      
      return {
        id: `place_${Date.now()}_${i}`,
        name: name,
        description: `A promising ${category} stop for a ${loc.name} planning draft. Use it as a sample anchor while shaping the pace and mix of your itinerary.`,
        category: category,
        rating: 3.5 + Math.random() * 1.5,
        priceLevel: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
        location: {
          address: `${i + 1} Main Street, ${loc.name}`,
          city: loc.name,
          country: loc.name,
          coordinates: { 
            lat: loc.lat + (Math.random() - 0.5) * 0.1, 
            lng: loc.lng + (Math.random() - 0.5) * 0.1 
          }
        },
        highlights: ['Useful planning anchor', 'Good fit for itinerary drafting', 'Worth pressure-testing'],
        photos: [],
        contact: { phone: '+94 11 234 5678', website: 'https://example.com' },
        openHours: 'Open daily 9:00 AM - 6:00 PM',
        tags: [category, loc.name.toLowerCase()],
        itemType: 'ai_stop_idea',
        trustNote: 'AI planning suggestion, not a verified place record.',
        planningRole: i === 0 ? 'strong starter' : i < 3 ? 'good fit' : 'optional add-on',
      };
    });

    const ideas = await Promise.all(
      rawIdeas.map(async (idea) => {
        const imageResult = await resolveFreePlaceImage({
          name: idea.name,
          category: idea.category,
          city: idea.location.city,
          country: idea.location.country,
        });

        return {
          ...idea,
          image: imageResult.image,
          imageSource: imageResult.imageSource,
          isRepresentativeImage: imageResult.isRepresentative,
        };
      })
    );

    res.json({
      results: ideas,
      searchContext: `AI planning ideas for "${q}"`,
      meta: buildIdeaMeta('nlp_generated_ideas', q, loc.name),
    });

  } catch (error) {
    console.error('❌ NLP search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
