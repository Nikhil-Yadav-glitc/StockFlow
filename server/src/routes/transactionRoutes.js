import express from 'express';
import {
  stockIn,
  stockOut,
  adjustStock,
  getTransactions,
  getTransactionById
} from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getTransactions);
router.get('/:id', protect, getTransactionById);
router.post('/stock-in', protect, stockIn);
router.post('/stock-out', protect, stockOut);
router.post('/adjust', protect, authorize('admin', 'manager'), adjustStock);

export default router;

