import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';

// @desc    Get all products with filtering, search and pagination
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res, next) => {
  try {
    const { search, category, supplier, status, page = 1, limit = 100, sort = 'name' } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (supplier) {
      query.supplier = supplier;
    }

    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'categoryName name')
      .populate('supplier', 'supplierName name email phone contact')
      .sort(sort === 'quantity' ? { quantity: -1 } : sort === 'status' ? { status: 1 } : { productName: 1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'categoryName name description')
      .populate('supplier', 'supplierName name contact email phone address');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const recentTransactions = await StockTransaction.find({ product: product._id })
      .populate('performedBy', 'name email role')
      .populate('supplier', 'supplierName name')
      .sort({ transactionDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      product,
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
export const createProduct = async (req, res, next) => {
  try {
    const {
      productName,
      name,
      sku,
      barcode,
      description,
      category,
      supplier,
      price,
      unitPrice,
      costPrice,
      quantity = 0,
      quantityInStock = 0,
      minimumStock = 10,
      reorderLevel = 10,
      unitOfMeasure = 'pcs'
    } = req.body;

    const title = productName || name;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    const itemSku = sku ? sku.toUpperCase().trim() : `SKU-${Date.now().toString().slice(-6)}`;
    const existingSku = await Product.findOne({ sku: itemSku });
    if (existingSku) {
      return res.status(400).json({ success: false, message: `SKU '${itemSku}' already exists.` });
    }

    const unitCost = Number(costPrice) || 0;
    const sellingPrice = Number(price !== undefined ? price : unitPrice);
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative price is required.' });
    }

    const initialQty = Number(quantity !== undefined ? quantity : quantityInStock) || 0;
    const minStock = Number(minimumStock !== undefined ? minimumStock : reorderLevel) || 10;

    const product = new Product({
      productName: title,
      sku: itemSku,
      barcode: barcode || '',
      description: description || '',
      category,
      supplier,
      price: sellingPrice,
      costPrice: unitCost,
      quantity: initialQty,
      minimumStock: minStock,
      unitOfMeasure
    });

    await product.save();

    // If initial stock > 0, log audit IN transaction
    if (initialQty > 0) {
      const count = await StockTransaction.countDocuments();
      const txnNumber = `IN-${Date.now().toString().slice(-6)}-${String(count + 1).padStart(4, '0')}`;

      await StockTransaction.create({
        transactionId: txnNumber,
        product: product._id,
        transactionType: 'IN',
        quantity: initialQty,
        previousStock: 0,
        newStock: initialQty,
        supplier,
        referenceNumber: 'INITIAL-STOCK',
        reason: 'Opening / Initial Stock',
        performedBy: req.user._id,
        notes: 'Initial inventory registration'
      });
    }

    const populated = await Product.findById(product._id)
      .populate('category', 'categoryName name')
      .populate('supplier', 'supplierName name');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details
// @route   PUT /api/products/:id
// @access  Private (Admin only)
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      productName,
      name,
      sku,
      barcode,
      description,
      category,
      supplier,
      price,
      unitPrice,
      costPrice,
      minimumStock,
      reorderLevel,
      unitOfMeasure
    } = req.body;

    const title = productName || name;
    if (title) product.productName = title;

    if (sku && sku.toUpperCase().trim() !== product.sku) {
      const duplicate = await Product.findOne({ sku: sku.toUpperCase().trim(), _id: { $ne: product._id } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `SKU '${sku}' already exists.` });
      }
      product.sku = sku.toUpperCase().trim();
    }

    if (barcode !== undefined) product.barcode = barcode;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (supplier) product.supplier = supplier;

    const newPrice = price !== undefined ? price : unitPrice;
    if (newPrice !== undefined) product.price = Number(newPrice);

    if (costPrice !== undefined) product.costPrice = Number(costPrice);

    const newMinStock = minimumStock !== undefined ? minimumStock : reorderLevel;
    if (newMinStock !== undefined) product.minimumStock = Number(newMinStock);

    if (unitOfMeasure !== undefined) product.unitOfMeasure = unitOfMeasure;

    await product.save();

    const populated = await Product.findById(product._id)
      .populate('category', 'categoryName name')
      .populate('supplier', 'supplierName name');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const txnCount = await StockTransaction.countDocuments({ product: product._id });
    if (txnCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product: it has ${txnCount} associated transaction record(s) in the audit ledger.`
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
