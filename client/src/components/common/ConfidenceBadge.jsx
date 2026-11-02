// client/src/components/common/ConfidenceBadge.jsx
import React from 'react';

export function ConfidenceBadge({ confidence }) {
  if (confidence === null || confidence === undefined) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        Missing
      </span>
    );
  }

  const score = Number(confidence);
  if (score >= 0.90) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        {(score * 100).toFixed(0)}% High
      </span>
    );
  }

  if (score >= 0.70) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        {(score * 100).toFixed(0)}% Med
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
      {(score * 100).toFixed(0)}% Low
    </span>
  );
}
