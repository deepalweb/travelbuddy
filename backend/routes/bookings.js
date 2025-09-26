import express from 'express';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';

const router = express.Router();

// Get bookings for a provider
router.get('/provider/:userId', async (req, res) => {
  try {
    const { status } = req.query;
    const query = { providerId: req.params.userId };
    if (status && status !== 'all') query.status = status;
    
    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new booking
router.post('/', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    
    // Increment service booking count
    await Service.findByIdAndUpdate(booking.serviceId, { $inc: { bookings: 1 } });
    
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get provider metrics
router.get('/metrics/:userId', async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ providerId: req.params.userId });
    const activeBookings = await Booking.countDocuments({ 
      providerId: req.params.userId, 
      status: { $in: ['pending', 'confirmed'] }
    });
    const completedBookings = await Booking.countDocuments({ 
      providerId: req.params.userId, 
      status: 'completed'
    });
    
    const earnings = await Booking.aggregate([
      { $match: { providerId: req.params.userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      totalBookings,
      activeBookings,
      completedBookings,
      totalEarnings: earnings[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;