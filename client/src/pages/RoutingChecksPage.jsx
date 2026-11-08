// client/src/pages/RoutingChecksPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Building,
  Wrench,
  FileText,
  UserCheck,
  Send,
  Check,
  X,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export function RoutingChecksPage() {
  const queryClient = useQueryClient();
  const { user, isPlantHead, isMD, isSalesHead } = useAuth();

  const [filter, setFilter] = useState('ALL');
  const [selectedPart, setSelectedPart] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewVerdict, setReviewVerdict] = useState('VERIFIED');
  const [reviewNotes, setReviewNotes] = useState('');

  // Fetch routing checks list
  const { data: parts = [], isLoading, refetch } = useQuery({
    queryKey: ['routing-checks'],
    queryFn: async () => {
      const res = await api.get('/routings/checks');
      return res.data || [];
    },
  });

  // Sign-off mutation
  const signOffMutation = useMutation({
    mutationFn: async ({ partId, status, notes }) => {
      return api.post(`/parts/${partId}/routing-signoff`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-checks'] });
      setReviewModalOpen(false);
      setSelectedPart(null);
      setReviewNotes('');
    },
  });

  const openReviewModal = (part, verdict) => {
    setSelectedPart(part);
    setReviewVerdict(verdict);
    setReviewNotes(
      verdict === 'VERIFIED'
        ? 'Plant feasibility verified: machine capabilities, spindle clearances, and cycle times confirmed for Chakan Bay 2.'
        : 'Cycle time too optimistic for roughing pass. Recommend increasing by 1.2 min or shifting to 4-axis VMC.'
    );
    setReviewModalOpen(true);
  };

  const handleConfirmReview = () => {
    if (!selectedPart) return;
    signOffMutation.mutate({
      partId: selectedPart.id,
      status: reviewVerdict,
      notes: reviewNotes,
    });
  };

  // Filter parts
  const filteredParts = parts.filter((p) => {
    if (filter === 'ALL') return true;
    const currentStatus = p.routingStatus || 'PENDING_REVIEW';
    return currentStatus === filter;
  });

  const counts = {
    all: parts.length,
    pending: parts.filter((p) => (p.routingStatus || 'PENDING_REVIEW') === 'PENDING_REVIEW').length,
    verified: parts.filter((p) => p.routingStatus === 'VERIFIED').length,
    revision: parts.filter((p) => p.routingStatus === 'REVISION_REQUIRED').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Plant Routing & Feasibility Reviews
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-800 text-white uppercase">
              Plant Head • Checks Routings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Validate manufacturing operations, cycle times, setup hours, and machine-hour rates for Company A Chakan plant feasibility.
          </p>
        </div>

        {/* Plant Head Identity Banner */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
          <Wrench className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-semibold">Plant Authority: </span>
            <span>Vikram Shinde (Plant Head)</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`p-3.5 rounded-lg border text-left transition ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
        >
          <div className="text-[10px] uppercase font-mono tracking-wider opacity-75">All Parts</div>
          <div className="text-xl font-bold mt-0.5">{counts.all}</div>
        </button>

        <button
          onClick={() => setFilter('PENDING_REVIEW')}
          className={`p-3.5 rounded-lg border text-left transition ${
            filter === 'PENDING_REVIEW'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800'
          }`}
        >
          <div className="text-[10px] uppercase font-mono tracking-wider opacity-75 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Review
          </div>
          <div className="text-xl font-bold mt-0.5 text-amber-600 group-hover:text-amber-700">
            {counts.pending}
          </div>
        </button>

        <button
          onClick={() => setFilter('VERIFIED')}
          className={`p-3.5 rounded-lg border text-left transition ${
            filter === 'VERIFIED'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800'
          }`}
        >
          <div className="text-[10px] uppercase font-mono tracking-wider opacity-75 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Feasibility Verified
          </div>
          <div className="text-xl font-bold mt-0.5 text-emerald-600">
            {counts.verified}
          </div>
        </button>

        <button
          onClick={() => setFilter('REVISION_REQUIRED')}
          className={`p-3.5 rounded-lg border text-left transition ${
            filter === 'REVISION_REQUIRED'
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-white border-slate-200 hover:border-rose-300 text-slate-800'
          }`}
        >
          <div className="text-[10px] uppercase font-mono tracking-wider opacity-75 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Revision Requested
          </div>
          <div className="text-xl font-bold mt-0.5 text-rose-600">
            {counts.revision}
          </div>
        </button>
      </div>

      {/* Parts List with Operations Review */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading parts and manufacturing routings...
        </div>
      ) : filteredParts.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
          No parts matching the selected filter ({filter}).
        </div>
      ) : (
        <div className="space-y-4">
          {filteredParts.map((part) => {
            const status = part.routingStatus || 'PENDING_REVIEW';
            const totalCycleTime = (part.operations || []).reduce(
              (sum, op) => sum + parseFloat(op.cycleTimeMinutes || 0),
              0
            );

            return (
              <div
                key={part.id}
                className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4 hover:border-slate-300 transition"
              >
                {/* Part Header & OEM Customer */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{part.partName}</h3>
                      {part.partNumber && (
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          #{part.partNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {part.rfq?.customerName || 'OEM Customer'} ({part.rfq?.rfqNumber})
                      </span>
                      <span>Grade: <strong className="text-slate-700">{part.material || 'EN8'}</strong></span>
                      <span>Weight: <strong className="text-slate-700">{Number(part.netWeightKg || 0).toFixed(3)} kg</strong> net / <strong className="text-slate-700">{Number(part.grossWeightKg || 0).toFixed(3)} kg</strong> gross</span>
                      <span>Volume: <strong className="text-slate-700">{(part.annualVolume || 0).toLocaleString('en-IN')} pcs/yr</strong></span>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Feasibility Verified</span>
                      </span>
                    ) : status === 'REVISION_REQUIRED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Revision Requested</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Plant Review</span>
                      </span>
                    )}

                    {/* Plant Head Action Buttons */}
                    {(isPlantHead || isMD || isSalesHead) && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openReviewModal(part, 'VERIFIED')}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium shadow-sm transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                        <button
                          onClick={() => openReviewModal(part, 'REVISION_REQUIRED')}
                          className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-medium transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Request Fix</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" />
                      <span>Manufacturing Operations & Routing Flow ({(part.operations || []).length} steps)</span>
                    </span>
                    <span>Total Machining Cycle Time: <strong className="text-slate-900 font-mono">{totalCycleTime.toFixed(2)} min</strong></span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-md">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 w-12 text-center">Seq</th>
                          <th className="py-2 px-3">Operation Description</th>
                          <th className="py-2 px-3">Machine Bay / Center</th>
                          <th className="py-2 px-3 text-right">Cycle Time</th>
                          <th className="py-2 px-3 text-right">Hour Rate</th>
                          <th className="py-2 px-3 text-right">Setup Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(part.operations || []).map((op) => (
                          <tr key={op.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center font-mono text-slate-500 font-bold">
                              {op.operationSequence}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {op.operationName}
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-mono">
                              {op.machineType}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                              {parseFloat(op.cycleTimeMinutes).toFixed(2)} min
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">
                              ₹{parseFloat(op.machineHourRate).toFixed(2)}/hr
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-500">
                              {parseFloat(op.setupHours || 1.0).toFixed(1)} hrs
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Routing Verification Audit Log / Notes */}
                {part.routingVerifiedBy && (
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Signed off by {part.routingVerifiedBy}
                      </span>
                      {part.routingVerifiedAt && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(part.routingVerifiedAt).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {part.routingNotes && (
                      <p className="text-slate-600 text-xs italic">
                        "{part.routingNotes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sign-Off / Review Dialog Modal */}
      {reviewModalOpen && selectedPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Plant Head Feasibility Review
                </h3>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1 text-slate-600">
              <div>Part: <strong className="text-slate-900">{selectedPart.partName}</strong></div>
              <div>Customer: <strong className="text-slate-900">{selectedPart.rfq?.customerName}</strong> ({selectedPart.rfq?.rfqNumber})</div>
              <div>Operations: <strong className="text-slate-900">{(selectedPart.operations || []).length} routing steps</strong></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Engineering Verdict
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewVerdict('VERIFIED')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    reviewVerdict === 'VERIFIED'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Verify Feasible</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewVerdict('REVISION_REQUIRED')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    reviewVerdict === 'REVISION_REQUIRED'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <X className="w-4 h-4" />
                  <span>Request Revision</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plant Feasibility Remarks / Tooling Clearances
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter technical observations, machine bay tooling validation, or cycle time feedback..."
                className="w-full p-2.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={signOffMutation.isPending}
                onClick={handleConfirmReview}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm flex items-center gap-1.5"
              >
                {signOffMutation.isPending && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Submit Plant Review</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
