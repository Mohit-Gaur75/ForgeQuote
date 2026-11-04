// client/src/pages/RFQDetailPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Building2,
  Calendar,
  User,
  Plus,
  Sparkles,
  FileSpreadsheet,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useRFQ } from '../hooks/useRFQs';
import { useAuth } from '../hooks/useAuth';
import { RFQStatusBadge } from '../components/rfq/RFQStatusBadge';
import { PartsTable } from '../components/parts/PartsTable';
import { AddPartModal } from '../components/parts/AddPartModal';
import { AIIntakeModal } from '../components/ai/AIIntakeModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { formatLakhCrore } from '../utils/currency';
import { useCreateQuotation } from '../hooks/useQuotations';

export function RFQDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isEstimator } = useAuth();
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const { data: rfq, isLoading, isError, error, refetch } = useRFQ(id);
  const createQuoteMutation = useCreateQuotation(id);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  const handleGenerateQuotation = async () => {
    setIsGeneratingQuote(true);
    try {
      const res = await createQuoteMutation.mutateAsync({
        marginPercentage: 15.0,
        gstPercentage: 18.0,
      });
      navigate(`/quotations/${res.id}`);
    } catch (err) {
      alert(err.message || 'Failed to generate quotation. Please ensure all parts have operations configured in Costing.');
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <LoadingSkeleton rows={8} />
      </div>
    );
  }

  if (isError || !rfq) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorState
          title="Failed to load RFQ Details"
          message={error?.message || 'RFQ not found or access denied'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not specified';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/rfqs" className="hover:text-blue-600 transition flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>RFQ Register</span>
        </Link>
        <span>/</span>
        <span className="font-mono font-semibold text-slate-800">{rfq.rfqNumber}</span>
      </div>

      {/* RFQ Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {rfq.rfqNumber}
              </h1>
              <RFQStatusBadge status={rfq.status} isOverdue={rfq.isOverdue} />
            </div>

            <div className="flex items-center gap-2 mt-2 text-slate-700 font-semibold text-sm">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{rfq.customerName}</span>
              {rfq.customerType && (
                <span className="text-xs font-normal text-slate-400 font-sans">
                  • {rfq.customerType}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEstimator && rfq.parts && rfq.parts.length > 0 && (
              <button
                onClick={handleGenerateQuotation}
                disabled={isGeneratingQuote}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md shadow-sm transition disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>{isGeneratingQuote ? 'Locking Rates & Quoting...' : 'Generate Quotation'}</span>
              </button>
            )}

            {isEstimator && (
              <button
                onClick={() => setIsAddPartModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Component</span>
              </button>
            )}
          </div>
        </div>

        {/* Metadata Details Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Inquiry Received</span>
            <span className="font-medium text-slate-800">{formatDate(rfq.receivedAt)}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Quotation Due Date</span>
            <span className={`font-medium ${rfq.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
              {formatDate(rfq.dueDate)}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Assigned Estimator</span>
            <div className="flex items-center gap-1 text-slate-800 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{rfq.owner?.name || 'Unassigned'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Components Total</span>
            <span className="font-mono font-semibold text-slate-800">
              {rfq.parts?.length || 0} parts registered
            </span>
          </div>
        </div>
      </div>

      {/* AI Extraction Banner (Day 3 Feature Shortcut) */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-800/80 text-blue-200 shrink-0">
            <Sparkles className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold">AI RFQ Extraction & Ingestion</h3>
            <p className="text-xs text-blue-200 mt-0.5 max-w-xl">
              Paste customer inquiry emails and part lists. The AI extractor parses parts, materials, weights, and volumes with confidence ratings and source tracking.
            </p>
          </div>
        </div>
        {isEstimator && (
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 text-xs font-semibold rounded-md shadow transition shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Open AI Intake</span>
          </button>
        )}
      </div>

      {/* Parts Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Manufacturing Components ({rfq.parts?.length || 0})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Machined and forged parts configured for this quotation.
            </p>
          </div>
        </div>

        <PartsTable parts={rfq.parts} rfqId={rfq.id} isEstimator={isEstimator} />
      </div>

      {/* Quotations History Section */}
      {rfq.quotations && rfq.quotations.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span>Generated Quotations ({rfq.quotations.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rfq.quotations.map((q) => (
              <div
                key={q.id}
                onClick={() => navigate(`/quotations/${q.id}`)}
                className="p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-400 cursor-pointer shadow-sm transition flex items-center justify-between"
              >
                <div>
                  <div className="font-mono font-bold text-blue-600">{q.quotationNumber}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Version v{q.versionNumber} • Created {formatDate(q.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800">
                    {formatLakhCrore(q.totalIncludingGST || q.annualContractValue)}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                    {q.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Part Modal */}
      <AddPartModal
        isOpen={isAddPartModalOpen}
        onClose={() => setIsAddPartModalOpen(false)}
        rfqId={rfq.id}
      />

      {/* AI Extraction & Ingestion Modal */}
      <AIIntakeModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        rfqId={rfq.id}
        onConfirmed={refetch}
      />
    </div>
  );
}
