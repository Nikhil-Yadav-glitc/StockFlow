import React, { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI, suppliersAPI, stockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StockStatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  CheckCircle,
  Tag,
  Shield
} from 'lucide-react';

export const Products = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Quick Stock Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState('IN');
  const [stockQty, setStockQty] = useState('');
  const [stockReason, setStockReason] = useState('');
  const [stockRef, setStockRef] = useState('');
  const [stockNotes, setStockNotes] = useState('');
  const [stockLoading, setStockLoading] = useState(false);

  // Product Form Fields (aligned with master prompt)
  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    barcode: '',
    description: '',
    category: '',
    supplier: '',
    price: '',
    costPrice: '',
    quantity: 0,
    minimumStock: 10,
    unitOfMeasure: 'pcs'
  });

  const fetchDependencies = async () => {
    try {
      const [catsRes, supsRes] = await Promise.all([
        categoriesAPI.getAll(),
        suppliersAPI.getAll()
      ]);
      if (catsRes.success) setCategories(catsRes.categories);
      if (supsRes.success) setSuppliers(supsRes.suppliers);
    } catch (err) {
      console.error('Error loading categories/suppliers', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsAPI.getAll({
        search,
        category: selectedCategory,
        status: selectedStatus
      });
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedStatus]);

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      productName: '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      barcode: '',
      description: '',
      category: categories[0]?._id || '',
      supplier: suppliers[0]?._id || '',
      price: '',
      costPrice: '',
      quantity: 0,
      minimumStock: 10,
      unitOfMeasure: 'pcs'
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (prod) => {
    setIsEditing(true);
    setSelectedProduct(prod);
    setFormData({
      productName: prod.productName || prod.name,
      sku: prod.sku,
      barcode: prod.barcode || '',
      description: prod.description || '',
      category: prod.category?._id || prod.category,
      supplier: prod.supplier?._id || prod.supplier,
      price: prod.price ?? prod.unitPrice,
      costPrice: prod.costPrice || 0,
      minimumStock: prod.minimumStock ?? prod.reorderLevel ?? 10,
      unitOfMeasure: prod.unitOfMeasure || 'pcs'
    });
    setIsProductModalOpen(true);
  };

  const openStockModal = (prod, type) => {
    setSelectedProduct(prod);
    setStockModalType(type);
    setStockQty('');
    setStockRef('');
    setStockReason(type === 'IN' ? 'Purchase Restock' : 'Order Dispatch');
    setStockNotes('');
    setIsStockModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isEditing) {
        await productsAPI.update(selectedProduct._id, formData);
        setSuccessMsg(`Updated ${formData.productName}`);
      } else {
        await productsAPI.create(formData);
        setSuccessMsg(`Product "${formData.productName}" added to inventory.`);
      }
      setIsProductModalOpen(false);
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setStockLoading(true);
    setError('');
    try {
      const payload = {
        productId: selectedProduct._id,
        quantity: Number(stockQty),
        referenceNumber: stockRef,
        reason: stockReason,
        notes: stockNotes
      };

      if (stockModalType === 'IN') {
        await stockAPI.stockIn(payload);
        setSuccessMsg(`Stock-In successful: Added ${stockQty} ${selectedProduct.unitOfMeasure} of ${selectedProduct.productName || selectedProduct.name}`);
      } else {
        await stockAPI.stockOut(payload);
        setSuccessMsg(`Stock-Out successful: Dispatched ${stockQty} ${selectedProduct.unitOfMeasure} of ${selectedProduct.productName || selectedProduct.name}`);
      }

      setIsStockModalOpen(false);
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Stock transaction failed');
    } finally {
      setStockLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      await productsAPI.delete(id);
      setSuccessMsg(`Deleted product "${name}"`);
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Cannot delete product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Products Management</h2>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? 'Complete CRUD control over inventory items, pricing, minimum stock thresholds, and stock status'
              : 'Search and inspect registered catalog items and live stock balances'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Status Messages */}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by product name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-slate-700 transition"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.categoryName || c.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-slate-700 transition"
          >
            <option value="">All Stock Statuses</option>
            <option value="IN STOCK">IN STOCK</option>
            <option value="LOW STOCK">LOW STOCK</option>
            <option value="OUT OF STOCK">OUT OF STOCK</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-right">Price</th>
                <th className="px-6 py-3.5 text-center">Quantity (Stock)</th>
                <th className="px-6 py-3.5 text-center">Minimum Stock</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading products from MongoDB...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 text-sm">
                    No products matching current filter criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const pTitle = p.productName || p.name;
                  const pQty = p.quantity ?? p.quantityInStock;
                  const pPrice = p.price ?? p.unitPrice;
                  const pMinStock = p.minimumStock ?? p.reorderLevel;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-800">
                        {p.sku}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">{pTitle}</div>
                        {p.description && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{p.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {p.category?.categoryName || p.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-900 text-xs">
                        ${Number(pPrice).toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="font-bold text-slate-900 text-sm">{pQty}</span>{' '}
                        <span className="text-xs text-slate-400">{p.unitOfMeasure}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center font-mono text-xs text-slate-500">
                        {pMinStock} {p.unitOfMeasure}
                      </td>
                      <td className="px-6 py-3.5">
                        <StockStatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Quick Stock-In */}
                          <button
                            onClick={() => openStockModal(p, 'IN')}
                            title="Stock In"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                          {/* Quick Stock-Out */}
                          <button
                            onClick={() => openStockModal(p, 'OUT')}
                            title="Stock Out"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                          {/* Admin Edit */}
                          {isAdmin && (
                            <button
                              onClick={() => openEditModal(p)}
                              title="Edit Product"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {/* Admin Delete */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(p._id, pTitle)}
                              title="Delete Product"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal (Admin Only) */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={isEditing ? `Edit Product: ${formData.productName}` : 'Add Product to Inventory'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g. Wireless Mouse"
              className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. ELEC-WM-01"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g. 8901001001"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.categoryName || c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Supplier *
              </label>
              <select
                required
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.supplierName || s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Selling Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="24.99"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cost Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="12.50"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Minimum Stock *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                placeholder="10"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Quantity in Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                placeholder="pcs, boxes, meters"
                className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product technical details, warranty, etc."
              className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/20 transition"
            >
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Stock Movement Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={stockModalType === 'IN' ? `Stock In: ${selectedProduct?.productName || selectedProduct?.name}` : `Stock Out: ${selectedProduct?.productName || selectedProduct?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-500">Available Stock:</span>
              <span className="font-bold text-slate-900 ml-1.5">
                {selectedProduct?.quantity ?? selectedProduct?.quantityInStock} {selectedProduct?.unitOfMeasure}
              </span>
            </div>
            <div>
              <span className="text-slate-500">SKU:</span>
              <span className="font-mono font-bold text-slate-800 ml-1.5">{selectedProduct?.sku}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quantity to {stockModalType === 'IN' ? 'Receive' : 'Dispatch'} *
            </label>
            <input
              type="number"
              min="1"
              max={stockModalType === 'OUT' ? (selectedProduct?.quantity ?? selectedProduct?.quantityInStock) : undefined}
              required
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              placeholder="e.g. 10"
              className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason
            </label>
            <input
              type="text"
              value={stockReason}
              onChange={(e) => setStockReason(e.target.value)}
              placeholder={stockModalType === 'IN' ? 'Restock / Purchase' : 'Order Dispatch'}
              className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reference #
            </label>
            <input
              type="text"
              value={stockRef}
              onChange={(e) => setStockRef(e.target.value)}
              placeholder="PO-1002 / INV-904"
              className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={stockLoading}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition disabled:opacity-50 ${
                stockModalType === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {stockLoading ? 'Processing...' : stockModalType === 'IN' ? 'Confirm Stock-In' : 'Confirm Stock-Out'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
