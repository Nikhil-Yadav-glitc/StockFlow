import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { StockStatusBadge } from '../components/Badge';
import {
  BarChart3,
  Download,
  DollarSign,
  Boxes,
  ArrowDownCircle,
  ArrowUpCircle,
  FolderTree,
  FileSpreadsheet
} from 'lucide-react';

export const Reports = () => {
  const [valuationData, setValuationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchValuation = async () => {
      try {
        setLoading(true);
        const res = await reportsAPI.getValuation();
        if (res.success) setValuationData(res);
      } catch (err) {
        setError(err.message || 'Failed to load valuation report');
      } finally {
        setLoading(false);
      }
    };

    fetchValuation();
  }, []);

  const downloadProductsCSV = () => {
    window.open(reportsAPI.getExportProductsUrl(), '_blank');
  };

  const downloadTransactionsCSV = () => {
    window.open(reportsAPI.getExportTransactionsUrl(), '_blank');
  };

  const summary = valuationData?.summary;
  const byCategory = valuationData?.byCategory || [];
  const products = valuationData?.products || [];

  return (
    <div className="space-y-8">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Financial Reports</h2>
          <p className="text-sm text-slate-500">
            Comprehensive audit reports, stock turnover summaries, and CSV data exports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadProductsCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-brand-600" />
            Export Products (CSV)
          </button>
          <button
            onClick={downloadTransactionsCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Transactions (CSV)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock on Hand</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {Number(summary?.totalUnits || 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">units</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Across {summary?.totalProducts || 0} catalog items</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Cost Value</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              ${(summary?.totalCostValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Capital invested at cost</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Retail Value</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              ${(summary?.totalRetailValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Estimated value at selling price</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Margin Potential</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">
              ${(summary?.potentialProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {summary?.totalCostValue > 0
              ? `~${(((summary.potentialProfit) / summary.totalCostValue) * 100).toFixed(1)}% markup`
              : 'Optimal'}
          </p>
        </div>
      </div>

      {/* Stock-In & Stock-Out Flow Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Historical Stock-In Volume</h4>
              <p className="text-xs text-slate-500">{summary?.stockIn?.transactions || 0} intake shipments verified</p>
            </div>
          </div>
          <span className="text-3xl font-black text-emerald-700">
            +{summary?.stockIn?.totalUnits || 0}
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/20 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Historical Stock-Out Volume</h4>
              <p className="text-xs text-slate-500">{summary?.stockOut?.transactions || 0} order dispatches completed</p>
            </div>
          </div>
          <span className="text-3xl font-black text-blue-700">
            -{summary?.stockOut?.totalUnits || 0}
          </span>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">Category Valuation Breakdown</h3>
          </div>
          <span className="text-xs text-slate-400">{byCategory.length} categories analyzed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3.5">Category Name</th>
                <th className="px-6 py-3.5 text-center">Items Count</th>
                <th className="px-6 py-3.5 text-center">Total Quantity</th>
                <th className="px-6 py-3.5 text-right">Cost Value</th>
                <th className="px-6 py-3.5 text-right">Retail Value</th>
                <th className="px-6 py-3.5 text-right">Potential Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byCategory.map((cat, idx) => {
                const profit = cat.totalRetailValue - cat.totalCostValue;
                const marginPct = cat.totalRetailValue > 0 ? (profit / cat.totalRetailValue) * 100 : 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{cat.category}</td>
                    <td className="px-6 py-3.5 text-center font-medium text-slate-700">{cat.itemsCount}</td>
                    <td className="px-6 py-3.5 text-center font-medium text-slate-700">{cat.totalUnits.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-700">
                      ${cat.totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-900">
                      ${cat.totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="font-bold text-emerald-600">
                        ${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5 font-normal">
                        ({marginPct.toFixed(1)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Itemized Inventory Asset Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Itemized Inventory Asset Ledger</h3>
          <span className="text-xs text-slate-400">{products.length} catalog items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-center">In Stock</th>
                <th className="px-6 py-3.5 text-right">Selling Price</th>
                <th className="px-6 py-3.5 text-right">Total Retail Valuation</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono font-bold text-slate-700">{p.sku}</td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{p.productName || p.name}</td>
                  <td className="px-6 py-3 text-slate-600">{p.category}</td>
                  <td className="px-6 py-3 text-center font-bold text-slate-800">
                    {p.quantity} {p.unitOfMeasure}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">${p.price?.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right font-mono font-bold text-emerald-700">
                    ${p.totalRetailValue?.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <StockStatusBadge status={p.status} />
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
