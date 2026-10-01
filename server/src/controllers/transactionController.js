import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';

const generateTxnNumber = async (prefix = 'TXN') => {
  const count = await StockTransaction.countDocuments();
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `${prefix}-${dateStr}-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Record Stock-In (Increase stock & create IN transaction)
// @route   POST /api/stock/in OR /api/transactions/stock-in
// @access  Private (Admin or Inventory Staff)
export const stockIn = async (req, res, next) => {
  try {
    const { productId, quantity, supplierId, referenceNumber, reason, notes } = req.body;

    const qty = Number(quantity);
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product is required.' });
    }
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than zero.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousStock = product.quantity;
    const newStock = previousStock + qty;

    // Update product quantity and status
    product.quantity = newStock;
    await product.save();

    const txnNumber = await generateTxnNumber('IN');

    const transaction = await StockTransaction.create({
      transactionId: txnNumber,
      product: product._id,
      transactionType: 'IN',
      quantity: qty,
      previousStock,
      newStock,
      supplier: supplierId || product.supplier,
      referenceNumber: referenceNumber || 'N/A',
      reason: reason || 'Vendor Purchase Restock',
      performedBy: req.user._id,
      notes: notes || '',
      transactionDate: new Date()
    });

    const populated = await StockTransaction.findById(transaction._id)
      .populate('product', 'productName name sku unitOfMeasure quantity price minimumStock')
      .populate('supplier', 'supplierName name')
      .populate('performedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: `Stock-In successful: Added ${qty} ${product.unitOfMeasure} to ${product.productName}`,
      transaction: populated,
      product: {
        _id: product._id,
        productName: product.productName,
        name: product.productName,
        sku: product.sku,
        quantity: product.quantity,
        minimumStock: product.minimumStock,
        status: product.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Stock-Out (Decrease stock & create OUT transaction)
// @route   POST /api/stock/out OR /api/transactions/stock-out
// @access  Private (Admin or Inventory Staff)
export const stockOut = async (req, res, next) => {
  try {
    const { productId, quantity, referenceNumber, reason, notes } = req.body;

    const qty = Number(quantity);
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product is required.' });
    }
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than zero.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Strict validation preventing negative stock
    if (product.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available.'
      });
    }

    const previousStock = product.quantity;
    const newStock = previousStock - qty;

    product.quantity = newStock;
    await product.save();

    const txnNumber = await generateTxnNumber('OUT');

    const transaction = await StockTransaction.create({
      transactionId: txnNumber,
      product: product._id,
      transactionType: 'OUT',
      quantity: qty,
      previousStock,
      newStock,
      referenceNumber: referenceNumber || 'N/A',
      reason: reason || 'Order Dispatch',
      performedBy: req.user._id,
      notes: notes || '',
      transactionDate: new Date()
    });

    const populated = await StockTransaction.findById(transaction._id)
      .populate('product', 'productName name sku unitOfMeasure quantity price minimumStock')
      .populate('performedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: `Stock-Out successful: Deducted ${qty} ${product.unitOfMeasure} from ${product.productName}`,
      transaction: populated,
      product: {
        _id: product._id,
        productName: product.productName,
        name: product.productName,
        sku: product.sku,
        quantity: product.quantity,
        minimumStock: product.minimumStock,
        status: product.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record Stock Adjustment (Admin audit reconciliation)
// @route   POST /api/stock/adjust OR /api/transactions/adjust
// @access  Private (Admin only)
export const adjustStock = async (req, res, next) => {
  try {
    const { productId, newQuantity, reason, notes } = req.body;

    const targetQty = Number(newQuantity);
    if (!productId || isNaN(targetQty) || targetQty < 0) {
      return res.status(400).json({ success: false, message: 'Valid product and non-negative target quantity are required.' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'A reason is mandatory for stock adjustment audits.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const previousStock = product.quantity;
    const diff = targetQty - previousStock;

    if (diff === 0) {
      return res.status(400).json({ success: false, message: 'New quantity is identical to current stock. No adjustment needed.' });
    }

    product.quantity = targetQty;
    await product.save();

    const txnNumber = await generateTxnNumber('ADJ');

    const transaction = await StockTransaction.create({
      transactionId: txnNumber,
      product: product._id,
      transactionType: diff > 0 ? 'IN' : 'OUT',
      quantity: Math.abs(diff),
      previousStock,
      newStock: targetQty,
      referenceNumber: `AUDIT: ${diff > 0 ? '+' : ''}${diff}`,
      reason: `Audit Adjustment: ${reason}`,
      performedBy: req.user._id,
      notes: notes || '',
      transactionDate: new Date()
    });

    const populated = await StockTransaction.findById(transaction._id)
      .populate('product', 'productName name sku unitOfMeasure quantity')
      .populate('performedBy', 'name email role');

    res.status(201).json({
      success: true,
      message: `Stock adjusted for ${product.productName} from ${previousStock} to ${targetQty}`,
      transaction: populated,
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions with filtering and pagination
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res, next) => {
  try {
    const { type, product, startDate, endDate, search, page = 1, limit = 50 } = req.query;

    const query = {};

    if (type) {
      // Support both 'IN'/'OUT' and 'STOCK_IN'/'STOCK_OUT'
      if (type === 'IN' || type === 'STOCK_IN') {
        query.transactionType = { $in: ['IN', 'STOCK_IN'] };
      } else if (type === 'OUT' || type === 'STOCK_OUT') {
        query.transactionType = { $in: ['OUT', 'STOCK_OUT'] };
      } else {
        query.transactionType = type;
      }
    }

    if (product) {
      query.product = product;
    }

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await StockTransaction.countDocuments(query);
    const transactions = await StockTransaction.find(query)
      .populate('product', 'productName name sku unitOfMeasure')
      .populate('supplier', 'supplierName name')
      .populate('performedBy', 'name email role')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await StockTransaction.findById(req.params.id)
      .populate('product', 'productName name sku barcode price costPrice unitOfMeasure quantity minimumStock')
      .populate('supplier', 'supplierName name contact email phone address')
      .populate('performedBy', 'name email role');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    next(error);
  }
};
