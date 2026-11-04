// client/src/components/costing/OperationsEditor.jsx
import React from 'react';
import { Plus, Trash2, Cpu, Clock, AlertCircle, Zap } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const DEFAULT_MACHINE_TYPES = [
  { value: 'CNC Lathe', label: 'CNC Lathe', defaultRate: 450 },
  { value: 'VMC 3-Axis', label: 'VMC 3-Axis', defaultRate: 650 },
  { value: 'VMC 4-Axis', label: 'VMC 4-Axis', defaultRate: 750 },
  { value: 'HMC', label: 'HMC (Horizontal Machining)', defaultRate: 950 },
  { value: 'Surface Grinder', label: 'Cylindrical / Surface Grinder', defaultRate: 350 },
  { value: 'Conventional', label: 'Conventional Drill / Lathe', defaultRate: 180 },
  { value: 'Custom', label: 'Other / Specialized Center', defaultRate: 500 },
];

export function OperationsEditor({
  operations = [],
  onChange,
  effectiveRates,
  onOpenSuggestions,
}) {
  // Machine hour rates from backend if available
  const machineRates = effectiveRates?.MACHINE_HOUR || [];

  const handleAddOperation = () => {
    const nextSeq = operations.length > 0
      ? Math.max(...operations.map((o) => o.operationSequence || 0)) + 10
      : 10;

    const newOp = {
      operationSequence: nextSeq,
      operationName: `Operation ${nextSeq}`,
      machineType: 'CNC Lathe',
      cycleTimeMinutes: 1.5,
      machineHourRate: 450,
      setupHours: 0.5,
      machineRateVersionId: null,
    };

    onChange([...operations, newOp]);
  };

  const handleRemoveOperation = (index) => {
    const updated = operations.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...operations];
    const op = { ...updated[index], [field]: value };

    // If machineType changed, attempt to auto-fill rate from Rate Master
    if (field === 'machineType') {
      const match = machineRates.find(
        (r) => r.rateName.toLowerCase().includes(value.toLowerCase()) ||
               (r.machineType && r.machineType.toLowerCase() === value.toLowerCase())
      );
      if (match) {
        op.machineHourRate = Number(match.rateValue);
        op.machineRateVersionId = match.id;
      } else {
        const fallback = DEFAULT_MACHINE_TYPES.find((m) => m.value === value);
        if (fallback) {
          op.machineHourRate = fallback.defaultRate;
        }
      }
    }

    updated[index] = op;
    onChange(updated);
  };

  // Total machining cycle time
  const totalCycleMinutes = operations.reduce(
    (sum, op) => sum + (parseFloat(op.cycleTimeMinutes) || 0),
    0
  );
  const totalMinutesWhole = Math.floor(totalCycleMinutes);
  const totalSecondsRemainder = Math.round((totalCycleMinutes - totalMinutesWhole) * 60);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Manufacturing Routing & Machining Operations
            </h3>
            <p className="text-[11px] text-slate-500">
              Configure CNC/VMC operations, cycle times, setup hours, and machine-hour rates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Total Cycle:</span>
            <strong className="text-slate-900">
              {totalMinutesWhole}m {totalSecondsRemainder}s
            </strong>
            <span className="text-slate-400">({totalCycleMinutes.toFixed(2)} min)</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSuggestions && (
              <button
                type="button"
                onClick={onOpenSuggestions}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold shadow-sm transition"
                title="Scan historical parts and auto-fill routing"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>Reuse Similar Routing</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddOperation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Operation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {operations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Cpu className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium">No machining operations configured.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &quot;Add Operation&quot; to define turning, milling, grinding, or finishing stages.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 w-16 text-center">Seq</th>
                <th className="py-2.5 px-3">Operation Description</th>
                <th className="py-2.5 px-3">Machine Center</th>
                <th className="py-2.5 px-3 text-right">Cycle Time (min)</th>
                <th className="py-2.5 px-3 text-right">Rate (INR/hr)</th>
                <th className="py-2.5 px-3 text-right">Setup (hrs)</th>
                <th className="py-2.5 px-3 text-right">Conversion Cost</th>
                <th className="py-2.5 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {operations.map((op, idx) => {
                const cycle = parseFloat(op.cycleTimeMinutes) || 0;
                const rate = parseFloat(op.machineHourRate) || 0;
                const conversionPerPiece = (cycle / 60) * rate;

                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    {/* Seq */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        value={op.operationSequence}
                        onChange={(e) =>
                          handleFieldChange(idx, 'operationSequence', parseInt(e.target.value) || 10)
                        }
                        className="w-12 text-center font-mono font-bold text-slate-700 border border-slate-200 rounded py-1 px-1 text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Operation Name */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="e.g. CNC Rough & Finish Turning"
                        value={op.operationName}
                        onChange={(e) =>
                          handleFieldChange(idx, 'operationName', e.target.value)
                        }
                        required
                        className="w-full border border-slate-200 rounded py-1 px-2 text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>

                    {/* Machine Type */}
                    <td className="py-2 px-3">
                      <select
                        value={op.machineType}
                        onChange={(e) =>
                          handleFieldChange(idx, 'machineType', e.target.value)
                        }
                        className="w-full border border-slate-200 rounded py-1 px-2 text-xs text-slate-700 bg-white focus:ring-1 focus:ring-blue-500"
                      >
                        {DEFAULT_MACHINE_TYPES.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Cycle Time Minutes */}
                    <td className="py-2 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          min="0.01"
                          value={op.cycleTimeMinutes}
                          onChange={(e) =>
                            handleFieldChange(idx, 'cycleTimeMinutes', parseFloat(e.target.value) || 0)
                          }
                          required
                          className="w-16 text-right font-mono font-semibold text-slate-900 border border-slate-200 rounded py-1 px-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-slate-400">min</span>
                      </div>
                    </td>

                    {/* Machine Hour Rate */}
                    <td className="py-2 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">₹</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={op.machineHourRate}
                          onChange={(e) =>
                            handleFieldChange(idx, 'machineHourRate', parseFloat(e.target.value) || 0)
                          }
                          required
                          className="w-16 text-right font-mono font-semibold text-slate-900 border border-slate-200 rounded py-1 px-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </td>

                    {/* Setup Hours */}
                    <td className="py-2 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={op.setupHours ?? 0}
                          onChange={(e) =>
                            handleFieldChange(idx, 'setupHours', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 text-right font-mono text-slate-700 border border-slate-200 rounded py-1 px-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-slate-400">h</span>
                      </div>
                    </td>

                    {/* Calculated Conversion Cost */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(conversionPerPiece)}
                    </td>

                    {/* Delete */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveOperation(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition"
                        title="Remove Operation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
