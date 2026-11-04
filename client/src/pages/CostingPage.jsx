// client/src/pages/CostingPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Box,
  Percent,
  TrendingUp,
  Cpu,
  Package,
  Truck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePartCosting, useCalculateCosting, useSaveCosting } from '../hooks/useCosting';
import { useEffectiveRates } from '../hooks/useRates';
import { OperationsEditor } from '../components/costing/OperationsEditor';
import { VolumeTiersCard } from '../components/costing/VolumeTiersCard';
import { formatCurrency } from '../utils/currency';

export function CostingPage() {
  const { id: partId } = useParams();
  const navigate = useNavigate();
  const { isEstimator } = useAuth();

  const { data: partData, isLoading: isPartLoading, error: partError } = usePartCosting(partId);
  const { data: effectiveRates } = useEffectiveRates();

  const calculateMutation = useCalculateCosting(partId);
  const saveMutation = useSaveCosting(partId, partData?.part?.rfqId);

  // Form State
  const [formData, setFormData] = useState({
    netWeightKg: 0.61,
    grossWeightKg: null,
    scrapPercentage: 5.0,
    materialGrade: 'EN8',
    materialRatePerKg: 85.0,
    annualVolume: 180000,
    partSetupHours: 0,
    overheadPercentage: 4.0,
    packingPerUnit: 4.0,
    freightPerUnit: 2.0,
    grossMarginPercentage: 15.0,
    gstPercentage: 18.0,
    operations: [],
  });

  // Calculation Results
  const [calculation, setCalculation] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Populate from fetched part data
  useEffect(() => {
    if (partData?.part) {
      const p = partData.part;

      // Extract operations if present
      const existingOps = (p.operations || []).map((op) => ({
        operationSequence: op.operationSequence,
        operationName: op.operationName,
        machineType: op.machineType,
        cycleTimeMinutes: parseFloat(op.cycleTimeMinutes) || 1.5,
        machineHourRate: parseFloat(op.machineHourRate) || 450,
        setupHours: op.setupHours ? parseFloat(op.setupHours) : 0.5,
        machineRateVersionId: op.machineRateVersionId || null,
      }));

      // Default operations if none exist
      const defaultOps = existingOps.length > 0 ? existingOps : [
        {
          operationSequence: 10,
          operationName: 'CNC Rough & Finish Turning',
          machineType: 'CNC Lathe',
          cycleTimeMinutes: 3.2,
          machineHourRate: 850.0,
          setupHours: 2.0,
        },
      ];

      // Match raw material rate from active rates if available
      let matchedMaterialRate = 85.0;
      if (effectiveRates?.MATERIAL && p.material) {
        const mat = effectiveRates.MATERIAL.find(
          (m) => m.materialGrade?.toLowerCase() === p.material.toLowerCase() ||
                 m.rateName?.toLowerCase().includes(p.material.toLowerCase())
        );
        if (mat) {
          matchedMaterialRate = parseFloat(mat.rateValue);
        }
      }

      setFormData({
        netWeightKg: p.netWeightKg ? parseFloat(p.netWeightKg) : 0.61,
        grossWeightKg: p.grossWeightKg ? parseFloat(p.grossWeightKg) : null,
        scrapPercentage: p.scrapPercentage ? parseFloat(p.scrapPercentage) : 5.0,
        materialGrade: p.material || 'EN8',
        materialRatePerKg: matchedMaterialRate,
        annualVolume: p.annualVolume || 180000,
        partSetupHours: p.setupHours ? parseFloat(p.setupHours) : 0,
        overheadPercentage: 4.0,
        packingPerUnit: 4.0,
        freightPerUnit: 2.0,
        grossMarginPercentage: 15.0,
        gstPercentage: 18.0,
        operations: defaultOps,
      });

      // Initial calculation trigger
      runCalculation({
        netWeightKg: p.netWeightKg ? parseFloat(p.netWeightKg) : 0.61,
        grossWeightKg: p.grossWeightKg ? parseFloat(p.grossWeightKg) : null,
        scrapPercentage: p.scrapPercentage ? parseFloat(p.scrapPercentage) : 5.0,
        materialRatePerKg: matchedMaterialRate,
        annualVolume: p.annualVolume || 180000,
        partSetupHours: p.setupHours ? parseFloat(p.setupHours) : 0,
        overheadPercentage: 4.0,
        packingPerUnit: 4.0,
        freightPerUnit: 2.0,
        grossMarginPercentage: 15.0,
        gstPercentage: 18.0,
        operations: defaultOps,
      });
    }
  }, [partData]);

  const runCalculation = async (dataToCalc = formData) => {
    try {
      const result = await calculateMutation.mutateAsync(dataToCalc);
      setCalculation(result);
    } catch (err) {
      console.error('Calculation failed:', err);
    }
  };

  const handleFieldChange = (field, value) => {
    setHasUnsavedChanges(true);
    setSaveSuccessMsg('');
    const updated = { ...formData, [field]: value };

    // Auto-update material rate if material grade changes
    if (field === 'materialGrade' && effectiveRates?.MATERIAL) {
      const match = effectiveRates.MATERIAL.find(
        (m) => m.materialGrade?.toLowerCase() === value.toLowerCase() ||
               m.rateName?.toLowerCase().includes(value.toLowerCase())
      );
      if (match) {
        updated.materialRatePerKg = parseFloat(match.rateValue);
      }
    }

    setFormData(updated);
  };

  const handleSaveCosting = async () => {
    try {
      await saveMutation.mutateAsync(formData);
      setHasUnsavedChanges(false);
      setSaveSuccessMsg('Costing draft successfully saved to part and locked for quotation.');
      // Refresh calculation
      await runCalculation(formData);
    } catch (err) {
      console.error('Failed to save costing:', err);
    }
  };

  if (isPartLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading Part Costing Workspace...</span>
      </div>
    );
  }

  if (partError || !partData) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-red-200 text-red-600 text-xs">
        Failed to load part: {partError?.message || 'Not found'}
      </div>
    );
  }

  const part = partData.part;
  const isSub8Margin = parseFloat(formData.grossMarginPercentage) < 8.0;

  // Auto-derived gross weight preview
  const derivedGross = formData.grossWeightKg
    ? formData.grossWeightKg
    : (formData.netWeightKg / (1 - formData.scrapPercentage / 100)).toFixed(4);

  return (
    <div className="space-y-6 pb-24">
      {/* Top Breadcrumb & Part Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/rfqs" className="hover:text-blue-600">
              RFQs
            </Link>
            <span>/</span>
            <Link to={`/rfqs/${part.rfqId}`} className="hover:text-blue-600">
              RFQ Details
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Costing Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {part.partName}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-white">
              {part.partNumber || 'PART-NO-ID'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Grade: {formData.materialGrade}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/rfqs/${part.rfqId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to RFQ</span>
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg('')}
            className="text-[11px] font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: Inputs (Left) and Live Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cost Model Inputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Raw Material & Scrap */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Box className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                1. Raw Material & Scrap Parameters
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Net Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.netWeightKg}
                  onChange={(e) => handleFieldChange('netWeightKg', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Scrap Recovery (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="99"
                  value={formData.scrapPercentage}
                  onChange={(e) => handleFieldChange('scrapPercentage', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Derived Gross Weight (kg)
                </label>
                <div className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs">
                  {derivedGross} kg
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Material Benchmark Grade
                </label>
                <select
                  value={formData.materialGrade}
                  onChange={(e) => handleFieldChange('materialGrade', e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="EN8">EN8 Carbon Steel</option>
                  <option value="40Cr4">40Cr4 Alloy Steel</option>
                  <option value="20MnCr5">20MnCr5 Case Hardening</option>
                  <option value="EN19">EN19 / 4140 Chrome Moly</option>
                  <option value="SS304">SS304 Stainless</option>
                  <option value="Custom">Custom Grade</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Material Rate (INR/kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={formData.materialRatePerKg}
                  onChange={(e) => handleFieldChange('materialRatePerKg', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Baseline Annual Volume
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1"
                  value={formData.annualVolume}
                  onChange={(e) => handleFieldChange('annualVolume', parseInt(e.target.value) || 1000)}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Manufacturing Routing & Operations Editor */}
          <OperationsEditor
            operations={formData.operations}
            onChange={(ops) => handleFieldChange('operations', ops)}
            effectiveRates={effectiveRates}
          />

          {/* Section 3: Logistics & Commercial Margins */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Percent className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                3. Factory Overhead, Logistics & Commercial Margin
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Factory Overhead (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={formData.overheadPercentage}
                  onChange={(e) => handleFieldChange('overheadPercentage', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Packaging (INR/part)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.packingPerUnit}
                  onChange={(e) => handleFieldChange('packingPerUnit', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Freight (INR/part)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.freightPerUnit}
                  onChange={(e) => handleFieldChange('freightPerUnit', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Target Gross Margin (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="99.9"
                  value={formData.grossMarginPercentage}
                  onChange={(e) => handleFieldChange('grossMarginPercentage', parseFloat(e.target.value) || 0)}
                  className={`w-full font-mono font-bold rounded px-2.5 py-1.5 border focus:ring-1 focus:ring-blue-500 ${
                    isSub8Margin
                      ? 'border-red-400 bg-red-50 text-red-900'
                      : 'border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Sub-8% Margin Alert */}
            {isSub8Margin && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2.5 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  <strong>Sub-Optimal Margin Warning:</strong> Target gross margin is below the mandatory <strong>8.0%</strong> threshold. Quotation will require commercial justification during approval.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Costing Summary & Volume Tiers */}
        <div className="lg:col-span-5 space-y-6">
          {calculation ? (
            <>
              {/* Baseline Summary Card */}
              <div className="bg-slate-900 text-white rounded-lg p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                    Baseline Quote Summary
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                    100% Volume
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Net Material Cost:</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(calculation.summary?.materialCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Conversion (Machining):</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(calculation.summary?.conversionCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Setup Amortisation:</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(calculation.summary?.setupCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Factory Overhead:</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(calculation.summary?.overheadCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Packing & Freight:</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(
                        (calculation.summary?.packingCost || 0) + (calculation.summary?.freightCost || 0)
                      )}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-blue-300">
                    <span>Total Factory Unit Cost:</span>
                    <span className="font-mono">
                      {formatCurrency(calculation.summary?.totalUnitCost)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-white">
                    <span>Pre-GST Quoted Price:</span>
                    <span className="font-mono">
                      {formatCurrency(calculation.summary?.sellingPriceBeforeGST)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400">
                    <span>GST 18%:</span>
                    <span className="font-mono">
                      +{formatCurrency(calculation.summary?.gstAmount)}
                    </span>
                  </div>
                </div>

                {/* Final Quote Hero */}
                <div className="p-4 bg-slate-800/90 rounded-md border border-slate-700/80 mt-3 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    Final Quoted Price (with GST)
                  </span>
                  <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                    {formatCurrency(calculation.summary?.finalPrice)}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ piece</span>
                  </div>
                </div>
              </div>

              {/* 3 Volume Tiers Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Multi-Tier Volume Amortisation (50%, 100%, 150%)
                  </h3>
                </div>

                <VolumeTiersCard
                  tiers={calculation.tiers}
                  requiresCommercialApproval={calculation.requiresCommercialApproval}
                />
              </div>
            </>
          ) : (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500">
              <Calculator className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Click &quot;Recalculate Costing&quot; to compute pricing.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasUnsavedChanges ? (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
              Unsaved changes in costing parameters
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500">
              Deterministic calculation engine v1.0 • decimal.js
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => runCalculation(formData)}
            disabled={calculateMutation.isLoading}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${calculateMutation.isLoading ? 'animate-spin' : ''}`} />
            <span>Recalculate Costing</span>
          </button>

          {isEstimator && (
            <button
              type="button"
              onClick={handleSaveCosting}
              disabled={saveMutation.isLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveMutation.isLoading ? 'Saving...' : 'Save Costing Draft'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(`/rfqs/${part.rfqId}`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold shadow-sm transition"
          >
            <span>Finish & Return to RFQ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
