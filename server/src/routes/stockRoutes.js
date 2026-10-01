import express from 'express';
import { stockIn, stockOut, adjustStock } from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/in', protect, stockIn);
router.post('/out', protect, stockOut);
router.post('/adjust', protect, authorize('admin'), adjustStock);

export default router;

