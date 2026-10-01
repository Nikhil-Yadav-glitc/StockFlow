import React, { useState, useEffect } from 'react';
import { productsAPI, suppliersAPI, stockAPI, transactionsAPI } from '../services/api';
import { ArrowDownCircle, CheckCircle, AlertCircle, Package, Truck, ArrowRight } from 'lucide-react';

export const StockIn = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [recentInbounds, setRecentInbounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [reason, setReason] = useState('Vendor Purchase Restock');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  const loadData = async () => {
    try {
      const [prodRes, supRes, txnRes] = await Promise.all([
        productsAPI.getAll({ limit: 200 }),
        suppliersAPI.getAll(),
        transactionsAPI.getAll({ type: 'IN', limit: 8 })
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (supRes.success) setSuppliers(supRes.suppliers);
      if (txnRes.success) setRecentInbounds(txnRes.transactions);
    } catch (err) {
      console.error('Error loading stock-in data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pre-fill supplier when product changes
  useEffect(() => {
    if (selectedProduct && selectedProduct.supplier) {
      setSupplierId(selectedProduct.supplier._id || selectedProduct.supplier);
    }
  }, [selectedProductId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(quantity);

    if (!selectedProductId) {
      setError('Product is required.');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await stockAPI.stockIn({
        productId: selectedProductId,
        quantity: qty,
        supplierId: supplierId || undefined,
        referenceNumber,
        reason,
        notes
      });

      const pTitle = selectedProduct.productName || selectedProduct.name;
      setSuccessMsg(`Successfully stocked in ${qty} ${selectedProduct.unitOfMeasure} of ${pTitle}. Transaction: ${res.transaction.transactionId || res.transaction.transactionNumber}`);
      setQuantity('');
      setReferenceNumber('');
      setNotes('');
      loadData();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setError(err.message || 'Failed to record stock-in');
    } finally {
      setLoading(false);
    }
  };

  const parsedQty = Number(quantity) || 0;
  const prevStock = selectedProduct ? (selectedProduct.quantity ?? selectedProduct.quantityInStock) : 0;
  const projectedStock = prevStock + parsedQty;

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          <ArrowDownCircle className="w-3.5 h-3.5" />
          Inbound Goods Receiving
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock-In Workflow</h2>
        <p className="text-sm text-slate-500">
          Increase inventory product quantities and persist real-time IN audit transactions in MongoDB
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stock-In Form */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Product to Receive *
              </label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              >
                <option value="">-- Choose an item from inventory catalog --</option>
                {products.map((p) => {
                  const title = p.productName || p.name;
                  const qty = p.quantity ?? p.quantityInStock;
                  return (
                    <option key={p._id} value={p._id}>
                      [{p.sku}] {title} — Current: {qty} {p.unitOfMeasure}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quantity Input & Supplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantity Received (Positive integer) *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">
                    {selectedProduct?.unitOfMeasure || 'units'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Supplier / Vendor (Where applicable)
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                >
                  <option value="">-- Select Originating Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.supplierName || s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference & Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reference # (PO / Invoice / Challan)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. PO-2026-101"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Intake
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Vendor Purchase Restock"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Internal Remarks / Inspection Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Condition on receipt, batch details, etc."
                className="block w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedProductId || parsedQty <= 0}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ArrowDownCircle className="w-5 h-5" />
                  <span>Execute Stock-In Receipt</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Real-time Calculation Impact Preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Real-time Stock Impact
            </h3>

            {selectedProduct ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs text-slate-400 font-mono">{selectedProduct.sku}</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedProduct.productName || selectedProduct.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Selling Price: ${(selectedProduct.price ?? selectedProduct.unitPrice)?.toFixed(2)} | Unit: {selectedProduct.unitOfMeasure}
                  </p>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 text-sm">
                  <span className="text-slate-500">Current Quantity:</span>
                  <span className="font-bold text-slate-700">{prevStock} {selectedProduct.unitOfMeasure}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 text-emerald-600 text-sm">
                  <span className="font-semibold">+ Stock-In Addition:</span>
                  <span className="font-bold text-base">+{parsedQty} {selectedProduct.unitOfMeasure}</span>
                </div>

                <div className="flex items-center justify-between py-3 bg-emerald-50/70 px-3 rounded-xl border border-emerald-100 text-emerald-950">
                  <span className="text-xs font-bold uppercase">New Total Stock:</span>
                  <span className="font-black text-xl">{projectedStock} {selectedProduct.unitOfMeasure}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Select a product from the dropdown to preview stock quantity impact.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Stock-In Audit Records */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent Inbound Transactions (MongoDB)</h3>
          <span className="text-xs text-slate-400">Last 8 entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase">
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3 text-right">Received Qty</th>
                <th className="px-6 py-3 text-center">Previous → New</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInbounds.map((txn) => (
                <tr key={txn._id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono font-bold text-slate-700">
                    {txn.transactionId || txn.transactionNumber}
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-semibold text-slate-900">
                      {txn.product?.productName || txn.product?.name}
                    </span>
                    <span className="font-mono text-slate-400 ml-1.5">({txn.product?.sku})</span>
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-emerald-600">
                    +{txn.quantity} {txn.product?.unitOfMeasure}
                  </td>
                  <td className="px-6 py-3 text-center text-slate-600">
                    {txn.previousStock} → <span className="font-bold text-slate-900">{txn.newStock}</span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{txn.supplier?.supplierName || txn.supplier?.name || 'N/A'}</td>
                  <td className="px-6 py-3 text-slate-500">{txn.referenceNumber || 'N/A'}</td>
                  <td className="px-6 py-3 text-right text-slate-400">
                    {new Date(txn.transactionDate || txn.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
