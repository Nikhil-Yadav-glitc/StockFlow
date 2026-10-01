import React from 'react';

export const StockStatusBadge = ({ status }) => {
  const norm = String(status || '').toUpperCase().replace(/_/g, ' ');

  if (norm === 'IN STOCK') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        IN STOCK
      </span>
    );
  }

  if (norm === 'LOW STOCK') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        LOW STOCK
      </span>
    );
  }

  if (norm === 'OUT OF STOCK') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        OUT OF STOCK
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
      {status || 'Unknown'}
    </span>
  );
};

export const TxnTypeBadge = ({ type }) => {
  const norm = String(type || '').toUpperCase();

  if (norm === 'IN' || norm === 'STOCK_IN') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
        ↓ STOCK IN
      </span>
    );
  }

  if (norm === 'OUT' || norm === 'STOCK_OUT') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
        ↑ STOCK OUT
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800">
      ⇄ {type}
    </span>
  );
};
