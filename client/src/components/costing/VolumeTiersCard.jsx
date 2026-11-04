// client/src/components/costing/VolumeTiersCard.jsx
import React from 'react';
import { Layers, ShieldAlert, CheckCircle2, TrendingDown, Award } from 'lucide-react';
import { formatCurrency, formatLakhCrore } from '../../utils/currency';

export function VolumeTiersCard({ tiers = [], requiresCommercialApproval }) {
  if (!tiers || tiers.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* High-Value Approval Warning / Standard Delegation Banner */}
      {requiresCommercialApproval ? (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-amber-900 text-sm">
              Commercial Approval Mandatory (&ge; ₹25 Lakh Annual Contract Value)
            </h4>
            <p className="text-amber-800 mt-0.5">
              Because the projected annual contract value exceeds <strong>₹25,00,000</strong>, ForgeQuote enforces two-person governance. The quotation cannot be dispatched until formally approved by the <strong>Sales Head</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Standard Delegation:</strong> Annual contract value is within the ₹25 Lakh threshold. Standard single-step sign-off applies.
          </span>
        </div>
      )}

      {/* 3 Tiers Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier, idx) => {
          const isBaseline = idx === 1;

          return (
            <div
              key={idx}
              className={`rounded-lg border transition shadow-sm overflow-hidden flex flex-col justify-between ${
                isBaseline
                  ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div
                className={`p-3.5 border-b ${
                  isBaseline
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {tier.tierName || `Tier ${idx + 1}`}
                  </span>
                  {isBaseline && (
                    <span className="flex items-center gap-1 text-[10px] bg-white text-blue-700 font-bold px-2 py-0.5 rounded shadow-sm">
                      <Award className="w-3 h-3" /> Baseline
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className={`text-lg font-black font-mono ${isBaseline ? 'text-white' : 'text-slate-900'}`}>
                    {(tier.annualVolume || 0).toLocaleString('en-IN')}
                    <span className={`text-xs font-normal ml-1 ${isBaseline ? 'text-blue-100' : 'text-slate-500'}`}>
                      units/yr
                    </span>
                  </span>
                  <span className={`text-xs font-mono font-semibold ${isBaseline ? 'text-blue-100' : 'text-slate-600'}`}>
                    {formatLakhCrore(tier.annualContractValue)}
                  </span>
                </div>
              </div>

              {/* Line Item Breakdown */}
              <div className="p-4 space-y-2 text-xs flex-1">
                <div className="flex justify-between text-slate-600">
                  <span>Net Raw Material:</span>
                  <span className="font-mono">{formatCurrency(tier.materialCost)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Machining Conversion:</span>
                  <span className="font-mono">{formatCurrency(tier.conversionCost)}</span>
                </div>

                <div className="flex justify-between text-slate-600 bg-slate-50 p-1 rounded">
                  <span className="flex items-center gap-1">
                    <span>Setup Amortisation:</span>
                    {idx === 2 && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
                        <TrendingDown className="w-3 h-3" /> Low
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatCurrency(tier.setupCost)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Factory Overhead:</span>
                  <span className="font-mono">{formatCurrency(tier.overheadCost)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Packaging & Freight:</span>
                  <span className="font-mono">
                    {formatCurrency((tier.packingCost || 0) + (tier.freightCost || 0))}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800">
                  <span>Total Unit Cost:</span>
                  <span className="font-mono">{formatCurrency(tier.totalUnitCost)}</span>
                </div>

                <div className="flex justify-between font-bold text-blue-900">
                  <span>Pre-GST Quoted Price:</span>
                  <span className="font-mono">{formatCurrency(tier.sellingPriceBeforeGST)}</span>
                </div>

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>GST (18%):</span>
                  <span className="font-mono">+{formatCurrency(tier.gstAmount)}</span>
                </div>
              </div>

              {/* Final Unit Price Box */}
              <div
                className={`p-3.5 border-t ${
                  isBaseline
                    ? 'bg-blue-100/60 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Final Quoted Price (with GST)
                </div>
                <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                  {formatCurrency(tier.finalPrice)}
                  <span className="text-xs font-normal text-slate-500 ml-1">/ part</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
