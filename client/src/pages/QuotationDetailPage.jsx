// client/src/pages/QuotationDetailPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  Lock,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useQuotation } from '../hooks/useQuotations';
import { SendQuotationModal } from '../components/quotations/SendQuotationModal';
import { formatCurrency, formatLakhCrore } from '../utils/currency';

export function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSalesHead, isEstimator } = useAuth();

  const { data: quotation, isLoading, isError, error, refetch } = useQuotation(id);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSnapshotExpanded, setIsSnapshotExpanded] = useState(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState('');

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading Quotation Dossier...</span>
      </div>
    );
  }

  if (isError || !quotation) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-red-200 text-red-600 text-xs">
        Failed to load quotation: {error?.message || 'Quotation not found.'}
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'PENDING_APPROVAL':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'READY_TO_SEND':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SENT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleDownloadPDF = () => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const pdfUrl = `${apiBase}/api/v1/quotations/${quotation.id}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  const canSend = quotation.status === 'APPROVED' || quotation.status === 'READY_TO_SEND';
  const isAlreadySent = quotation.status === 'SENT';
  const isPendingApproval = quotation.status === 'PENDING_APPROVAL';

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb & Quotation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/rfqs" className="hover:text-blue-600">
              RFQs
            </Link>
            <span>/</span>
            <Link to={`/rfqs/${quotation.rfqId}`} className="hover:text-blue-600">
              {quotation.rfq?.rfqNumber || 'RFQ'}
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Formal Quotation</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              {quotation.quotationNumber}
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-white">
              v{quotation.versionNumber}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getStatusBadge(
                quotation.status
              )}`}
            >
              {quotation.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>Customer OEM: <strong>{quotation.rfq?.customerName}</strong></span>
            <span>•</span>
            <span>Prepared by: {quotation.creator?.name || 'Estimator'}</span>
            <span>•</span>
            <span>Issued: {new Date(quotation.createdAt).toLocaleDateString('en-IN')}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(`/rfqs/${quotation.rfqId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RFQ Dossier</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* Send to Customer Button */}
          {isAlreadySent ? (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 rounded text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Dispatched to Customer</span>
            </span>
          ) : isPendingApproval ? (
            <div
              title="This quote exceeds the ₹25 Lakh threshold and requires Sales Head commercial sign-off before dispatch."
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded text-xs font-medium cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Send (Awaiting Approval)</span>
            </div>
          ) : (
            <button
              onClick={() => setIsSendModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Customer (Simulation)</span>
            </button>
          )}
        </div>
      </div>

      {/* Dispatched Success Alert */}
      {sentSuccessMsg && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>{sentSuccessMsg}</span>
          </div>
          <button onClick={() => setSentSuccessMsg('')} className="text-[11px] font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Commercial Status Banner */}
      {quotation.status === 'PENDING_APPROVAL' && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-900 text-sm">
              Commercial Approval Pending (&ge; ₹25 Lakh Contract Threshold)
            </h4>
            <p className="text-amber-800 mt-0.5">
              This quotation has a projected annual contract value of{' '}
              <strong>{formatLakhCrore(quotation.annualContractValue)}</strong>. Under ForgeQuote commercial governance, the proposal cannot be sent to the customer until authorized by the <strong>Sales Head</strong>.
            </p>
          </div>
        </div>
      )}

      {quotation.status === 'APPROVED' && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-sm font-bold text-emerald-950">
                Commercial Pricing Authorized
              </strong>
              <span>
                Approved by <strong>{quotation.approver?.name || 'Sales Head'}</strong> on{' '}
                {new Date(quotation.updatedAt).toLocaleDateString('en-IN')}. This proposal is officially cleared for customer submission.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-200/60 text-emerald-900 rounded font-bold text-[11px]">
            Ready for Dispatch
          </span>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Annual Contract Value
          </span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {formatLakhCrore(quotation.annualContractValue)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {formatCurrency(quotation.annualContractValue)} (Ex-GST)
          </span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pre-GST Subtotal
          </span>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {formatCurrency(quotation.subtotalBeforeTax)}
          </div>
          <span className="text-[10px] text-slate-400">Sum of unit baseline quotes</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Applicable GST (18%)
          </span>
          <div className="text-xl font-black font-mono text-blue-600 mt-1">
            +{formatCurrency(quotation.gstAmount)}
          </div>
          <span className="text-[10px] text-slate-400">Statutory tax per annum</span>
        </div>

        <div className="bg-slate-900 text-white rounded-lg p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Gross Target Margin
          </span>
          <div className="text-xl font-black font-mono text-emerald-400 mt-1">
            {Number(quotation.marginPercentage || 15).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">Commercial return on sales</span>
        </div>
      </div>

      {/* Quoted Line Items Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Quoted Components Line Items
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {quotation.parts?.length || 0} manufacturing component{(quotation.parts?.length || 0) > 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Component</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3 text-right">Annual Vol</th>
                <th className="py-2.5 px-3 text-right">Material</th>
                <th className="py-2.5 px-3 text-right">Conversion</th>
                <th className="py-2.5 px-3 text-right">Setup</th>
                <th className="py-2.5 px-3 text-right">Overhead</th>
                <th className="py-2.5 px-3 text-right">Pre-GST Price</th>
                <th className="py-2.5 px-4 text-right">Final Quoted Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {(quotation.parts || []).map((qp, idx) => (
                <tr key={qp.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{qp.part?.partName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {qp.part?.partNumber || '—'}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-800">
                      {qp.part?.material || 'EN8'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-mono">
                    {qp.quotedAnnualVolume?.toLocaleString('en-IN')} pcs
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {formatCurrency(qp.materialCost)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {formatCurrency(qp.conversionCost)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {formatCurrency(qp.setupCost)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {formatCurrency(qp.overheadCost)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(qp.sellingPriceBeforeGST)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-black font-mono text-blue-700 block">
                      {formatCurrency(qp.sellingPriceIncludingGST)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Incl. 18% GST
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volume-Tiered Amortisation Annexure */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Volume-Tiered Amortisation Annexure (50% / 100% / 150%)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Setup cost amortisation variations across production quantities
          </span>
        </div>

        <div className="p-4 space-y-4">
          {(quotation.parts || []).map((qp) => {
            const tiers = qp.tiers || [];
            return (
              <div key={qp.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{qp.part?.partName}</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    Grade: {qp.part?.material}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
                  {tiers.map((tier, tIdx) => {
                    const isBaseline = tIdx === 1;
                    return (
                      <div
                        key={tier.id}
                        className={`p-3.5 space-y-1.5 ${
                          isBaseline ? 'bg-blue-50/40' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 uppercase text-[10px]">
                            {tIdx === 0 ? 'Tier 1 (50%)' : tIdx === 1 ? 'Tier 2 (100% Base)' : 'Tier 3 (150%)'}
                          </span>
                          {isBaseline && (
                            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[9px] font-bold">
                              Baseline
                            </span>
                          )}
                        </div>
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {tier.annualVolume.toLocaleString('en-IN')} pcs/yr
                        </div>
                        <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/80 text-[11px]">
                          <span>Setup Amort.:</span>
                          <span className="font-mono">{formatCurrency(tier.setupCost)}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-bold text-xs">
                          <span>Final Unit Price:</span>
                          <span className="font-mono text-blue-700">
                            {formatCurrency(tier.sellingPriceIncludingGST)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Immutable Rate Master Snapshot (Collapsible) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setIsSnapshotExpanded(!isSnapshotExpanded)}
          className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-left transition"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Locked Rate Master Benchmark Snapshot ({quotation.rateSnapshots?.length || 0} parameters)
              </h3>
              <p className="text-[11px] text-slate-500">
                Immutable rate versions locked at generation time, isolating this quote from future rate adjustments.
              </p>
            </div>
          </div>
          {isSnapshotExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {isSnapshotExpanded && (
          <div className="p-4 max-h-72 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {(quotation.rateSnapshots || []).map((snap) => (
                <div
                  key={snap.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      {snap.rateType}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      v{snap.versionNumber} • Eff: {new Date(snap.effectiveFrom).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(snap.rateValue)}
                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                      /{snap.unit?.replace('INR/', '')}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer Send Modal */}
      <SendQuotationModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        quotation={quotation}
        onSentSuccess={(result) => {
          setSentSuccessMsg(
            `Quotation ${result.quotationNumber} successfully dispatched to ${result.customerName} (${result.recipientEmail}) in Simulation Mode.`
          );
          refetch();
        }}
      />
    </div>
  );
}
