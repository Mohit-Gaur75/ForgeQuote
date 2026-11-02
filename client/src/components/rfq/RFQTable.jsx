// client/src/components/rfq/RFQTable.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, User, Package, AlertCircle } from 'lucide-react';
import { formatINR, formatLakhCrore } from '../../utils/currency';
import { RFQStatusBadge } from './RFQStatusBadge';
import { EmptyState } from '../common/EmptyState';

export function RFQTable({ rfqs, isLoading }) {
  const navigate = useNavigate();

  if (!isLoading && (!rfqs || rfqs.length === 0)) {
    return (
      <EmptyState
        title="No RFQs matching criteria"
        description="Try clearing your search query or filters to view other inquiries."
      />
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">RFQ Number</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-3">Received</th>
              <th className="py-3 px-3">Due Date</th>
              <th className="py-3 px-3">Owner</th>
              <th className="py-3 px-3 text-center">Parts</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Annual Value</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {rfqs.map((rfq) => (
              <tr
                key={rfq.id}
                onClick={() => navigate(`/rfqs/${rfq.id}`)}
                className={`hover:bg-slate-50/70 transition cursor-pointer ${
                  rfq.isOverdue ? 'bg-rose-50/20' : ''
                }`}
              >
                {/* RFQ Number */}
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-blue-600 hover:text-blue-800">
                    {rfq.rfqNumber}
                  </span>
                </td>

                {/* Customer */}
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800">{rfq.customerName}</div>
                  {rfq.customerType && (
                    <div className="text-[10px] text-slate-400 font-normal">{rfq.customerType}</div>
                  )}
                </td>

                {/* Received Date */}
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                  {formatDate(rfq.receivedAt)}
                </td>

                {/* Due Date & Overdue Highlight */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className={rfq.isOverdue ? 'font-bold text-rose-700' : 'text-slate-600'}>
                      {formatDate(rfq.dueDate)}
                    </span>
                  </div>
                </td>

                {/* Owner */}
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{rfq.owner?.name?.split(' ')[0] || 'Unassigned'}</span>
                  </div>
                </td>

                {/* Part Count */}
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-100 text-slate-700">
                    <Package className="w-3 h-3 text-slate-400" />
                    {rfq.partCount}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <RFQStatusBadge status={rfq.status} isOverdue={rfq.isOverdue} />
                </td>

                {/* Annual Value */}
                <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                  {rfq.annualValue > 0 ? formatLakhCrore(rfq.annualValue) : '—'}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/rfqs/${rfq.id}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-transparent rounded transition shadow-sm"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
