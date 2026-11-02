// client/src/components/rates/CreateRateVersionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useCreateRateVersion } from '../../hooks/useRates';
import { formatCurrency } from '../../utils/currency';

export function CreateRateVersionModal({ isOpen, onClose, existingRate }) {
  const createRateMutation = useCreateRateVersion();
  const isUpdatingVersion = Boolean(existingRate);

  const [formData, setFormData] = useState({
    rateType: 'MATERIAL',
    rateName: '',
    materialGrade: '',
    machineType: '',
    rateValue: '',
    unit: 'INR/kg',
    currency: 'INR',
    effectiveFrom: '',
    effectiveTo: '',
    reason: '',
  });

  const [formError, setFormError] = useState('');

  // Default effective date to tomorrow (YYYY-MM-DD)
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (existingRate) {
      // Find tomorrow's date or day after existing effective from
      const existingDate = new Date(existingRate.effectiveFrom);
      const nextDay = new Date(existingDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const defaultFrom = nextDay > new Date() ? nextDay : new Date();

      setFormData({
        rateType: existingRate.rateType,
        rateName: existingRate.rateName,
        materialGrade: existingRate.materialGrade || '',
        machineType: existingRate.machineType || '',
        rateValue: existingRate.rateValue ? String(existingRate.rateValue) : '',
        unit: existingRate.unit || 'INR/kg',
        currency: existingRate.currency || 'INR',
        effectiveFrom: defaultFrom.toISOString().split('T')[0],
        effectiveTo: '',
        reason: '',
      });
    } else {
      setFormData({
        rateType: 'MATERIAL',
        rateName: '',
        materialGrade: '',
        machineType: '',
        rateValue: '',
        unit: 'INR/kg',
        currency: 'INR',
        effectiveFrom: getTomorrowDate(),
        effectiveTo: '',
        reason: '',
      });
    }
    setFormError('');
  }, [existingRate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const val = parseFloat(formData.rateValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Rate value must be a positive number.');
      return;
    }

    if (!formData.effectiveFrom) {
      setFormError('Effective From date is required.');
      return;
    }

    if (isUpdatingVersion) {
      const currentStart = new Date(existingRate.effectiveFrom);
      const newStart = new Date(formData.effectiveFrom);
      if (newStart <= currentStart) {
        setFormError(
          `New version effective date (${newStart.toLocaleDateString()}) must be strictly after previous version start (${currentStart.toLocaleDateString()}).`
        );
        return;
      }

      if (!formData.reason.trim()) {
        setFormError('Please provide a brief justification / commercial reason for this rate change.');
        return;
      }
    }

    try {
      await createRateMutation.mutateAsync({
        rateType: formData.rateType,
        rateName: formData.rateName.trim(),
        materialGrade: formData.materialGrade?.trim() || null,
        machineType: formData.machineType?.trim() || null,
        rateValue: val,
        unit: formData.unit.trim(),
        currency: formData.currency,
        effectiveFrom: new Date(formData.effectiveFrom).toISOString(),
        effectiveTo: formData.effectiveTo ? new Date(formData.effectiveTo).toISOString() : null,
      });
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to publish rate version. Check date overlap.');
    }
  };

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
                {isUpdatingVersion ? `Publish New Version (v${existingRate.versionNumber + 1})` : 'Create New Rate Parameter'}
              </h2>
              <p className="text-xs text-slate-500">
                {isUpdatingVersion
                  ? `Append-only adjustment for ${existingRate.rateName}`
                  : 'Define a new industrial rate master parameter'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {isUpdatingVersion && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md text-xs text-blue-900 flex items-center justify-between">
              <div>
                <span className="font-semibold block">Current Active Benchmark (v{existingRate.versionNumber}):</span>
                <span className="font-mono text-slate-700">
                  {formatCurrency(existingRate.rateValue)} / {existingRate.unit}
                </span>
                <span className="text-[11px] text-slate-500 ml-2">
                  (since {new Date(existingRate.effectiveFrom).toLocaleDateString('en-IN')})
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate Category <span className="text-red-500">*</span>
              </label>
              <select
                disabled={isUpdatingVersion}
                value={formData.rateType}
                onChange={(e) => {
                  const type = e.target.value;
                  let defaultUnit = 'INR/kg';
                  if (type === 'MACHINE_HOUR') defaultUnit = 'INR/hr';
                  if (type === 'OVERHEAD' || type === 'GST') defaultUnit = '%';
                  if (type === 'PACKING' || type === 'FREIGHT') defaultUnit = 'INR/unit';
                  setFormData((prev) => ({ ...prev, rateType: type, unit: defaultUnit }));
                }}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="MATERIAL">Material (INR/kg)</option>
                <option value="MACHINE_HOUR">Machine Hour (INR/hr)</option>
                <option value="OVERHEAD">Factory Overhead (%)</option>
                <option value="PACKING">Packaging (INR/part)</option>
                <option value="FREIGHT">Freight & Logistics (INR/part)</option>
                <option value="GST">GST Rate (%)</option>
                <option value="OTHER">Other Rate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate Name / Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isUpdatingVersion}
                placeholder="e.g. EN8 Bright Bar or CNC Lathe"
                value={formData.rateName}
                onChange={(e) => setFormData((prev) => ({ ...prev, rateName: e.target.value }))}
                required
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {formData.rateType === 'MATERIAL' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Material Grade Identifier
              </label>
              <input
                type="text"
                disabled={isUpdatingVersion}
                placeholder="e.g. EN8, 40Cr4, 20MnCr5"
                value={formData.materialGrade}
                onChange={(e) => setFormData((prev) => ({ ...prev, materialGrade: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {formData.rateType === 'MACHINE_HOUR' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Machine Center Type
              </label>
              <input
                type="text"
                disabled={isUpdatingVersion}
                placeholder="e.g. CNC_LATHE, VMC_3AXIS, CONVENTIONAL"
                value={formData.machineType}
                onChange={(e) => setFormData((prev) => ({ ...prev, machineType: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isUpdatingVersion ? 'New Rate Value' : 'Rate Value'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={formData.rateValue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rateValue: e.target.value }))}
                  className="w-full text-xs font-mono rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measure <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={isUpdatingVersion}
                placeholder="e.g. INR/kg, INR/hr, %"
                value={formData.unit}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                required
                className="w-full text-xs font-mono rounded border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Effective From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.effectiveFrom}
                onChange={(e) => setFormData((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Effective Until <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                placeholder="Leave blank for open-ended"
                value={formData.effectiveTo}
                onChange={(e) => setFormData((prev) => ({ ...prev, effectiveTo: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {isUpdatingVersion && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Justification for Change <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Q4 vendor raw material index increase or power tariff adjustment"
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

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
              disabled={createRateMutation.isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {createRateMutation.isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Publishing Version...</span>
                </>
              ) : isUpdatingVersion ? (
                `Publish Version v${existingRate.versionNumber + 1}`
              ) : (
                'Create Benchmark Rate'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
