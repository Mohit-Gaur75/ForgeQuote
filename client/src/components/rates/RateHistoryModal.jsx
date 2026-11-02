// client/src/components/rates/RateHistoryModal.jsx
import React from 'react';
import { X, History, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRateHistory } from '../../hooks/useRates';
import { formatCurrency } from '../../utils/currency';

export function RateHistoryModal({ isOpen, onClose, rate }) {
  const { data: history = [], isLoading } = useRateHistory(rate?.id);

  if (!isOpen || !rate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Rate Version Lineage: {rate.rateName}
              </h2>
              <p className="text-xs text-slate-500">
                Immutable append-only history of rate changes and effective windows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Loading version history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No previous version records found for this rate.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
              {history.map((version, index) => {
                const isCurrent = index === 0;
                const fromDate = new Date(version.effectiveFrom).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const toDate = version.effectiveTo
                  ? new Date(version.effectiveTo).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Present (Open-ended)';

                return (
                  <div key={version.id} className="relative pl-6">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        isCurrent
                          ? 'border-blue-600 ring-4 ring-blue-50'
                          : 'border-slate-400'
                      }`}
                    >
                      {isCurrent && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                    </div>

                    {/* Card */}
                    <div
                      className={`p-4 rounded-lg border ${
                        isCurrent
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-white">
                            v{version.versionNumber}
                          </span>
                          {isCurrent && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Active Benchmark
                            </span>
                          )}
                          <span className="text-xs font-medium text-slate-500">
                            {version.rateType}
                          </span>
                        </div>
                        <span className="text-base font-bold font-mono text-slate-900">
                          {formatCurrency(version.rateValue)}
                          <span className="text-xs text-slate-500 font-normal ml-1">
                            / {version.unit}
                          </span>
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-200/80 pt-2 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            <strong>Effective:</strong> {fromDate} &rarr; {toDate}
                          </span>
                        </div>
                        <div className="text-right text-[11px] text-slate-500">
                          Created {new Date(version.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-medium transition"
          >
            Close Lineage
          </button>
        </div>
      </div>
    </div>
  );
}
