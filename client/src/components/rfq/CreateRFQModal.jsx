// client/src/components/rfq/CreateRFQModal.jsx
import React, { useState } from 'react';
import { X, Building2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { useCreateRFQ } from '../../hooks/useRFQs';

export function CreateRFQModal({ isOpen, onClose, onSuccess }) {
  const createRFQ = useCreateRFQ();

  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState('Two-Wheeler OEM');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    try {
      const payload = {
        customerName: customerName.trim(),
        customerType: customerType || null,
        receivedAt: new Date().toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };

      const newRFQ = await createRFQ.mutateAsync(payload);
      onSuccess?.(newRFQ);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create RFQ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-blue-600 text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Create New RFQ</h3>
              <p className="text-[11px] text-slate-400">Initialize a new manufacturing inquiry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / OEM Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Bajaj Auto Ltd, Akurdi Plant"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Industry Segment / Customer Type
            </label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition bg-white"
            >
              <option value="Two-Wheeler OEM">Two-Wheeler OEM</option>
              <option value="Tractor & Heavy Equipment">Tractor & Heavy Equipment</option>
              <option value="Automotive Tier-1 OEM">Automotive Tier-1 OEM</option>
              <option value="Commercial Vehicle OEM">Commercial Vehicle OEM</option>
              <option value="General Engineering">General Engineering</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quotation Submission Due Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Used for automated overdue tracking and turnaround compliance monitoring.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRFQ.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-sm transition flex items-center gap-2"
            >
              {createRFQ.isPending ? 'Generating RFQ...' : 'Create RFQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
