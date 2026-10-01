import React, { useState, useEffect } from 'react';
import { transactionsAPI, productsAPI, stockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TxnTypeBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  History,
  Search,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
  Shield
} from 'lucide-react';

export const Transactions = () => {
  const { isAdmin } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail Modal
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Adjustment Modal (Admin Only)
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustNewQty, setAdjustNewQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await transactionsAPI.getAll({
        type: typeFilter,
        search,
        product: selectedProduct,
        startDate,
        endDate
      });
      if (res.success) setTransactions(res.transactions);
    } catch (err) {
      setError(err.message || 'Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await productsAPI.getAll({ limit: 300 });
      if (res.success) setProducts(res.products);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 250);
    return () => clearTimeout(timer);
  }, [typeFilter, search, selectedProduct, startDate, endDate]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustProductId || adjustNewQty === '' || !adjustReason) {
      setError('Please select a product, enter target count, and provide a reconciliation reason.');
      return;
    }

    setAdjustLoading(true);
    setError('');
    try {
      await stockAPI.adjust({
        productId: adjustProductId,
        newQuantity: Number(adjustNewQty),
        reason: adjustReason,
        notes: adjustNotes
      });
      setSuccessMsg('Stock audit adjustment recorded successfully');
      setIsAdjustOpen(false);
      setAdjustProductId('');
      setAdjustNewQty('');
      setAdjustReason('');
      setAdjustNotes('');
      fetchTransactions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  const openDetails = (txn) => {
    setSelectedTxn(txn);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions History</h2>
          <p className="text-sm text-slate-500">
            Audit-grade record of all stock-in receipts, stock-out dispatches, and inventory movements
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAdjustOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4 text-purple-600" />
            Audit Count Adjustment
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search transaction ID or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-slate-700"
          >
            <option value="">All Transaction Types</option>
            <option value="IN">IN (Stock-In)</option>
            <option value="OUT">OUT (Stock-Out)</option>
          </select>

          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-slate-700"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>[{p.sku}] {p.productName || p.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3.5">Transaction ID</th>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5 text-right">Quantity</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Performed By</th>
                <th className="px-6 py-3.5 text-right">Date</th>
                <th className="px-4 py-3.5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading transaction records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isPositive = txn.transactionType === 'IN' || txn.transactionType === 'STOCK_IN';
                  return (
                    <tr key={txn._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-800">
                        {txn.transactionId || txn.transactionNumber}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {txn.product?.productName || txn.product?.name || 'Unknown Item'}
                        </div>
                        <div className="text-xs font-mono text-slate-400">{txn.product?.sku}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <TxnTypeBadge type={txn.transactionType || txn.type} />
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                        {isPositive ? `+${txn.quantity}` : `-${txn.quantity}`}{' '}
                        <span className="text-xs font-normal text-slate-400">{txn.product?.unitOfMeasure}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="text-xs font-medium text-slate-800">{txn.reason}</div>
                        {txn.referenceNumber && (
                          <div className="text-[11px] text-slate-400 font-mono">{txn.referenceNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        {txn.performedBy?.name || 'Admin'}
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs text-slate-400">
                        <div>{new Date(txn.transactionDate || txn.timestamp).toLocaleDateString()}</div>
                        <div className="text-[10px]">
                          {new Date(txn.transactionDate || txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => openDetails(txn)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Transaction Details: ${selectedTxn?.transactionId || selectedTxn?.transactionNumber}`}
        maxWidth="max-w-lg"
      >
        {selectedTxn && (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Movement Type</span>
                <div className="mt-1"><TxnTypeBadge type={selectedTxn.transactionType || selectedTxn.type} /></div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Transaction Date</span>
                <p className="font-medium text-slate-800 text-xs mt-1">
                  {new Date(selectedTxn.transactionDate || selectedTxn.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Details</span>
              <p className="text-base font-bold text-slate-900">{selectedTxn.product?.productName || selectedTxn.product?.name}</p>
              <p className="text-xs font-mono text-slate-500">SKU: {selectedTxn.product?.sku}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500">Previous Stock</span>
                <p className="text-base font-bold text-slate-800 mt-1">{selectedTxn.previousStock}</p>
              </div>
              <div className="p-3 rounded-xl bg-brand-50 border border-brand-200">
                <span className="text-[11px] text-brand-700 font-semibold">Quantity Moved</span>
                <p className="text-base font-bold text-brand-800 mt-1">
                  {selectedTxn.quantity}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500">New Balance</span>
                <p className="text-base font-bold text-slate-800 mt-1">{selectedTxn.newStock}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Reason:</span>
                <span className="font-medium text-slate-800">{selectedTxn.reason}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono text-slate-800">{selectedTxn.referenceNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Performed By:</span>
                <span className="font-medium text-slate-800">{selectedTxn.performedBy?.name} ({selectedTxn.performedBy?.email})</span>
              </div>
              {selectedTxn.notes && (
                <div className="pt-2">
                  <span className="text-slate-500">Remarks:</span>
                  <p className="mt-1 p-2.5 rounded-lg bg-slate-50 text-slate-700 italic border border-slate-200">
                    "{selectedTxn.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Stock Adjustment Modal (Admin Only) */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Physical Inventory Audit Adjustment"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Reconcile physical stock counts with system records. This creates a permanent audit record in MongoDB.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Product *
            </label>
            <select
              required
              value={adjustProductId}
              onChange={(e) => setAdjustProductId(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            >
              <option value="">-- Choose Item --</option>
              {products.map((p) => {
                const title = p.productName || p.name;
                const qty = p.quantity ?? p.quantityInStock;
                return (
                  <option key={p._id} value={p._id}>
                    [{p.sku}] {title} (Current: {qty} {p.unitOfMeasure})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Physical Count (Target Quantity) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={adjustNewQty}
              onChange={(e) => setAdjustNewQty(e.target.value)}
              placeholder="e.g. 42"
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Audit Reason *
            </label>
            <input
              type="text"
              required
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Monthly physical inventory reconciliation"
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="Audit ticket number or reconciliation notes"
              className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {adjustLoading ? 'Recording...' : 'Commit Audit Count'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
