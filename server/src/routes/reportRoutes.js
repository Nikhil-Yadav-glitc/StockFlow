import express from 'express';
import {
  getLowStock,
  getValuationReport,
  exportProductsCSV,
  exportTransactionsCSV
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/low-stock', protect, getLowStock);
router.get('/valuation', protect, getValuationReport);
router.get('/export/products', protect, exportProductsCSV);
router.get('/export/transactions', protect, exportTransactionsCSV);

export default router;

