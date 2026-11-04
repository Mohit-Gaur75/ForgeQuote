// client/src/pages/ApprovalInboxPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Building,
  Lock,
  Layers,
  ArrowRight,
  Eye,
  FileText,
  Clock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePendingApprovals } from '../hooks/useApprovals';
import { ApprovalDecisionModal } from '../components/approval/ApprovalDecisionModal';
import { formatCurrency, formatLakhCrore } from '../utils/currency';

export function ApprovalInboxPage() {
  const navigate = useNavigate();
  const { isSalesHead, user } = useAuth();

  const { data: pendingQuotes = [], isLoading, isError, error } = usePendingApprovals();
  const [selectedQuote, setSelectedQuote] = useState(null);

  if (!isSalesHead) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-3">
        <Lock className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Commercial Authorization Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The Approval Inbox is reserved for the Sales Head role to authorize high-value quotations exceeding the ₹25 Lakh commercial threshold.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Commercial Approval Inbox
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {pendingQuotes.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dual-party commercial governance for proposals meeting or exceeding the <strong>₹25.0 Lakh</strong> annual contract threshold.
          </p>
        </div>

        {/* Governance Info Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/70 border border-blue-200 rounded-md text-xs text-blue-900 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Threshold: <strong>&ge; ₹25 Lakh</strong> • Anti-Self-Approval Enforced
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Loading approval inbox...</span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-red-600">
            Failed to load pending approvals: {error?.message || 'Server error'}
          </div>
        ) : pendingQuotes.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Inbox Zero — No Pending Approvals</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All high-value manufacturing proposals (&ge; ₹25 Lakh) have been reviewed and decided.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Quotation / Inquiry</th>
                  <th className="py-3 px-4">Customer OEM</th>
                  <th className="py-3 px-4">Components</th>
                  <th className="py-3 px-4 text-center">Gross Margin</th>
                  <th className="py-3 px-4 text-right">Contract Value</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {pendingQuotes.map((quote) => {
                  const isSelfCreated = quote.antiSelfApprovalViolation;
                  const margin = parseFloat(quote.marginPercentage) || 15;
                  const isSub8Margin = margin < 8.0;

                  const partNames = (quote.parts || [])
                    .map((p) => p.part?.partName || 'Component')
                    .slice(0, 2)
                    .join(', ');
                  const remainingParts = (quote.parts?.length || 0) - 2;

                  return (
                    <tr
                      key={quote.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isSelfCreated ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Quotation & RFQ */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">
                          {quote.quotationNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          RFQ: {quote.rfq?.rfqNumber}
                        </div>
                      </td>

                      {/* Customer OEM */}
                      <td className="py-3.5 px-4 text-slate-800">
                        <div className="font-semibold flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{quote.rfq?.customerName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Due: {new Date(quote.rfq?.dueDate).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      {/* Components */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium text-slate-900">
                          {partNames}
                          {remainingParts > 0 && (
                            <span className="text-slate-400 font-normal ml-1">
                              +{remainingParts} more
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {quote.parts?.length || 0} component{(quote.parts?.length || 0) > 1 ? 's' : ''}
                        </div>
                      </td>

                      {/* Margin % */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                            isSub8Margin
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {margin}%
                        </span>
                        {isSub8Margin && (
                          <div className="text-[9px] text-red-600 font-semibold mt-0.5">
                            Sub-Optimal
                          </div>
                        )}
                      </td>

                      {/* Annual Contract Value */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-black font-mono text-slate-900 block">
                          {formatLakhCrore(quote.annualContractValue)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatCurrency(quote.annualContractValue)}
                        </span>
                      </td>

                      {/* Submitter */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">
                          {quote.creator?.name || 'Estimator'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(quote.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* View Quote Button */}
                          <button
                            onClick={() => navigate(`/quotations/${quote.id}`)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded border border-slate-200 transition"
                            title="Inspect full quotation"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Decision Button */}
                          {isSelfCreated ? (
                            <span
                              title="Anti-self-approval rule: You created this quotation. An independent Sales Head must authorize it."
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Self-Created</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedQuote(quote)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Review & Decide</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      <ApprovalDecisionModal
        isOpen={Boolean(selectedQuote)}
        onClose={() => setSelectedQuote(null)}
        quotation={selectedQuote}
      />
    </div>
  );
}
