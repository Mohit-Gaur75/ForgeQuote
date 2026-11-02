// client/src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FileSpreadsheet,
  Calculator,
  Layers,
  CheckCircle2,
  Search,
  Factory,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Sidebar() {
  const { isSalesHead, isEstimator } = useAuth();

  const navItems = [
    { label: 'RFQ Register', path: '/rfqs', icon: FileSpreadsheet, show: true },
    { label: 'Rate Masters', path: '/rates', icon: Layers, show: true },
    { label: 'Approval Inbox', path: '/approvals', icon: CheckCircle2, show: isSalesHead },
    { label: 'Historical Search', path: '/history', icon: Search, show: true },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shadow">
          <Factory className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight">ForgeQuote</span>
          <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">Company A • Chakan</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.filter(item => item.show).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Plant Meta */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Plant:</span>
          <span className="text-slate-200 font-mono">Chakan Unit 1</span>
        </div>
        <div className="flex justify-between">
          <span>Engine:</span>
          <span className="text-emerald-400 font-mono">decimal.js v1.0</span>
        </div>
      </div>
    </aside>
  );
}
