import express from 'express';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Get services for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const services = await Service.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new service
router.post('/', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update service
router.put('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update service status (pause/activate)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const service = await Service.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete service
router.delete('/:id', async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;