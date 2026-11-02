// client/src/components/parts/PartsTable.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Trash2, Layers, Scale } from 'lucide-react';
import { useDeletePart } from '../../hooks/useParts';
import { EmptyState } from '../common/EmptyState';

export function PartsTable({ parts, rfqId, isEstimator }) {
  const navigate = useNavigate();
  const deletePart = useDeletePart(rfqId);

  if (!parts || parts.length === 0) {
    return (
      <EmptyState
        title="No manufacturing parts added yet"
        description="Add components manually or use the AI intake workspace to extract parts from customer inquiry documents."
      />
    );
  }

  const handleDelete = async (partId, partName) => {
    if (window.confirm(`Are you sure you want to remove "${partName}" from this RFQ?`)) {
      await deletePart.mutateAsync(partId);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden text-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Component / Drawing</th>
              <th className="py-3 px-3">Material</th>
              <th className="py-3 px-3">Net Wt</th>
              <th className="py-3 px-3">Gross Wt</th>
              <th className="py-3 px-3 text-center">Scrap %</th>
              <th className="py-3 px-3 text-right">Annual Vol</th>
              <th className="py-3 px-3 text-center">Routing Steps</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {parts.map((part) => (
              <tr key={part.id} className="hover:bg-slate-50/70 transition">
                {/* Part Name & Number */}
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{part.partName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {part.partNumber || 'No Part Number'}
                  </div>
                </td>

                {/* Material Grade */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-800">
                    {part.material || 'Unspecified'}
                  </span>
                </td>

                {/* Net Weight */}
                <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                  {part.netWeightKg ? `${Number(part.netWeightKg).toFixed(3)} kg` : '—'}
                </td>

                {/* Gross Weight */}
                <td className="py-3 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                  {part.grossWeightKg ? `${Number(part.grossWeightKg).toFixed(3)} kg` : '—'}
                </td>

                {/* Scrap % */}
                <td className="py-3 px-3 text-center font-mono text-slate-600">
                  {part.scrapPercentage ? `${Number(part.scrapPercentage).toFixed(1)}%` : '—'}
                </td>

                {/* Annual Volume */}
                <td className="py-3 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                  {part.annualVolume ? Number(part.annualVolume).toLocaleString('en-IN') : '—'}
                </td>

                {/* Routing Steps */}
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    <Layers className="w-3 h-3" />
                    <span>{part.operations?.length || 0} ops</span>
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => navigate(`/costing/${part.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-transparent rounded shadow-sm transition"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Costing</span>
                    </button>

                    {isEstimator && (
                      <button
                        onClick={() => handleDelete(part.id, part.partName)}
                        title="Delete component"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
