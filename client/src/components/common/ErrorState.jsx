// client/src/components/common/ErrorState.jsx
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while contacting the server.',
  onRetry = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-red-50 rounded-lg border border-red-200">
      <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
      <h3 className="text-sm font-semibold text-red-900 mb-1">{title}</h3>
      <p className="text-xs text-red-700 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
