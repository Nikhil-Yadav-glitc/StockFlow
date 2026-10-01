import React, { useState, useEffect } from 'react';
import { productsAPI, stockAPI, transactionsAPI } from '../services/api';
import { ArrowUpCircle, CheckCircle, AlertCircle, Package, ShieldAlert } from 'lucide-react';

export const StockOut = () => {
  const [products, setProducts] = useState([]);
  const [recentOutbounds, setRecentOutbounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Order Dispatch');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  const loadData = async () => {
    try {
      const [prodRes, txnRes] = await Promise.all([
        productsAPI.getAll({ limit: 200 }),
        transactionsAPI.getAll({ type: 'OUT', limit: 8 })
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (txnRes.success) setRecentOutbounds(txnRes.transactions);
    } catch (err) {
      console.error('Error loading stock-out data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const parsedQty = Number(quantity) || 0;
  const currentStock = selectedProduct ? (selectedProduct.quantity ?? selectedProduct.quantityInStock) : 0;
  const isInsufficient = selectedProduct && parsedQty > currentStock;
  const projectedStock = currentStock - parsedQty;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProductId) {
      setError('Product is required.');
      return;
    }

    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    // Strict validation preventing negative stock
    if (isInsufficient) {
      setError('Insufficient stock available.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await stockAPI.stockOut({
        productId: selectedProductId,
        quantity: parsedQty,
        reason,
        referenceNumber,
        notes
      });

      const pTitle = selectedProduct.productName || selectedProduct.name;
      setSuccessMsg(`Successfully dispatched ${parsedQty} ${selectedProduct.unitOfMeasure} of ${pTitle}. Transaction: ${res.transaction.transactionId || res.transaction.transactionNumber}`);
      setQuantity('');
      setReferenceNumber('');
      setNotes('');
      loadData();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setError(err.message || 'Failed to record stock-out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
          <ArrowUpCircle className="w-3.5 h-3.5" />
          Outbound Inventory Dispatch
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Stock-Out Workflow</h2>
        <p className="text-sm text-slate-500">
          Deduct stock quantities with automated negative-inventory prevention and log OUT audit transactions
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
        {/* Main Stock-Out Form */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Product to Deduct / Dispatch *
              </label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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

            {/* Quantity Input & Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantity to Dispatch *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 10"
                    className={`block w-full px-4 py-3 bg-slate-50 border rounded-xl text-base font-bold text-slate-900 focus:outline-hidden transition ${
                      isInsufficient ? 'border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/40' : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-xs font-semibold">
                    {selectedProduct?.unitOfMeasure || 'units'}
                  </div>
                </div>
                {isInsufficient && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Insufficient stock available. (In stock: {currentStock})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason for Outbound *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                >
                  <option value="Order Dispatch">Order Dispatch</option>
                  <option value="Customer Sale">Customer Sale</option>
                  <option value="Internal Use / Requisition">Internal Use / Requisition</option>
                  <option value="Damaged / Write-Off">Damaged / Write-Off</option>
                  <option value="Expired Stock Removal">Expired Stock Removal</option>
                </select>
              </div>
            </div>

            {/* Reference & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reference # (Order # / Ticket #)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. ORD-2026-042"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Authorized Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Carrier, tracking, or department notes"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedProductId || parsedQty <= 0 || isInsufficient}
              className="w-full py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5" />
                  <span>Execute Stock-Out Dispatch</span>
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
                  <span className="text-slate-500">Available Stock:</span>
                  <span className="font-bold text-slate-700">{currentStock} {selectedProduct.unitOfMeasure}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 text-blue-600 text-sm">
                  <span className="font-semibold">- Dispatch Deduction:</span>
                  <span className="font-bold text-base">-{parsedQty} {selectedProduct.unitOfMeasure}</span>
                </div>

                <div className={`flex items-center justify-between py-3 px-3 rounded-xl border ${
                  isInsufficient
                    ? 'bg-rose-50 text-rose-900 border-rose-200'
                    : projectedStock <= (selectedProduct.minimumStock ?? selectedProduct.reorderLevel)
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-slate-100 text-slate-900 border-slate-200'
                }`}>
                  <span className="text-xs font-bold uppercase">Resulting Balance:</span>
                  <span className="font-black text-xl">
                    {projectedStock} {selectedProduct.unitOfMeasure}
                  </span>
                </div>

                {projectedStock <= (selectedProduct.minimumStock ?? selectedProduct.reorderLevel) && !isInsufficient && (
                  <p className="text-xs text-amber-700 font-medium">
                    ⚠️ Notice: This dispatch brings inventory to or below the minimum stock threshold ({selectedProduct.minimumStock ?? selectedProduct.reorderLevel}).
                  </p>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Select a product from the dropdown to validate available inventory.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Stock-Out Audit Records */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent Outbound Transactions (MongoDB)</h3>
          <span className="text-xs text-slate-400">Last 8 entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase">
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3 text-right">Dispatched Qty</th>
                <th className="px-6 py-3 text-center">Previous → New</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOutbounds.map((txn) => (
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
                  <td className="px-6 py-3 text-right font-bold text-blue-600">
                    -{txn.quantity} {txn.product?.unitOfMeasure}
                  </td>
                  <td className="px-6 py-3 text-center text-slate-600">
                    {txn.previousStock} → <span className="font-bold text-slate-900">{txn.newStock}</span>
                  </td>
                  <td className="px-6 py-3 text-slate-700">{txn.reason}</td>
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
