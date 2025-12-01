import express from 'express';
import mongoose from 'mongoose';
import { bypassAuth } from '../middleware/auth.js';

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

// Get all events with filters
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

// Get single event
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

// Create event
router.post('/', bypassAuth, async (req, res) => {
  try {
    const Event = getEvent();
    const User = getUser();
    if (!Event || !User) return res.status(500).json({ error: 'Models not available' });

    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const eventData = {
      ...req.body,
      organizerId: user._id,
      organizerName: user.fullName || user.username,
      isFree: req.body.price === 0
    };

    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', bypassAuth, async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const event = await Event.findOne({ _id: req.params.id, organizerId: userId });
    if (!event) return res.status(404).json({ error: 'Event not found or unauthorized' });

    Object.assign(event, req.body);
    event.isFree = event.price === 0;
    await event.save();
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', bypassAuth, async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const event = await Event.findOneAndDelete({ _id: req.params.id, organizerId: userId });
    if (!event) return res.status(404).json({ error: 'Event not found or unauthorized' });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite
router.post('/:id/favorite', bypassAuth, async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const isFavorited = event.favorites.includes(userId);
    if (isFavorited) {
      event.favorites = event.favorites.filter(id => id.toString() !== userId);
    } else {
      event.favorites.push(userId);
    }
    
    await event.save();
    res.json({ favorited: !isFavorited });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book event
router.post('/:id/book', bypassAuth, async (req, res) => {
  try {
    const Event = getEvent();
    if (!Event) return res.status(500).json({ error: 'Event model not available' });

    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.capacity && event.attendees >= event.capacity) {
      return res.status(400).json({ error: 'Event is fully booked' });
    }

    event.attendees += 1;
    await event.save();
    
    res.json({ success: true, booking: { eventId: event._id, userId, bookedAt: new Date() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
