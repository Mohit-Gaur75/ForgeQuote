// client/src/pages/DealRoomPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Award,
  ShieldCheck,
  TrendingUp,
  FileText,
  Download,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatLakhCrore } from '../utils/currency';

export function DealRoomPage() {
  const queryClient = useQueryClient();
  const { user, isMD, isSalesHead } = useAuth();

  const [selectedQuote, setSelectedQuote] = useState(null);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealNotes, setDealNotes] = useState('');

  // Fetch quotations for the Deal Room
  const { data: quotes = [], isLoading, refetch } = useQuery({
    queryKey: ['deal-room-quotes'],
    queryFn: async () => {
      const res = await api.get('/quotations/deal-room/list');
      return res.data || [];
    },
  });

  // MD Deal Sign-off Mutation
  const signDealMutation = useMutation({
    mutationFn: async ({ quotationId, notes }) => {
      return api.post(`/quotations/${quotationId}/sign-deal`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-room-quotes'] });
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      setDealModalOpen(false);
      setSelectedQuote(null);
      setDealNotes('');
    },
  });

  const openSignModal = (quote) => {
    setSelectedQuote(quote);
    setDealNotes(
      `Strategic commercial agreement approved and executed for ${quote.rfq?.customerName || 'customer'}. Contribution margin locked at ${Number(quote.marginPercentage || 15).toFixed(1)}%.`
    );
    setDealModalOpen(true);
  };

  const handleConfirmSignDeal = () => {
    if (!selectedQuote) return;
    signDealMutation.mutate({
      quotationId: selectedQuote.id,
      notes: dealNotes,
    });
  };

  const handleDownloadPDF = async (quote) => {
    try {
      const res = await api.get(`/quotations/${quote.id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quote.quotationNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate PDF quotation.');
    }
  };

  // Pipeline Metrics
  const totalACV = quotes.reduce((sum, q) => sum + parseFloat(q.annualContractValue || 0), 0);
  const wonQuotes = quotes.filter((q) => q.status === 'WON' || Boolean(q.mdSignedAt));
  const wonACV = wonQuotes.reduce((sum, q) => sum + parseFloat(q.annualContractValue || 0), 0);
  const pendingMDSignature = quotes.filter((q) => (q.status === 'APPROVED' || q.status === 'SENT') && !q.mdSignedAt);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Executive Deal Room & Commercial Sign-Off
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-700 text-white uppercase">
              Managing Director • Signs the Deal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Executive oversight for Tier-1 automotive and tractor supply contracts (Company A • ₹140–160 Cr/yr Revenue).
          </p>
        </div>

        {/* MD Identity Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
          <Award className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold">Executive Authority: </span>
            <span>Suresh Patil (Managing Director)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="text-[10px] font-mono font-semibold uppercase text-slate-500 tracking-wider">
            Total Pipeline ACV
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatLakhCrore(totalACV)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Across {quotes.length} commercial quotes
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-emerald-200 shadow-sm">
          <div className="text-[10px] font-mono font-semibold uppercase text-emerald-700 tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Won & Executed ACV
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {formatLakhCrore(wonACV)}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            {wonQuotes.length} deals signed by Managing Director
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-amber-200 shadow-sm">
          <div className="text-[10px] font-mono font-semibold uppercase text-amber-700 tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Awaiting MD Deal Sign-off
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {pendingMDSignature.length} Deals
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">
            Commercial approvals completed
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
          <div className="text-[10px] font-mono font-semibold uppercase text-blue-700 tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Annual Impact Target
          </div>
          <div className="text-xl font-bold text-blue-700 mt-1">
            ₹1.27 Crore/yr
          </div>
          <div className="text-[10px] text-blue-600 mt-0.5">
            ₹40.5L estimator time + ₹86.4L retained margin
          </div>
        </div>
      </div>

      {/* Quotation Contracts List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading executive contracts and deal records...
        </div>
      ) : quotes.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
          No commercial quotations available yet. Create quotations from RFQ Register.
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const isSignedByMD = Boolean(quote.mdSignedAt);
            const acv = parseFloat(quote.annualContractValue || 0);

            return (
              <div
                key={quote.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4 hover:border-slate-300 transition"
              >
                {/* Contract Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-900 font-mono">
                        {quote.quotationNumber}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        v{quote.versionNumber}
                      </span>
                      {quote.status === 'WON' || isSignedByMD ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold">
                          <Award className="w-3 h-3" /> DEAL WON & SIGNED
                        </span>
                      ) : quote.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> SALES APPROVED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                          <Clock className="w-3 h-3" /> {quote.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="text-slate-800">{quote.rfq?.customerName}</strong> ({quote.rfq?.rfqNumber})
                      </span>
                      <span>Prepared by: <strong className="text-slate-700">{quote.creator?.name || 'Estimator'}</strong></span>
                      {quote.approver && (
                        <span>Approved by: <strong className="text-slate-700">{quote.approver.name}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Financial Values & Actions */}
                  <div className="text-right flex flex-col sm:items-end gap-2">
                    <div>
                      <div className="text-lg font-bold text-slate-900 font-mono">
                        {formatCurrency(quote.totalIncludingGST || quote.subtotalBeforeTax)}
                      </div>
                      <div className="text-xs text-emerald-700 font-semibold font-mono">
                        ACV: {formatLakhCrore(acv)} ({Number(quote.marginPercentage || 15).toFixed(1)}% margin)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPDF(quote)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Quote</span>
                      </button>

                      {/* MD Sign Deal Button */}
                      {(isMD || isSalesHead) && !isSignedByMD && (
                        <button
                          onClick={() => openSignModal(quote)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow-sm transition"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Sign Deal as MD</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Parts Breakdown in Quotation */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Contract Parts & Pricing Breakdown</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-md">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Part Details</th>
                          <th className="py-2 px-3">Material Grade</th>
                          <th className="py-2 px-3 text-right">Annual Run</th>
                          <th className="py-2 px-3 text-right">Material ₹</th>
                          <th className="py-2 px-3 text-right">Machining ₹</th>
                          <th className="py-2 px-3 text-right">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(quote.parts || []).map((qp) => (
                          <tr key={qp.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {qp.part?.partName || 'Machined Component'}
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-mono">
                              {qp.part?.material || 'EN8'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                              {(qp.quotedAnnualVolume || 0).toLocaleString('en-IN')} pcs
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              ₹{parseFloat(qp.materialCost || 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              ₹{parseFloat(qp.conversionCost || 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-700">
                              ₹{parseFloat(qp.totalCostPerUnit || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Managing Director Digital Seal Box */}
                {isSignedByMD && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                        <Award className="w-4 h-4 text-amber-700" />
                        <span>Digitally Signed & Executed by {quote.mdSignedBy}</span>
                      </div>
                      <span className="font-mono text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                        SEAL: {quote.mdSignatureHash}
                      </span>
                    </div>
                    {quote.mdDealNotes && (
                      <p className="text-xs text-amber-900/90 italic">
                        "{quote.mdDealNotes}"
                      </p>
                    )}
                    <div className="text-[10px] font-mono text-amber-700/70">
                      Executed at: {new Date(quote.mdSignedAt).toLocaleString('en-IN')} • Company A Chakan Executive Registry
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MD Deal Sign-off Modal */}
      {dealModalOpen && selectedQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Executive Deal Sign-off — Managing Director
                </h3>
              </div>
              <button
                onClick={() => setDealModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Quotation:</span>
                <strong className="text-slate-900 font-mono">{selectedQuote.quotationNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Customer OEM:</span>
                <strong className="text-slate-900">{selectedQuote.rfq?.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Annual Contract Value:</span>
                <strong className="text-emerald-700 font-bold">{formatLakhCrore(selectedQuote.annualContractValue)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Contribution Margin:</span>
                <strong className="text-slate-900">{Number(selectedQuote.marginPercentage || 15).toFixed(1)}%</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Executive Deal Authorization Remarks
              </label>
              <textarea
                rows={3}
                value={dealNotes}
                onChange={(e) => setDealNotes(e.target.value)}
                placeholder="Enter executive contract approval remarks or terms agreement..."
                className="w-full p-2.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
              Signing this deal will apply your Managing Director cryptographic verification seal, transition the RFQ status to <strong>WON</strong>, and stamp your executive sign-off on the generated PDF quotation.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDealModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={signDealMutation.isPending}
                onClick={handleConfirmSignDeal}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-sm flex items-center gap-1.5"
              >
                {signDealMutation.isPending && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Sign & Execute Deal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
