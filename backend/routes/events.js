import express from 'express';
import mongoose from 'mongoose';
import { requireAuth, optionalAuth, requireOwnership } from '../middleware/auth.js';

const router = express.Router();

const getEvent = () => {
  try {
    return mongoose.model('Event');
  } catch (e) {
    return null;
  }
};

const getUser = () => {
  try {
    return mongoose.model('User');
  } catch (e) {
    return null;
  }
};

// Get all events with filters (public)
router.get('/', async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const { category, search, minPrice, maxPrice, minRating, city, startDate, endDate, sort } = req.query;
    
    const query = { status: 'published' };
    
    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.country': { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    let sortOption = { date: 1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'popular') sortOption = { attendees: -1 };

    const events = await Event.find(query).sort(sortOption).limit(100);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single event (public)
router.get('/:id', async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event (requires auth)
router.post('/', requireAuth, async (req, res) => {
  try {
    const Event = getEvent();
    const User = getUser();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    // Get user from Firebase auth
    let organizerId = req.user.uid;
    let organizerName = req.user.email?.split('@')[0] || 'User';

    // Try to get full user details from database
    if (User) {
      const user = await User.findOne({ firebaseUid: req.user.uid }).catch(() => null);
      if (user) {
        organizerId = user._id;
        organizerName = user.username || user.fullName || organizerName;
      }
    }

    const eventData = {
      ...req.body,
      organizerId,
      organizerName,
      isFree: req.body.price === 0,
      status: 'published',
      attendees: 0,
      rating: 0
    };

    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update event (requires auth + ownership)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check ownership
    if (event.organizerId.toString() !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(event, req.body);
    event.isFree = event.price === 0;
    await event.save();
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event (requires auth + ownership)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check ownership
    if (event.organizerId.toString() !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await event.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite (requires auth)
router.post('/:id/favorite', requireAuth, async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isFavorited = event.favorites.includes(req.user.uid);
    if (isFavorited) {
      event.favorites = event.favorites.filter(id => id.toString() !== req.user.uid);
    } else {
      event.favorites.push(req.user.uid);
    }
    
    await event.save();
    res.json({ favorited: !isFavorited });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book event (requires auth)
router.post('/:id/book', requireAuth, async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.capacity && event.attendees >= event.capacity) {
      return res.status(400).json({ error: 'Event is fully booked' });
    }

    event.attendees += 1;
    await event.save();
    
    res.json({ success: true, booking: { eventId: event._id, userId: req.user.uid, bookedAt: new Date() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
