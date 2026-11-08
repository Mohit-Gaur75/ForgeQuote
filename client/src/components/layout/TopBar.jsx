// client/src/components/layout/TopBar.jsx
import React from 'react';
import { LogOut, UserCircle2, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function TopBar() {
  const { user, role, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Enterprise RFQ Costing & Quotation
        </span>
      </div>

      {/* User Info & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <UserCircle2 className="w-5 h-5" />
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-800">{user?.name}</div>
            <div className="flex items-center gap-1 justify-end">
              {role === 'MANAGING_DIRECTOR' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded font-semibold">
                  <ShieldCheck className="w-3 h-3 text-amber-600" /> MD • SIGNS THE DEAL
                </span>
              ) : role === 'PLANT_HEAD' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded font-semibold">
                  <Wrench className="w-3 h-3 text-emerald-600" /> PLANT HEAD • CHECKS ROUTINGS
                </span>
              ) : role === 'SALES_HEAD' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold">
                  <ShieldCheck className="w-3 h-3 text-purple-600" /> SALES HEAD • APPROVES & SENDS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">
                  <Wrench className="w-3 h-3 text-blue-600" /> ESTIMATOR • COSTING
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
