// client/src/pages/DashboardPage.jsx
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useRFQs } from '../hooks/useRFQs';
import { useAuth } from '../hooks/useAuth';
import { RFQTable } from '../components/rfq/RFQTable';
import { CreateRFQModal } from '../components/rfq/CreateRFQModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { formatLakhCrore } from '../utils/currency';

export function DashboardPage() {
  const { isEstimator } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // TanStack Query hook
  const { data: response, isLoading, isError, error, refetch } = useRFQs({
    page,
    limit: 10,
    search: searchTerm || undefined,
    status: statusFilter || undefined,
    isOverdue: isOverdueOnly ? 'true' : undefined,
    sort: sortOrder,
  });

  const rfqs = response?.data || [];
  const meta = response?.meta || { page: 1, totalPages: 1, total: 0 };

  // Calculate quick top metrics
  const totalCount = meta.total || 0;
  const overdueCount = rfqs.filter((r) => r.isOverdue).length;
  const totalPipeline = rfqs.reduce((acc, r) => acc + (r.annualValue || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>RFQ Register</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time manufacturing inquiries, AI ingestion pipeline, and commercial statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            title="Refresh records"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isEstimator && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>New RFQ</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Inquiries</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Across all OEM customer accounts</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Overdue Actions</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-2xl font-bold mt-2 font-mono ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Due date elapsed without quote submission</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Pipeline Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {formatLakhCrore(totalPipeline)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Current page annualized quote volume</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg Turnaround Goal</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">4.0 Days</div>
          <div className="text-[10px] text-slate-400 mt-1">Target compressed from historical 9 days</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by RFQ# or Customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
          />
        </div>

        {/* Status Filters & Toggles */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Status Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-[11px] font-medium text-slate-600">
            {['', 'ESTIMATING', 'SENT', 'WON', 'LOST'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded transition ${
                  statusFilter === st
                    ? 'bg-white text-blue-600 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {st === '' ? 'All' : st === 'ESTIMATING' ? 'Estimating' : st === 'SENT' ? 'Sent' : st === 'WON' ? 'Won' : 'Lost'}
              </button>
            ))}
          </div>

          {/* Overdue Toggle */}
          <button
            onClick={() => {
              setIsOverdueOnly(!isOverdueOnly);
              setPage(1);
            }}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition flex items-center gap-1.5 ${
              isOverdueOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue Only</span>
          </button>

          {/* Sort Selector */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-700"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="dueDate:asc">Due Date (Earliest)</option>
            <option value="dueDate:desc">Due Date (Latest)</option>
          </select>
        </div>
      </div>

      {/* Main Table / States */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <LoadingSkeleton rows={6} />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load RFQ Register"
          message={error?.message || 'Database connection error'}
          onRetry={refetch}
        />
      ) : (
        <div className="space-y-4">
          <RFQTable rfqs={rfqs} isLoading={isLoading} />

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
              <div>
                Showing page <span className="font-semibold text-slate-800">{meta.page}</span> of{' '}
                <span className="font-semibold text-slate-800">{meta.totalPages}</span> ({meta.total} total inquiries)
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={!meta.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create RFQ Modal */}
      <CreateRFQModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
