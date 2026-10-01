import express from 'express';
import { getStats, getTrends, getRecentActivity } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, getStats);
router.get('/trends', protect, getTrends);
router.get('/recent', protect, getRecentActivity);

export default router;

