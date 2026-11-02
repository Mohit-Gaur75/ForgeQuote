// client/src/components/rfq/RFQStatusBadge.jsx
import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Send, XCircle } from 'lucide-react';

export function RFQStatusBadge({ status, isOverdue }) {
  const configs = {
    ESTIMATING: {
      label: 'Estimating',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
    },
    SENT: {
      label: 'Sent to Customer',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Send,
    },
    WON: {
      label: 'Won',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle,
    },
    LOST: {
      label: 'Lost',
      className: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: XCircle,
    },
  };

  const config = configs[status] || configs.ESTIMATING;
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${config.className}`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>

      {isOverdue && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>OVERDUE</span>
        </span>
      )}
    </div>
  );
}
