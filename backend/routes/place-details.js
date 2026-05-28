import express from 'express';
import fetch from 'node-fetch';
import { resolveFreePlaceImage } from '../services/freePlaceImageService.js';

const router = express.Router();

function buildHighlights(category, name, city) {
  return [
    `${name} is a useful stop to anchor a ${city || 'local'} itinerary.`,
    `Works well as a ${category || 'travel'} pick when comparing pace and route flow.`,
    'Confirm opening hours and on-the-ground details before locking plans in.',
  ];
}

function buildGallery(primaryImage) {
  return primaryImage ? [primaryImage] : [];
}

function buildFreeDetailsPayload({ id, name, category, location, imageResult }) {
  const city = location?.city || 'Unknown city';
  const country = location?.country || 'Unknown country';
  const address = location?.address || `${city}, ${country}`;

  return {
    success: true,
    place: {
      id,
      name,
      description: {
        short: `${name} is a ${category || 'travel'} option in ${city}.`,
        full: `${name} is a ${category || 'travel'} option in ${city}, ${country}. This detail view uses a free image pipeline, so the image may be representative rather than an exact live photo of the place. Use it to compare stops and shape the trip, then confirm time-sensitive details before booking or visiting.`,
        highlights: buildHighlights(category, name, city),
      },
      images: {
        hero: imageResult.image,
        gallery: buildGallery(imageResult.image),
        count: buildGallery(imageResult.image).length,
        source: imageResult.imageSource,
      },
      rating: {
        overall: 4.2,
        count: 0,
      },
      category: category || 'attraction',
      priceLevel: '$$',
      pricing: {
        currency: 'USD',
        tickets: [],
      },
      location: {
        address,
        city,
        country,
        coordinates: location?.coordinates || { lat: 0, lng: 0 },
      },
      hours: {
        schedule: {},
        isOpen: true,
        nextClose: 'Hours vary',
      },
      contact: {
        phone: '',
        email: '',
        website: '',
      },
      tips: [
        imageResult.isRepresentative
          ? 'This image is representative, so treat it as inspiration rather than a verified place photo.'
          : 'This image was resolved from a free public knowledge source.',
      ],
      tags: [category || 'attraction', city.toLowerCase()],
      similarPlaces: [],
    },
  };
}

router.get('/details', async (req, res) => {
  try {
    const { place_id } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!place_id) {
      return res.status(400).json({ error: 'place_id is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,rating,formatted_phone_number,opening_hours,photos,user_ratings_total,formatted_address,geometry&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      res.json(data.result);
    } else {
      res.status(404).json({ error: 'Place not found', status: data.status });
    }
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/photo', async (req, res) => {
  try {
    const { ref, w = 800 } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!ref) {
      return res.status(400).json({ error: 'ref (photo_reference) is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${w}&photo_reference=${ref}&key=${apiKey}`;

    const response = await fetch(photoUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch photo' });
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    response.body.pipe(res);
  } catch (error) {
    console.error('Photo fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const { name = 'Place', location = '', category = 'attraction' } = req.query;
    const [city = '', country = ''] = String(location)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    const imageResult = await resolveFreePlaceImage({
      name: String(name),
      category: String(category),
      city,
      country,
    });

    res.json(
      buildFreeDetailsPayload({
        id: placeId,
        name: String(name),
        category: String(category),
        location: {
          address: String(location),
          city,
          country,
        },
        imageResult,
      })
    );
  } catch (error) {
    console.error('Free place detail fallback error:', error);
    res.status(500).json({ error: 'Failed to build place details', details: error.message });
  }
});

export default router;
