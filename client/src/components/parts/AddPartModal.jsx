// client/src/components/parts/AddPartModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Package, Layers, Scale, AlertCircle } from 'lucide-react';
import { useCreatePart } from '../../hooks/useParts';

export function AddPartModal({ isOpen, onClose, rfqId }) {
  const createPart = useCreatePart(rfqId);

  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [material, setMaterial] = useState('EN8');
  const [netWeightKg, setNetWeightKg] = useState('');
  const [scrapPercentage, setScrapPercentage] = useState('5.0');
  const [grossWeightKg, setGrossWeightKg] = useState('');
  const [isManualGross, setIsManualGross] = useState(false);
  const [annualVolume, setAnnualVolume] = useState('100000');
  const [setupHours, setSetupHours] = useState('2.0');
  const [error, setError] = useState(null);

  // Auto-derive gross weight when net weight or scrap changes (unless manually overridden)
  useEffect(() => {
    if (!isManualGross && netWeightKg && scrapPercentage) {
      const net = parseFloat(netWeightKg);
      const scrap = parseFloat(scrapPercentage);
      if (!isNaN(net) && !isNaN(scrap) && scrap < 100) {
        const derived = (net / (1 - scrap / 100)).toFixed(4);
        setGrossWeightKg(derived);
      }
    }
  }, [netWeightKg, scrapPercentage, isManualGross]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!partName.trim()) {
      setError('Part name is required');
      return;
    }

    try {
      await createPart.mutateAsync({
        partName: partName.trim(),
        partNumber: partNumber.trim() || null,
        material: material.trim() || null,
        netWeightKg: netWeightKg ? parseFloat(netWeightKg) : null,
        scrapPercentage: scrapPercentage ? parseFloat(scrapPercentage) : null,
        grossWeightKg: grossWeightKg ? parseFloat(grossWeightKg) : null,
        annualVolume: annualVolume ? parseInt(annualVolume, 10) : null,
        setupHours: setupHours ? parseFloat(setupHours) : null,
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add part');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-600 text-white">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Add Manufacturing Component</h3>
              <p className="text-[11px] text-slate-400">Specify material, weights, scrap and volume schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Part Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g. Rear wheel spindle"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Drawing / Part Number
              </label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="e.g. SP-001 / DWG-8812"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Raw Material Grade
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="EN8">EN8 (Bright Carbon Steel Bar)</option>
              <option value="40Cr4">40Cr4 (Alloy Forging Steel)</option>
              <option value="20MnCr5">20MnCr5 (Case Hardening Steel)</option>
              <option value="SS304">SS304 (Stainless Steel)</option>
              <option value="Cast Iron Grade 25">Cast Iron Grade 25</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Net Weight (kg)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={netWeightKg}
                onChange={(e) => setNetWeightKg(e.target.value)}
                placeholder="e.g. 0.610"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Scrap %
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="99"
                value={scrapPercentage}
                onChange={(e) => setScrapPercentage(e.target.value)}
                placeholder="5.0"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Gross Weight (kg)</label>
                {!isManualGross && (
                  <span className="text-[10px] text-blue-600 font-mono">Auto</span>
                )}
              </div>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={grossWeightKg}
                onChange={(e) => {
                  setIsManualGross(true);
                  setGrossWeightKg(e.target.value);
                }}
                placeholder="Auto-derived"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Annual Expected Volume (Units/Yr)
              </label>
              <input
                type="number"
                step="1000"
                min="1"
                value={annualVolume}
                onChange={(e) => setAnnualVolume(e.target.value)}
                placeholder="180000"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Setup Time (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={setupHours}
                onChange={(e) => setSetupHours(e.target.value)}
                placeholder="2.0"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPart.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-md shadow-sm transition flex items-center gap-1.5"
            >
              {createPart.isPending ? 'Saving...' : 'Add Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
