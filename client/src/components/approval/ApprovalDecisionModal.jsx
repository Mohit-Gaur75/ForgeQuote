// client/src/components/approval/ApprovalDecisionModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Building,
  Lock,
} from 'lucide-react';
import { useApprovalDecision } from '../../hooks/useApprovals';
import { formatCurrency, formatLakhCrore } from '../../utils/currency';

export function ApprovalDecisionModal({ isOpen, onClose, quotation }) {
  const approvalMutation = useApprovalDecision();

  const [decision, setDecision] = useState('APPROVE');
  const [comment, setComment] = useState('Commercial terms, margin, and rate benchmarks authorized.');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (quotation) {
      setDecision('APPROVE');
      setComment('Commercial terms, margin, and rate benchmarks authorized.');
      setErrorMsg('');
    }
  }, [quotation, isOpen]);

  if (!isOpen || !quotation) return null;

  const isSelfCreated = quotation.antiSelfApprovalViolation;

  const handleDecisionChange = (newDecision) => {
    setDecision(newDecision);
    setErrorMsg('');
    if (newDecision === 'APPROVE') {
      setComment('Commercial terms, margin, and rate benchmarks authorized.');
    } else {
      setComment('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isSelfCreated) {
      setErrorMsg('Anti-self-approval rule prevents approving or rejecting your own quotation.');
      return;
    }

    if (decision === 'REJECT' && (!comment || comment.trim().length < 3)) {
      setErrorMsg('A detailed comment explaining the rejection is mandatory.');
      return;
    }

    try {
      await approvalMutation.mutateAsync({
        quotationId: quotation.id,
        decision,
        comment: comment.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit commercial decision.');
    }
  };

  const margin = parseFloat(quotation.marginPercentage) || 15;
  const isSub8Margin = margin < 8.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shadow">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Commercial Authorization: {quotation.quotationNumber}
              </h2>
              <p className="text-xs text-slate-500">
                Executive sign-off for proposals exceeding the ₹25 Lakh contract threshold
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Anti-Self-Approval Warning */}
          {isSelfCreated && (
            <div className="p-3.5 bg-red-50 border-2 border-red-300 rounded-md flex items-start gap-3 text-xs text-red-800">
              <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Anti-Self-Approval Rule Violation</strong>
                <span>
                  You authored this quotation. Under ForgeQuote commercial compliance guidelines (<code>docs/SECURITY.md</code>), a Sales Head cannot authorize proposals they prepared. An independent approver must review this file.
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Proposal Summary Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 block">Customer OEM:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {quotation.rfq?.customerName || 'OEM Customer'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  RFQ: {quotation.rfq?.rfqNumber}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Estimated Annual Value:</span>
                <span className="text-base font-black font-mono text-slate-900 block mt-0.5">
                  {formatLakhCrore(quotation.annualContractValue)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatCurrency(quotation.annualContractValue)} (Ex-GST)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Gross Margin:</span>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                    isSub8Margin
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {margin}%
                </span>
                {isSub8Margin && (
                  <span className="text-[10px] text-red-600 font-semibold">
                    (&lt; 8% Target)
                  </span>
                )}
              </div>

              <div className="text-right text-[11px] text-slate-500">
                Prepared by: <strong className="text-slate-700">{quotation.creator?.name}</strong>
              </div>
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Commercial Decision <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isSelfCreated}
                onClick={() => handleDecisionChange('APPROVE')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-bold transition disabled:opacity-50 ${
                  decision === 'APPROVE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Approve Proposal</span>
              </button>

              <button
                type="button"
                disabled={isSelfCreated}
                onClick={() => handleDecisionChange('REJECT')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-bold transition disabled:opacity-50 ${
                  decision === 'REJECT'
                    ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Reject / Request Revision</span>
              </button>
            </div>
          </div>

          {/* Decision Notes / Rejection Justification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {decision === 'REJECT' ? 'Mandatory Rejection Justification' : 'Commercial Notes & Justification'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              disabled={isSelfCreated}
              placeholder={
                decision === 'REJECT'
                  ? 'State why this proposal was rejected (e.g. margin below threshold, requires cycle time re-estimation, or vendor raw material escalation)...'
                  : 'Add any commercial conditions or authorization comments...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              className="w-full text-xs rounded border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={approvalMutation.isLoading || isSelfCreated}
              className={`px-4 py-2 text-white rounded text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50 ${
                decision === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {approvalMutation.isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Decision...</span>
                </>
              ) : decision === 'APPROVE' ? (
                'Authorize Proposal'
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
