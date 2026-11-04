// client/src/components/costing/RoutingSuggestionsModal.jsx
import React from 'react';
import {
  X,
  Zap,
  Cpu,
  Layers,
  ArrowRight,
  Clock,
  Building,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useRoutingSuggestions } from '../../hooks/useRoutings';
import { formatCurrency } from '../../utils/currency';

export function RoutingSuggestionsModal({
  isOpen,
  onClose,
  partId,
  targetPart,
  onApplyOperations,
}) {
  const { data: suggestions = [], isLoading } = useRoutingSuggestions(partId);

  if (!isOpen) return null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 65) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500 text-white flex items-center justify-center shadow">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Deterministic Routing Suggestions
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Target: {targetPart?.partName} • {targetPart?.material} • {targetPart?.netWeightKg} kg
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Similarity Formula Info Banner */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Deterministic Similarity Matching (No Hallucinations)</span>
            </div>
            <p className="text-[11px] text-blue-800">
              Matches are scored deterministically: <code>S = 0.40·Name + 0.35·Material + 0.25·Weight</code>. Adopting a historical routing copies proven cycle times and machine centers directly into your workspace.
            </p>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Scanning historical components...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-200 rounded-lg">
              <Layers className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-semibold text-xs text-slate-800">
                No sufficiently similar historical parts found (&ge; 50% match).
              </p>
              <p className="text-[11px] text-slate-400">
                Define the operations manually or try searching in the Historical Parts Archive.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((item) => {
                const totalCycle = (item.operations || []).reduce(
                  (sum, o) => sum + (o.cycleTimeMinutes || 0),
                  0
                );

                return (
                  <div
                    key={item.sourcePartId}
                    className="border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:border-blue-300 transition"
                  >
                    {/* Candidate Header */}
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {item.partName}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {item.partNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getScoreColor(
                              item.similarityPercentage
                            )}`}
                          >
                            {item.similarityPercentage}% Match
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>OEM: <strong>{item.customerName}</strong></span>
                          <span>•</span>
                          <span>Grade: <strong>{item.material}</strong></span>
                          <span>•</span>
                          <span>Net Wt: <strong>{item.netWeightKg} kg</strong></span>
                        </div>
                      </div>

                      {/* Adopt Button */}
                      <button
                        type="button"
                        onClick={() => {
                          onApplyOperations(item.operations, item.partName, item.similarityPercentage);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow-sm transition shrink-0"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Adopt This Routing</span>
                      </button>
                    </div>

                    {/* Breakdown Factors Pill Strip */}
                    <div className="px-3.5 py-2 bg-white border-b border-slate-100 flex items-center gap-3 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Formula Factors:</span>
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Name: {Math.round(item.breakdown.name * 100)}%
                      </span>
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Material: {Math.round(item.breakdown.material * 100)}%
                      </span>
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Weight: {Math.round(item.breakdown.weight * 100)}%
                      </span>
                      <span className="text-slate-400 ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Total: {totalCycle.toFixed(2)} min</span>
                      </span>
                    </div>

                    {/* Operations Sequence Preview */}
                    <div className="p-3.5 bg-slate-50/50">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Configured Operations ({item.operations.length} stages)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {item.operations.map((op, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-white rounded border border-slate-200 text-[11px]"
                          >
                            <div className="flex items-center justify-between font-mono font-bold text-slate-700">
                              <span>Op {op.operationSequence}</span>
                              <span className="text-blue-600 font-semibold">{op.cycleTimeMinutes} min</span>
                            </div>
                            <div className="font-medium text-slate-900 truncate mt-0.5">
                              {op.operationName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {op.machineType} • {formatCurrency(op.machineHourRate)}/hr
                            </div>
                          </div>
                        ))}
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
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
