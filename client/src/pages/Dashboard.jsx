import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StockStatusBadge, TxnTypeBadge } from '../components/Badge';
import {
  Package,
  Boxes,
  AlertTriangle,
  PackageX,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  DollarSign,
  Plus,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const Dashboard = () => {
  const { isAdmin } = useAuth();

  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendsRes, recentRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getTrends(),
        dashboardAPI.getRecent()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (trendsRes.success) setTrends(trendsRes.trends);
      if (recentRes.success) setRecent(recentRes.recent);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data from MongoDB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-9 h-9 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-slate-500">Querying real-time database metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h2>
          <p className="text-sm text-slate-500">
            Real-time MongoDB inventory statistics, movement analytics, and stock health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/stock-in"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-xs"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Record Stock In
          </Link>
          <Link
            to="/stock-out"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition shadow-xs"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Record Stock Out
          </Link>
          {isAdmin && (
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {error}
        </div>
      )}

      {/* 4 Primary Statistics Cards Required by Master Prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.totalProducts ?? 0}</span>
            <span className="text-xs text-slate-500 font-medium">SKUs in catalog</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Across {stats?.totalCategories ?? 0} categories
          </div>
        </div>

        {/* 2. Total Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {Number(stats?.totalStock ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">units on hand</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Asset value: ${(stats?.totalCostValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* 3. Low Stock Items */}
        <Link
          to="/low-stock"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Items</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              (stats?.lowStockItems ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${
              (stats?.lowStockItems ?? 0) > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {stats?.lowStockItems ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">below threshold</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium group-hover:underline flex items-center gap-1">
            Review reorder list →
          </div>
        </Link>

        {/* 4. Out of Stock Items */}
        <Link
          to="/low-stock"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock Items</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              (stats?.outOfStockItems ?? 0) > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
            }`}>
              <PackageX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${
              (stats?.outOfStockItems ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {stats?.outOfStockItems ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">zero balance</span>
          </div>
          <div className="mt-2 text-xs text-rose-600 font-medium group-hover:underline flex items-center gap-1">
            Replenishment required →
          </div>
        </Link>
      </div>

      {/* Stock Movement Overview & Daily Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Stock Movement Trends</h3>
              <p className="text-xs text-slate-500">Daily Stock-In intake vs. Stock-Out dispatches (Past 14 Days)</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Stock-In
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> Stock-Out
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="stockIn" fill="#10b981" radius={[4, 4, 0, 0]} name="Stock-In" />
                <Bar dataKey="stockOut" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Stock-Out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30-Day Movement Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Inventory Flow (30 Days)</h3>
            <p className="text-xs text-slate-500 mb-6">Aggregated inbound & outbound volume</p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ArrowDownCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-950">Total Stock-In</p>
                    <p className="text-[11px] text-emerald-700">{stats?.recentMovement?.stockInTransactions ?? 0} shipments received</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-700">
                  +{stats?.recentMovement?.stockInUnits ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <ArrowUpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-950">Total Stock-Out</p>
                    <p className="text-[11px] text-blue-700">{stats?.recentMovement?.stockOutTransactions ?? 0} dispatches completed</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-blue-700">
                  -{stats?.recentMovement?.stockOutUnits ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <Link
              to="/reports"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              Open Comprehensive Valuation Reports →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-800">Recent Transactions</h3>
          </div>
          <Link to="/transactions" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            View All Transactions →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Product Name & SKU</th>
                <th className="px-6 py-3 text-right">Quantity</th>
                <th className="px-6 py-3">Reason / Reference</th>
                <th className="px-6 py-3">Performed By</th>
                <th className="px-6 py-3 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400 text-xs">
                    No transactions recorded yet in MongoDB.
                  </td>
                </tr>
              ) : (
                recent.map((txn) => {
                  const isPositive = txn.transactionType === 'IN' || txn.transactionType === 'STOCK_IN';
                  return (
                    <tr key={txn._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-700 font-semibold">
                        {txn.transactionId || txn.transactionNumber}
                      </td>
                      <td className="px-6 py-3.5">
                        <TxnTypeBadge type={txn.transactionType || txn.type} />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {txn.product?.productName || txn.product?.name || 'Unknown Product'}
                        </div>
                        <div className="text-xs font-mono text-slate-400">{txn.product?.sku}</div>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-800">
                        {isPositive ? `+${txn.quantity}` : `-${txn.quantity}`}{' '}
                        <span className="text-xs font-normal text-slate-400">{txn.product?.unitOfMeasure}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="text-slate-700 text-xs font-medium">{txn.reason}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{txn.referenceNumber}</div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        {txn.performedBy?.name || 'Admin'}
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs text-slate-400">
                        {new Date(txn.transactionDate || txn.timestamp).toLocaleDateString()}{' '}
                        {new Date(txn.transactionDate || txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
