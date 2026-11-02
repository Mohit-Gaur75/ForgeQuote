// client/src/components/ai/AIFieldCard.jsx
import React, { useState } from 'react';
import { Check, Edit2, X, Eye, AlertCircle } from 'lucide-react';
import { ConfidenceBadge } from '../common/ConfidenceBadge';

export function AIFieldCard({
  label,
  field,
  onChange,
  onStatusChange,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field?.value ?? '');
  const [showSource, setShowSource] = useState(false);

  if (!field) return null;

  const handleSaveEdit = () => {
    onChange?.(editValue);
    onStatusChange?.('EDITED');
    setIsEditing(false);
  };

  const handleAccept = () => {
    onStatusChange?.('ACCEPTED');
  };

  const handleReject = () => {
    onChange?.(null);
    onStatusChange?.('REJECTED');
  };

  const status = field.verificationStatus || 'PENDING';

  const statusBg =
    status === 'ACCEPTED'
      ? 'border-emerald-300 bg-emerald-50/20'
      : status === 'REJECTED'
      ? 'border-red-200 bg-red-50/20 opacity-60'
      : status === 'EDITED'
      ? 'border-blue-300 bg-blue-50/20'
      : 'border-slate-200 bg-white';

  return (
    <div className={`p-3 rounded-lg border text-xs transition space-y-2 ${statusBg}`}>
      {/* Top Header: Label + Confidence Badge + Source Excerpt Button */}
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold text-slate-700 tracking-tight">{label}</span>
        <div className="flex items-center gap-1.5">
          <ConfidenceBadge confidence={field.confidence} />
          {field.sourceText && (
            <button
              type="button"
              onClick={() => setShowSource(!showSource)}
              title="Inspect verbatim source text"
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Value or Inline Edit Input */}
      {isEditing ? (
        <div className="flex items-center gap-1 mt-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none bg-white font-mono"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveEdit}
            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            title="Save changes"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
            title="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-1">
          <div className="font-mono font-semibold text-slate-900 truncate pr-2">
            {field.value !== null && field.value !== undefined ? (
              String(field.value)
            ) : (
              <span className="text-slate-400 italic font-sans font-normal">Missing / Not Detected</span>
            )}
          </div>

          {/* Verification Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleAccept}
              className={`p-1 rounded border transition ${
                status === 'ACCEPTED'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200'
              }`}
              title="Accept extracted value"
            >
              <Check className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditValue(field.value ?? '');
                setIsEditing(true);
              }}
              className={`p-1 rounded border transition ${
                status === 'EDITED'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'text-slate-400 hover:text-blue-700 hover:bg-blue-50 border-slate-200'
              }`}
              title="Edit value"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={handleReject}
              className={`p-1 rounded border transition ${
                status === 'REJECTED'
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'text-slate-400 hover:text-red-700 hover:bg-red-50 border-slate-200'
              }`}
              title="Reject / clear value"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Verbatim Source Excerpt Display */}
      {showSource && field.sourceText && (
        <div className="p-2 bg-slate-100 rounded text-[11px] text-slate-700 border border-slate-200 mt-1 font-mono">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
            <span>Source ({field.sourceType || 'EMAIL'})</span>
          </div>
          "{field.sourceText}"
        </div>
      )}

      {/* Uncertainty Note if present */}
      {field.uncertaintyExplanation && (
        <div className="flex items-start gap-1 text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
          <span>{field.uncertaintyExplanation}</span>
        </div>
      )}
    </div>
  );
}
