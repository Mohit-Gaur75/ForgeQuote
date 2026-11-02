// client/src/pages/DashboardPage.jsx
import React from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">RFQ Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming inquiries, AI extraction pipelines, and quotation statuses.
          </p>
        </div>
      </div>

      <div className="p-8 bg-white border border-slate-200 rounded-lg text-center shadow-sm">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800">Foundation Ready</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
          Authentication and RBAC active. Logged in as <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.role}).
        </p>
      </div>
    </div>
  );
}
