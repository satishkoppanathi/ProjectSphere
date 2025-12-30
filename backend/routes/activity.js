import express from 'express';
import GuestActivity from '../models/GuestActivity.js';

const router = express.Router();

// @route   POST /api/activity/log
// @desc    Log guest activity
// @access  Public
router.post('/log', async (req, res) => {
    try {
        const { action, details } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        await GuestActivity.create({
            action,
            details,
            ipAddress,
            userAgent
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Activity logging failed:', error);
        // Don't fail the request significantly if logging fails, just return proper status
        res.status(500).json({ success: false, message: 'Logging failed' });
    }
});

// @route   GET /api/activity/logs
// @desc    Get all guest activities (Admin use mostly, but making public for now as per "save" request context)
// @access  Public (for now)
router.get('/logs', async (req, res) => {
    try {
        const logs = await GuestActivity.find().sort({ timestamp: -1 }).limit(100);
        res.json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
