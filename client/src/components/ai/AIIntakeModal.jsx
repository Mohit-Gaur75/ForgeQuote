// client/src/components/ai/AIIntakeModal.jsx
import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Building2,
  Calendar,
  Package,
} from 'lucide-react';
import { useExtractRFQ, useConfirmExtraction } from '../../hooks/useAI';
import { AIFieldCard } from './AIFieldCard';

export function AIIntakeModal({ isOpen, onClose, rfqId, onConfirmed }) {
  const extractRFQ = useExtractRFQ(rfqId);
  const confirmExtraction = useConfirmExtraction(rfqId);

  // Step 1 State: Input texts
  const [step, setStep] = useState(1); // 1 = Input, 2 = Verify
  const [emailText, setEmailText] = useState('');
  const [partListText, setPartListText] = useState('');
  const [error, setError] = useState(null);

  // Step 2 State: Extracted results & verification
  const [extractionResult, setExtractionResult] = useState(null);

  if (!isOpen) return null;

  // Synthetic Quick-Load Templates
  const handleLoadSample = (sampleType) => {
    setError(null);
    if (sampleType === 'spindle') {
      setEmailText(
        `Dear Team,\nPlease quote for our Rear wheel spindle component in EN8 grade steel.\nWe require 180,000 units per annum on a scheduled delivery cadence.\nPlease provide commercial proposal before 15-Nov-2026.\n\nBest Regards,\nProcurement Lead\nBajaj Auto Ltd (Akurdi)`
      );
      setPartListText(
        `Part Code: SP-001\nPart Name: Rear wheel spindle\nMaterial: EN8\nFinished Net Weight: 0.610 kg\nTarget Annual Volume: 180,000 pcs`
      );
    } else if (sampleType === 'liftarm') {
      setEmailText(
        `Hello Commercial Team,\nRequesting quotation for Hydraulic lift arm for tractor 3-point linkage.\nMaterial specified is 40Cr4 alloy forging steel.\nAnnual expected schedule: 24,000 units.\nQuotation required within 7 working days.\n\nThanks,\nSourcing Division\nMahindra Tractors (Nagpur)`
      );
      setPartListText(
        `Item: LA-402\nDescription: Hydraulic lift arm\nMaterial: 40Cr4 forging\nGross Weight: 5.0 kg\nNet Weight: 4.60 kg\nVolume: 24,000 units/year`
      );
    } else if (sampleType === 'gearblank') {
      setEmailText(
        `Dear Rajesh,\nKindly submit price quote for intermediate Gear blank forgings in 20MnCr5 steel.\nVolume commitment: 60,000 pieces per year.\nDrawing attached.\n\nRegards,\nTata Motors Tier-1 Transmission`
      );
      setPartListText(
        `Part No: GB-108\nPart: Gear blank\nMaterial: 20MnCr5\nNet Weight: 1.48 kg\nAnnual Vol: 60,000`
      );
    }
  };

  const handleRunExtraction = async () => {
    setError(null);
    if (!emailText.trim() && !partListText.trim()) {
      setError('Please paste customer email text or bill of materials part list text.');
      return;
    }

    try {
      const data = await extractRFQ.mutateAsync({ emailText, partListText });
      setExtractionResult(data);
      setStep(2);
    } catch (err) {
      setError(err.message || 'AI extraction failed. Please try again or enter details manually.');
    }
  };

  // Field update handlers for verified state
  const handleUpdatePartField = (partIndex, fieldName, newValue) => {
    setExtractionResult((prev) => {
      const updatedParts = [...prev.parts];
      updatedParts[partIndex] = {
        ...updatedParts[partIndex],
        [fieldName]: {
          ...updatedParts[partIndex][fieldName],
          value: newValue,
        },
      };
      return { ...prev, parts: updatedParts };
    });
  };

  const handleUpdatePartStatus = (partIndex, fieldName, newStatus) => {
    setExtractionResult((prev) => {
      const updatedParts = [...prev.parts];
      updatedParts[partIndex] = {
        ...updatedParts[partIndex],
        [fieldName]: {
          ...updatedParts[partIndex][fieldName],
          verificationStatus: newStatus,
        },
      };
      return { ...prev, parts: updatedParts };
    });
  };

  // Submit verified data to create actual Part records
  const handleConfirmAll = async () => {
    if (!extractionResult) return;
    setError(null);

    try {
      const confirmedParts = extractionResult.parts.map((p) => ({
        partName: p.partName.value || 'Unnamed Component',
        partNumber: p.partNumber?.value || null,
        material: p.material?.value || 'EN8',
        netWeightKg: p.netWeightKg?.value ? Number(p.netWeightKg.value) : null,
        grossWeightKg: p.grossWeightKg?.value ? Number(p.grossWeightKg.value) : null,
        scrapPercentage: 5.0,
        annualVolume: p.annualVolume?.value ? Number(p.annualVolume.value) : 100000,
        setupHours: 2.0,
      }));

      await confirmExtraction.mutateAsync({
        extractionId: extractionResult.extractionId,
        confirmedData: {
          confirmedCustomerName: extractionResult.customerName?.value || null,
          confirmedDueDate: extractionResult.dueDate?.value || null,
          parts: confirmedParts,
        },
      });

      onConfirmed?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to commit verified components');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">AI RFQ Intake & Extraction</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
                  {step === 1 ? 'Step 1: Input Ingestion' : 'Step 2: Human Verification'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Structured JSON extraction with confidence scoring and source tracing
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Text Inputs */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Demo Quick Load Helpers */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-semibold text-slate-700">Quick-Load Demo Inquiries:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('spindle')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 shadow-xs transition"
                  >
                    Part A: Spindle (EN8)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('liftarm')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 shadow-xs transition"
                  >
                    Part B: Lift Arm (40Cr4)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('gearblank')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 shadow-xs transition"
                  >
                    Part C: Gear Blank (20MnCr5)
                  </button>
                </div>
              </div>

              {/* Email Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Email Text
                </label>
                <textarea
                  rows={5}
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder="Paste customer inquiry email body here..."
                  className="w-full p-3 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                />
              </div>

              {/* Part List / BOM Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Part List / BOM Table Text
                </label>
                <textarea
                  rows={4}
                  value={partListText}
                  onChange={(e) => setPartListText(e.target.value)}
                  placeholder="Paste copied Excel part list or BOM specification lines here..."
                  className="w-full p-3 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Confidentiality Protection</strong>: Engineering drawing PDFs and CAD files are never uploaded or transmitted to external AI endpoints. Only plain text metadata is processed ephemerally.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Human Verification Workspace */}
          {step === 2 && extractionResult && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Mandatory Estimator Verification</strong>: Review each extracted value against its source excerpt. Click <strong>✓ (Accept)</strong>, <strong>✎ (Edit)</strong>, or <strong>✗ (Reject)</strong>.
                </div>
              </div>

              {/* RFQ Meta Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AIFieldCard
                  label="Customer / OEM Name"
                  field={extractionResult.customerName}
                  onChange={(val) => {
                    setExtractionResult((prev) => ({
                      ...prev,
                      customerName: { ...prev.customerName, value: val },
                    }));
                  }}
                  onStatusChange={(status) => {
                    setExtractionResult((prev) => ({
                      ...prev,
                      customerName: { ...prev.customerName, verificationStatus: status },
                    }));
                  }}
                />

                <AIFieldCard
                  label="Target Submission Due Date"
                  field={extractionResult.dueDate}
                  onChange={(val) => {
                    setExtractionResult((prev) => ({
                      ...prev,
                      dueDate: { ...prev.dueDate, value: val },
                    }));
                  }}
                  onStatusChange={(status) => {
                    setExtractionResult((prev) => ({
                      ...prev,
                      dueDate: { ...prev.dueDate, verificationStatus: status },
                    }));
                  }}
                />
              </div>

              {/* Extracted Parts Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Extracted Components ({extractionResult.parts.length})</span>
                  </h4>
                </div>

                {extractionResult.parts.map((part, pIdx) => (
                  <div key={pIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-900 text-xs font-mono">
                        Component #{pIdx + 1}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {part.partNumber?.value || 'Unassigned Part Number'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <AIFieldCard
                        label="Component Name"
                        field={part.partName}
                        onChange={(val) => handleUpdatePartField(pIdx, 'partName', val)}
                        onStatusChange={(st) => handleUpdatePartStatus(pIdx, 'partName', st)}
                      />

                      <AIFieldCard
                        label="Drawing / Part No"
                        field={part.partNumber}
                        onChange={(val) => handleUpdatePartField(pIdx, 'partNumber', val)}
                        onStatusChange={(st) => handleUpdatePartStatus(pIdx, 'partNumber', st)}
                      />

                      <AIFieldCard
                        label="Material Grade"
                        field={part.material}
                        onChange={(val) => handleUpdatePartField(pIdx, 'material', val)}
                        onStatusChange={(st) => handleUpdatePartStatus(pIdx, 'material', st)}
                      />

                      <AIFieldCard
                        label="Finished Net Weight (kg)"
                        field={part.netWeightKg}
                        onChange={(val) => handleUpdatePartField(pIdx, 'netWeightKg', val)}
                        onStatusChange={(st) => handleUpdatePartStatus(pIdx, 'netWeightKg', st)}
                      />

                      <AIFieldCard
                        label="Gross Raw Weight (kg)"
                        field={part.grossWeightKg}
                        onChange={(val) => handleUpdatePartField(pIdx, 'grossWeightKg', val)}
                        onStatusChange={(st) => handleUpdatePartStatus(pIdx, 'grossWeightKg', st)}
                      />

                      <AIFieldCard
                        label="Annual Volume (Units)"
                        field={part.annualVolume}
                        onChange={(val) => handleUpdatePartField(pIdx, 'annualVolume', val)}
                        onStatusChange={(st) => handleUpdatePartStatus(pIdx, 'annualVolume', st)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-md transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRunExtraction}
                disabled={extractRFQ.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition"
              >
                {extractRFQ.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Inquiries with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Extraction</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-md transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Text Input</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAll}
                disabled={confirmExtraction.isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition"
              >
                {confirmExtraction.isPending ? (
                  'Committing Components...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Commit Verified Components to RFQ</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
