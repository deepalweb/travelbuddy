import express from 'express';
import ContactMessage from '../models/ContactMessage.js';

const router = express.Router();

// Submit contact form
router.post('/submit', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Basic validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const contactMessage = new ContactMessage({
            name,
            email,
            subject,
            message
        });

        await contactMessage.save();

        // TODO: Send email notification to admin
        // TODO: Send confirmation email to user

        res.json({
            success: true,
            message: 'Thank you for contacting us. We will get back to you soon.'
        });

    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit contact form',
            error: error.message
        });
    }
});

// Admin: Get all contact messages
router.get('/admin/messages', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const messages = await ContactMessage.find(filter)
            .sort({ submittedAt: -1 })
            .lean();

        res.json(messages);

    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Update message status
router.put('/admin/messages/:id', async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const message = await ContactMessage.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        if (status) message.status = status;
        if (adminNotes !== undefined) message.adminNotes = adminNotes;
        if (status === 'replied') message.repliedAt = new Date();

        await message.save();

        res.json({ success: true, message: 'Message updated successfully' });

    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
