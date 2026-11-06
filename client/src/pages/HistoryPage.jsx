// client/src/pages/HistoryPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Layers,
  Building,
  RotateCcw,
  Eye,
  Cpu,
  Package,
  Calendar,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';
import { useHistorySearch } from '../hooks/useHistory';
import { HistoricalRoutingModal } from '../components/history/HistoricalRoutingModal';
import { ImportQuotesModal } from '../components/history/ImportQuotesModal';
import { formatCurrency, formatLakhCrore } from '../utils/currency';

const MATERIALS = ['ALL', 'EN8', '40Cr4', '20MnCr5', 'SS304', 'EN19', 'C45'];

export function HistoryPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [material, setMaterial] = useState('ALL');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [maxVolume, setMaxVolume] = useState('');
  const [page, setPage] = useState(1);

  const [inspectingPart, setInspectingPart] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data: historyResponse, isLoading, isError, error, refetch } = useHistorySearch({
    q,
    material,
    minWeight,
    maxWeight,
    minVolume,
    maxVolume,
    page,
    limit: 15,
  });

  const parts = historyResponse?.data || [];
  const pagination = historyResponse?.pagination || { page: 1, totalPages: 1, total: 0 };

  const hasActiveFilters =
    q || material !== 'ALL' || minWeight || maxWeight || minVolume || maxVolume;

  const handleClearFilters = () => {
    setQ('');
    setMaterial('ALL');
    setMinWeight('');
    setMaxWeight('');
    setMinVolume('');
    setMaxVolume('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Historical Parts & Quotation Archive
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-white uppercase">
              Estimation Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search previous manufacturing parts, cycle times, machine routings, and past quotation benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Past Quotes (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Filter & Search Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Main Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search part name, drawing number, OEM customer..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Material Filter */}
          <div className="md:col-span-3">
            <select
              value={material}
              onChange={(e) => {
                setMaterial(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs py-2 px-3 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-700"
            >
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {m === 'ALL' ? 'All Material Grades' : `Grade: ${m}`}
                </option>
              ))}
            </select>
          </div>

          {/* Weight Range */}
          <div className="md:col-span-2 flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              placeholder="Min kg"
              value={minWeight}
              onChange={(e) => {
                setMinWeight(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs py-2 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="number"
              step="0.1"
              placeholder="Max kg"
              value={maxWeight}
              onChange={(e) => {
                setMaxWeight(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs py-2 px-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="md:col-span-2 flex justify-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-md transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Count Line */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Found <strong>{pagination.total}</strong> historical parts across past RFQs
          </span>
          <span className="font-mono text-[11px]">
            Deterministic Routing Reusability Active
          </span>
        </div>
      </div>

      {/* Historical Parts Table Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Searching historical archives...</span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-red-600">
            Failed to load historical parts: {error?.message || 'Server error'}
          </div>
        ) : parts.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Historical Parts Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search criteria, clearing the material filter, or expanding the weight range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Component & Drawing</th>
                  <th className="py-3 px-4">Customer OEM & RFQ</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4 text-right">Net Weight</th>
                  <th className="py-3 px-4 text-right">Annual Vol</th>
                  <th className="py-3 px-4 text-center">Routing</th>
                  <th className="py-3 px-4 text-right">Latest Quoted Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {parts.map((part) => (
                  <tr key={part.id} className="hover:bg-slate-50/80 transition">
                    {/* Part Name & Number */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{part.partName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {part.partNumber || '—'}
                      </div>
                    </td>

                    {/* Customer & RFQ */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{part.rfq?.customerName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        RFQ: {part.rfq?.rfqNumber}
                      </div>
                    </td>

                    {/* Material */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {part.material || 'EN8'}
                      </span>
                    </td>

                    {/* Net Weight */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                      {part.netWeightKg ? `${part.netWeightKg} kg` : '—'}
                    </td>

                    {/* Annual Volume */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                      {part.annualVolume ? `${part.annualVolume.toLocaleString('en-IN')} pcs` : '—'}
                    </td>

                    {/* Routing Ops */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        <Cpu className="w-3 h-3" />
                        <span>{part.operationsCount || 0} ops</span>
                      </span>
                    </td>

                    {/* Latest Quoted Price */}
                    <td className="py-3.5 px-4 text-right">
                      {part.latestQuotation ? (
                        <div>
                          <span className="text-sm font-black font-mono text-emerald-600 block">
                            {formatCurrency(part.latestQuotation.sellingPriceIncludingGST)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {part.latestQuotation.quotationNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unquoted</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setInspectingPart(part)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-transparent rounded shadow-sm transition"
                          title="Inspect manufacturing operations & cycle times"
                        >
                          <Cpu className="w-3 h-3" />
                          <span>Routing</span>
                        </button>

                        {part.rfq?.id && (
                          <button
                            onClick={() => navigate(`/rfqs/${part.rfq.id}`)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                            title="Open original RFQ dossier"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-slate-300 bg-white text-xs text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-slate-300 bg-white text-xs text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historical Operations Inspection Modal */}
      <HistoricalRoutingModal
        isOpen={Boolean(inspectingPart)}
        onClose={() => setInspectingPart(null)}
        part={inspectingPart}
      />

      {/* Excel Past Quotes Import Modal */}
      <ImportQuotesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => refetch()}
      />
    </div>
  );
}
