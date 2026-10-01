import Product from '../models/Product.js';
import StockTransaction from '../models/StockTransaction.js';
import Category from '../models/Category.js';

// @desc    Get low stock and out-of-stock items
// @route   GET /api/reports/low-stock
// @access  Private
export const getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({
      $or: [
        { status: 'LOW STOCK' },
        { status: 'OUT OF STOCK' }
      ]
    })
      .populate('category', 'categoryName name')
      .populate('supplier', 'supplierName name email phone contact')
      .sort({ quantity: 1, productName: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory summary and valuation report
// @route   GET /api/reports/valuation
// @access  Private
export const getValuationReport = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'categoryName name')
      .populate('supplier', 'supplierName name')
      .sort({ productName: 1 });

    const categoryBreakdown = {};
    let grandTotalCost = 0;
    let grandTotalRetail = 0;
    let grandTotalUnits = 0;

    products.forEach(prod => {
      const catName = prod.category?.categoryName || prod.category?.name || 'Uncategorized';
      const costVal = prod.quantity * (prod.costPrice || 0);
      const retailVal = prod.quantity * (prod.price || 0);

      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = {
          category: catName,
          itemsCount: 0,
          totalUnits: 0,
          totalCostValue: 0,
          totalRetailValue: 0
        };
      }

      categoryBreakdown[catName].itemsCount += 1;
      categoryBreakdown[catName].totalUnits += prod.quantity;
      categoryBreakdown[catName].totalCostValue += costVal;
      categoryBreakdown[catName].totalRetailValue += retailVal;

      grandTotalCost += costVal;
      grandTotalRetail += retailVal;
      grandTotalUnits += prod.quantity;
    });

    // Stock-In vs Stock-Out summary
    const stockInTotal = await StockTransaction.aggregate([
      { $match: { transactionType: { $in: ['IN', 'STOCK_IN'] } } },
      { $group: { _id: null, totalUnits: { $sum: '$quantity' }, totalTransactions: { $sum: 1 } } }
    ]);

    const stockOutTotal = await StockTransaction.aggregate([
      { $match: { transactionType: { $in: ['OUT', 'STOCK_OUT'] } } },
      { $group: { _id: null, totalUnits: { $sum: '$quantity' }, totalTransactions: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalUnits: grandTotalUnits,
        totalCostValue: grandTotalCost,
        totalRetailValue: grandTotalRetail,
        potentialProfit: grandTotalRetail - grandTotalCost,
        stockIn: {
          totalUnits: stockInTotal[0]?.totalUnits || 0,
          transactions: stockInTotal[0]?.totalTransactions || 0
        },
        stockOut: {
          totalUnits: stockOutTotal[0]?.totalUnits || 0,
          transactions: stockOutTotal[0]?.totalTransactions || 0
        }
      },
      byCategory: Object.values(categoryBreakdown),
      products: products.map(p => ({
        _id: p._id,
        sku: p.sku,
        name: p.productName,
        productName: p.productName,
        category: p.category?.categoryName || p.category?.name || 'N/A',
        supplier: p.supplier?.supplierName || p.supplier?.name || 'N/A',
        quantity: p.quantity,
        unitOfMeasure: p.unitOfMeasure,
        costPrice: p.costPrice || 0,
        price: p.price,
        totalCostValue: p.quantity * (p.costPrice || 0),
        totalRetailValue: p.quantity * p.price,
        minimumStock: p.minimumStock,
        status: p.status
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export products as CSV
// @route   GET /api/reports/export/products
// @access  Private
export const exportProductsCSV = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'categoryName name')
      .populate('supplier', 'supplierName name')
      .sort({ sku: 1 });

    const headers = ['SKU', 'Product Name', 'Category', 'Supplier', 'Cost Price', 'Selling Price', 'Quantity', 'Unit', 'Minimum Stock', 'Status'];
    const rows = products.map(p => [
      `"${p.sku}"`,
      `"${p.productName.replace(/"/g, '""')}"`,
      `"${(p.category?.categoryName || p.category?.name || '').replace(/"/g, '""')}"`,
      `"${(p.supplier?.supplierName || p.supplier?.name || '').replace(/"/g, '""')}"`,
      (p.costPrice || 0).toFixed(2),
      p.price.toFixed(2),
      p.quantity,
      `"${p.unitOfMeasure}"`,
      p.minimumStock,
      `"${p.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="stockflow-products-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export transactions audit trail as CSV
// @route   GET /api/reports/export/transactions
// @access  Private
export const exportTransactionsCSV = async (req, res, next) => {
  try {
    const transactions = await StockTransaction.find()
      .populate('product', 'sku productName name unitOfMeasure')
      .populate('supplier', 'supplierName name')
      .populate('performedBy', 'name email role')
      .sort({ transactionDate: -1 })
      .limit(1000);

    const headers = ['Transaction ID', 'Date', 'Type', 'Product SKU', 'Product Name', 'Quantity', 'Previous Stock', 'New Stock', 'Supplier', 'Reference', 'Reason', 'Performed By'];
    const rows = transactions.map(t => [
      `"${t.transactionId}"`,
      `"${new Date(t.transactionDate).toISOString()}"`,
      `"${t.transactionType}"`,
      `"${t.product?.sku || 'N/A'}"`,
      `"${(t.product?.productName || t.product?.name || 'N/A').replace(/"/g, '""')}"`,
      t.quantity,
      t.previousStock,
      t.newStock,
      `"${(t.supplier?.supplierName || t.supplier?.name || '').replace(/"/g, '""')}"`,
      `"${(t.referenceNumber || '').replace(/"/g, '""')}"`,
      `"${(t.reason || '').replace(/"/g, '""')}"`,
      `"${(t.performedBy?.name || 'N/A').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="stockflow-transactions-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
