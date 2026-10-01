import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';
import StockTransaction from '../models/StockTransaction.js';

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();

    // Low stock items: quantity <= minimumStock AND quantity > 0
    const lowStockCount = await Product.countDocuments({
      status: 'LOW STOCK'
    });

    // Out of stock items: quantity == 0
    const outOfStockCount = await Product.countDocuments({
      status: 'OUT OF STOCK'
    });

    // Total physical stock units & valuation
    const valuation = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalStockUnits: { $sum: '$quantity' },
          totalCostValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$costPrice', 0] }] } },
          totalRetailValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      }
    ]);

    const totalStockUnits = valuation[0]?.totalStockUnits || 0;
    const totalCostValue = valuation[0]?.totalCostValue || 0;
    const totalRetailValue = valuation[0]?.totalRetailValue || 0;

    // Movement summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stockInSummary = await StockTransaction.aggregate([
      { $match: { transactionType: { $in: ['IN', 'STOCK_IN'] }, transactionDate: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalUnits: { $sum: '$quantity' }, count: { $sum: 1 } } }
    ]);

    const stockOutSummary = await StockTransaction.aggregate([
      { $match: { transactionType: { $in: ['OUT', 'STOCK_OUT'] }, transactionDate: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, totalUnits: { $sum: '$quantity' }, count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalStock: totalStockUnits,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
        totalCategories,
        totalSuppliers,
        totalCostValue,
        totalRetailValue,
        recentMovement: {
          stockInUnits: stockInSummary[0]?.totalUnits || 0,
          stockInTransactions: stockInSummary[0]?.count || 0,
          stockOutUnits: stockOutSummary[0]?.totalUnits || 0,
          stockOutTransactions: stockOutSummary[0]?.count || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock movement trends for charts (last 14 days)
// @route   GET /api/dashboard/trends
// @access  Private
export const getTrends = async (req, res, next) => {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTransactions = await StockTransaction.aggregate([
      { $match: { transactionDate: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } },
            type: '$transactionType'
          },
          totalUnits: { $sum: '$quantity' }
        }
      }
    ]);

    const trendMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trendMap[key] = { date: key, stockIn: 0, stockOut: 0 };
    }

    dailyTransactions.forEach(item => {
      const date = item._id.date;
      if (trendMap[date]) {
        if (item._id.type === 'IN' || item._id.type === 'STOCK_IN') {
          trendMap[date].stockIn += item.totalUnits;
        } else if (item._id.type === 'OUT' || item._id.type === 'STOCK_OUT') {
          trendMap[date].stockOut += item.totalUnits;
        }
      }
    });

    res.status(200).json({
      success: true,
      trends: Object.values(trendMap)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent transactions
// @route   GET /api/dashboard/recent
// @access  Private
export const getRecentActivity = async (req, res, next) => {
  try {
    const recent = await StockTransaction.find()
      .populate('product', 'productName name sku unitOfMeasure')
      .populate('performedBy', 'name email role')
      .populate('supplier', 'supplierName name')
      .sort({ transactionDate: -1 })
      .limit(8);

    res.status(200).json({
      success: true,
      recent
    });
  } catch (error) {
    next(error);
  }
};
