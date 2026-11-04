// client/src/components/history/HistoricalRoutingModal.jsx
import React from 'react';
import { X, Cpu, Clock, Building, Calendar, Layers, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function HistoricalRoutingModal({ isOpen, onClose, part }) {
  if (!isOpen || !part) return null;

  const operations = part.operations || [];
  const totalCycleMinutes = operations.reduce(
    (sum, op) => sum + (parseFloat(op.cycleTimeMinutes) || 0),
    0
  );
  const totalMins = Math.floor(totalCycleMinutes);
  const totalSecs = Math.round((totalCycleMinutes - totalMins) * 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Manufacturing Routing: {part.partName}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {part.partNumber || 'NO-DRG'} • {part.material || 'EN8'} • {part.netWeightKg} kg
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
          {/* Metadata Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Customer OEM
              </span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {part.rfq?.customerName || 'OEM Customer'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                RFQ: {part.rfq?.rfqNumber}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Annual Production
              </span>
              <span className="font-bold font-mono text-slate-900 text-sm block mt-0.5">
                {(part.annualVolume || 0).toLocaleString('en-IN')} pcs/yr
              </span>
              <span className="text-[10px] text-slate-500">
                Gross: {part.grossWeightKg || '—'} kg
              </span>
            </div>

            {part.latestQuotation ? (
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Quoted Price (Incl. GST)
                </span>
                <span className="font-bold font-mono text-emerald-600 text-sm block mt-0.5">
                  {formatCurrency(part.latestQuotation.sellingPriceIncludingGST)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Ref: {part.latestQuotation.quotationNumber}
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Quotation Status
                </span>
                <span className="text-slate-500 block mt-0.5">Not yet quoted</span>
              </div>
            )}
          </div>

          {/* Operations Header with Total Time */}
          <div className="flex items-center justify-between pt-1">
            <h3 className="font-bold text-slate-900 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Operations Sequence ({operations.length} stages)</span>
            </h3>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-mono text-blue-900">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Total Machining:</span>
              <strong>{totalMins}m {totalSecs}s</strong>
              <span className="text-blue-500">({totalCycleMinutes.toFixed(2)} min)</span>
            </div>
          </div>

          {/* Operations Table */}
          {operations.length === 0 ? (
            <div className="py-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No detailed operations registered for this historical part.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 w-12 text-center">Seq</th>
                    <th className="py-2.5 px-3">Operation Name</th>
                    <th className="py-2.5 px-3">Machine Center</th>
                    <th className="py-2.5 px-3 text-right">Cycle Time</th>
                    <th className="py-2.5 px-3 text-right">Rate (INR/hr)</th>
                    <th className="py-2.5 px-3 text-right">Setup (hrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {operations.map((op, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {op.operationSequence}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {op.operationName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                          {op.machineType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {Number(op.cycleTimeMinutes).toFixed(2)} min
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatCurrency(op.machineHourRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {op.setupHours ? `${Number(op.setupHours).toFixed(2)}h` : '0h'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
