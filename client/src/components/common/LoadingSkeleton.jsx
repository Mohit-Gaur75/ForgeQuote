// client/src/components/common/LoadingSkeleton.jsx
import React from 'react';

export function LoadingSkeleton({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-8 bg-slate-200 rounded w-1/3"></div>
      <div className="h-10 bg-slate-100 rounded w-full"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/5"></div>
        </div>
      ))}
    </div>
  );
}
