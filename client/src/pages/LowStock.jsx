import React, { useState, useEffect } from 'react';
import { reportsAPI, transactionsAPI } from '../services/api';
import { StockStatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  AlertTriangle,
  ArrowDownCircle,
  Mail,
  Phone,
  PackageX,
  CheckCircle,
  AlertCircle,
  Truck
} from 'lucide-react';

export const LowStock = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Quick Restock Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restockQty, setRestockQty] = useState('');
  const [restockRef, setRestockRef] = useState('');
  const [restockLoading, setRestockLoading] = useState(false);

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getLowStock();
      if (res.success) setItems(res.products);
    } catch (err) {
      setError(err.message || 'Failed to load low stock alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const openRestock = (prod) => {
    setSelectedProduct(prod);
    // Suggest deficit quantity
    const deficit = Math.max(10, (prod.reorderLevel * 2) - prod.quantityInStock);
    setRestockQty(deficit.toString());
    setRestockRef(`URGENT-RESTOCK-${Date.now().toString().slice(-4)}`);
    setIsModalOpen(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockQty || Number(restockQty) <= 0) return;

    setRestockLoading(true);
    setError('');
    try {
      await transactionsAPI.stockIn({
        productId: selectedProduct._id,
        quantity: Number(restockQty),
        supplierId: selectedProduct.supplier?._id,
        referenceNumber: restockRef,
        reason: 'Low-Stock Urgent Replenishment'
      });
      setSuccessMsg(`Replenished ${restockQty} units of ${selectedProduct.name}`);
      setIsModalOpen(false);
      fetchLowStockItems();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Restock failed');
    } finally {
      setRestockLoading(false);
    }
  };

  const outOfStockCount = items.filter(i => i.quantityInStock === 0).length;
  const lowStockCount = items.filter(i => i.quantityInStock > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Active Replenishment Warnings
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Low Stock Monitoring</h2>
          <p className="text-sm text-slate-500">
            Real-time tracking of items below reorder threshold with one-click replenishment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            {outOfStockCount} Out of Stock
          </span>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            {lowStockCount} Low Stock
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Auditing stock thresholds...
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">All Stock Levels Healthy!</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No products are currently at or below their reorder threshold. All inventory parameters are optimal.
            </p>
          </div>
        ) : (
          items.map((prod) => {
            const isZero = prod.quantityInStock === 0;
            const deficit = Math.max(0, prod.reorderLevel - prod.quantityInStock);

            return (
              <div
                key={prod._id}
                className={`bg-white p-5 rounded-2xl border transition flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isZero ? 'border-rose-300 ring-1 ring-rose-100' : 'border-amber-300 ring-1 ring-amber-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {prod.sku}
                    </span>
                    <StockStatusBadge status={prod.status} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{prod.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Category: {prod.category?.name || 'General'}</p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Stock</span>
                      <span className={`text-lg font-black ${isZero ? 'text-rose-600' : 'text-amber-600'}`}>
                        {prod.quantityInStock} <span className="text-xs font-medium text-slate-500">{prod.unitOfMeasure}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Reorder Threshold</span>
                      <span className="text-sm font-bold text-slate-700">
                        {prod.reorderLevel} {prod.unitOfMeasure}
                      </span>
                    </div>
                  </div>

                  {prod.supplier && (
                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Supplier: <strong className="text-slate-700">{prod.supplier.name}</strong></span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Deficit: <strong className="text-slate-800">+{deficit} {prod.unitOfMeasure}</strong>
                  </div>
                  <button
                    onClick={() => openRestock(prod)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    Restock Now
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Restock Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Restock: ${selectedProduct?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRestockSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Current stock is <strong>{selectedProduct?.quantityInStock} {selectedProduct?.unitOfMeasure}</strong>. Reorder threshold is <strong>{selectedProduct?.reorderLevel}</strong>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quantity to Receive *
            </label>
            <input
              type="number"
              min="1"
              required
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reference # (PO / Challan)
            </label>
            <input
              type="text"
              value={restockRef}
              onChange={(e) => setRestockRef(e.target.value)}
              className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={restockLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {restockLoading ? 'Processing...' : 'Confirm Restock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

