// client/src/components/rates/RateCategoryTabs.jsx
import React from 'react';
import {
  Layers,
  Box,
  Cpu,
  TrendingUp,
  Package,
  Truck,
  Percent,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'ALL', label: 'All Rates', icon: Layers },
  { id: 'MATERIAL', label: 'Raw Material', unit: 'INR/kg', icon: Box },
  { id: 'MACHINE_HOUR', label: 'Machine Hour', unit: 'INR/hr', icon: Cpu },
  { id: 'OVERHEAD', label: 'Factory Overhead', unit: '%', icon: TrendingUp },
  { id: 'PACKING', label: 'Packaging', unit: 'INR/part', icon: Package },
  { id: 'FREIGHT', label: 'Freight', unit: 'INR/part', icon: Truck },
  { id: 'GST', label: 'GST Rate', unit: '%', icon: Percent },
];

export function RateCategoryTabs({ activeTab, onSelectTab }) {
  return (
    <div className="flex border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeTab === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => onSelectTab(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition ${
              isActive
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>{cat.label}</span>
            {cat.unit && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                {cat.unit}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
