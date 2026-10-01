import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, Database, Users } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Database className="w-3.5 h-3.5" />
          MongoDB Atlas Connected
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* User Badge */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name || 'User'}</p>
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              isAdmin
                ? 'bg-purple-100 text-purple-800 border-purple-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {isAdmin ? <Shield className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
              {isAdmin ? 'Admin' : 'Inventory Staff'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out of StockFlow"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
