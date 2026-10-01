import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Truck,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  BarChart3,
  Users,
  Settings,
  Box
} from 'lucide-react';

export const Sidebar = () => {
  const { isAdmin } = useAuth();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Categories', path: '/categories', icon: FolderTree },
    { name: 'Suppliers', path: '/suppliers', icon: Truck },
    { name: 'Stock In', path: '/stock-in', icon: ArrowDownCircle },
    { name: 'Stock Out', path: '/stock-out', icon: ArrowUpCircle },
    { name: 'Transactions', path: '/transactions', icon: History },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    ...(isAdmin ? [{ name: 'Users', path: '/users', icon: Users, adminOnly: true }] : []),
    { name: 'Settings / Profile', path: '/settings', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl select-none z-30">
      {/* Brand Identity */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
          <Box className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">
            Stock<span className="text-brand-400">Flow</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
            Smart Inventory Platform
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.adminOnly && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/50">
                      Admin
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 text-[11px] text-slate-400 text-center">
        Stock Maintenance System • v1.0
      </div>
    </aside>
  );
};
