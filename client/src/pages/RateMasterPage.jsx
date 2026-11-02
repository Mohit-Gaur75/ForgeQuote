// client/src/pages/RateMasterPage.jsx
import React, { useState } from 'react';
import {
  Layers,
  Plus,
  History,
  Calendar,
  Search,
  Lock,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRates } from '../hooks/useRates';
import { RateCategoryTabs } from '../components/rates/RateCategoryTabs';
import { RateHistoryModal } from '../components/rates/RateHistoryModal';
import { CreateRateVersionModal } from '../components/rates/CreateRateVersionModal';
import { formatCurrency } from '../utils/currency';

export function RateMasterPage() {
  const { isSalesHead, isEstimator } = useAuth();

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [effectiveAt, setEffectiveAt] = useState('');

  // Modals state
  const [historyRate, setHistoryRate] = useState(null);
  const [versionModalRate, setVersionModalRate] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: ratesResponse, isLoading, isError, error } = useRates({
    rateType: activeCategory,
    search,
    page,
    limit: 15,
    effectiveAt: effectiveAt ? new Date(effectiveAt).toISOString() : undefined,
  });

  const rates = ratesResponse?.data || [];
  const pagination = ratesResponse?.pagination || { page: 1, totalPages: 1, total: 0 };

  const getCategoryBadgeClass = (type) => {
    switch (type) {
      case 'MATERIAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MACHINE_HOUR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OVERHEAD':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PACKING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'FREIGHT':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'GST':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Rate Master & Costing Parameters
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-white uppercase">
              Append-Only Versioned
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centrally governed industrial rate benchmarks for raw materials, machine hour rates, and logistics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Time-Travel Date Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 font-medium whitespace-nowrap">Effective As Of:</span>
            <input
              type="date"
              value={effectiveAt}
              onChange={(e) => {
                setEffectiveAt(e.target.value);
                setPage(1);
              }}
              className="text-xs text-slate-800 focus:outline-none bg-transparent"
            />
            {effectiveAt && (
              <button
                onClick={() => setEffectiveAt('')}
                className="text-[10px] text-blue-600 hover:underline ml-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Create Button (Sales Head only) */}
          {isSalesHead ? (
            <button
              onClick={() => {
                setVersionModalRate(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Rate Master</span>
            </button>
          ) : (
            <div
              title="Only the Sales Head can author or modify master rates"
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-md text-xs font-medium cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>New Rate (Sales Head)</span>
            </div>
          )}
        </div>
      </div>

      {/* Estimator Read-Only Notice */}
      {isEstimator && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Estimator Read-Only Mode:</strong> Master rates are centrally managed by the Sales Head. Cost calculations dynamically lock the effective rate version at quotation time.
            </span>
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Category Tabs */}
        <RateCategoryTabs
          activeTab={activeCategory}
          onSelectTab={(tab) => {
            setActiveCategory(tab);
            setPage(1);
          }}
        />

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by rate key, material grade, or machine..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing {rates.length} of {pagination.total} benchmark parameters
          </div>
        </div>

        {/* Rates Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Loading rate benchmarks...</span>
            </div>
          ) : isError ? (
            <div className="py-12 px-6 text-center text-red-600 text-xs">
              Failed to load rates: {error?.message || 'Server error'}
            </div>
          ) : rates.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium">No benchmark rates found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try clearing your search query or switching categories
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Rate Key / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Benchmark Rate</th>
                  <th className="py-3 px-4 text-center">Version</th>
                  <th className="py-3 px-4">Effective Window</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rates.map((rate) => {
                  const fromDate = new Date(rate.effectiveFrom).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const toDate = rate.effectiveTo
                    ? new Date(rate.effectiveTo).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Open-ended';

                  return (
                    <tr key={rate.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-semibold text-slate-900">{rate.rateName}</div>
                        {(rate.materialGrade || rate.machineType) && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {rate.materialGrade ? `Grade: ${rate.materialGrade}` : `Center: ${rate.machineType}`}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadgeClass(
                            rate.rateType
                          )}`}
                        >
                          {rate.rateType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {rate.unit === '%' ? `${rate.rateValue}%` : formatCurrency(rate.rateValue)}
                        </span>
                        {rate.unit !== '%' && (
                          <span className="text-[11px] text-slate-500 font-normal ml-1">
                            / {rate.unit.replace(/^INR\//, '')}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono font-bold text-[10px]">
                          v{rate.versionNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{fromDate}</span>
                          <span className="text-slate-400">&rarr;</span>
                          <span className={toDate === 'Open-ended' ? 'text-emerald-700 font-medium' : ''}>
                            {toDate}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {/* History Button */}
                        <button
                          onClick={() => setHistoryRate(rate)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-300 transition text-[11px] font-medium"
                          title="View complete version lineage"
                        >
                          <History className="w-3 h-3" />
                          <span>History</span>
                        </button>

                        {/* Bump Version Button (Sales Head only) */}
                        {isSalesHead && (
                          <button
                            onClick={() => {
                              setVersionModalRate(rate);
                              setIsCreateModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-900 text-white transition text-[11px] font-medium shadow-sm"
                            title="Create new version for this rate"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            <span>Bump v{rate.versionNumber + 1}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

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

      {/* Lineage History Modal */}
      <RateHistoryModal
        isOpen={Boolean(historyRate)}
        onClose={() => setHistoryRate(null)}
        rate={historyRate}
      />

      {/* Create / Bump Rate Version Modal */}
      <CreateRateVersionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setVersionModalRate(null);
        }}
        existingRate={versionModalRate}
      />
    </div>
  );
}
