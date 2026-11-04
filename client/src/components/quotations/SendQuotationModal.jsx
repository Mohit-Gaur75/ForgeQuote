// client/src/components/quotations/SendQuotationModal.jsx
import React, { useState } from 'react';
import { X, Send, AlertCircle, Sparkles, Building, Mail } from 'lucide-react';
import { useSendQuotation } from '../../hooks/useQuotations';

export function SendQuotationModal({ isOpen, onClose, quotation, onSentSuccess }) {
  const sendMutation = useSendQuotation(quotation?.id);

  const [formData, setFormData] = useState({
    recipientEmail: 'procurement@tata-motors.demo',
    emailSubject: `Commercial Quotation ${quotation?.quotationNumber || ''} — Company A Precision Engineering`,
    customMessage: 'Dear Procurement Team,\n\nPlease find attached our formal quotation and volume-tiered pricing breakdown for the referenced RFQ components.\n\nWarm regards,\nCompany A Sales & Commercial Team',
  });

  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !quotation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await sendMutation.mutateAsync({
        recipientEmail: formData.recipientEmail.trim(),
        emailSubject: formData.emailSubject.trim(),
        customMessage: formData.customMessage.trim(),
      });
      if (onSentSuccess) onSentSuccess(res);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch quotation simulation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shadow">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dispatch Quotation: {quotation.quotationNumber}
              </h2>
              <p className="text-xs text-slate-500">
                Formal customer submission simulation
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
          {/* Simulation Notice Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2.5 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Demo Simulation Notice:</strong>
              <span>
                External SMTP delivery is safely simulated. Triggering dispatch transitions this quotation to <strong>SENT</strong>, updates the parent RFQ to <strong>SENT</strong>, and logs an immutable audit event.
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer OEM Recipient <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={formData.recipientEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                className="w-full text-xs rounded border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.emailSubject}
              onChange={(e) => setFormData((prev) => ({ ...prev, emailSubject: e.target.value }))}
              className="w-full text-xs rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cover Note to Customer
            </label>
            <textarea
              rows={4}
              value={formData.customMessage}
              onChange={(e) => setFormData((prev) => ({ ...prev, customMessage: e.target.value }))}
              className="w-full text-xs rounded border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
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
              disabled={sendMutation.isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {sendMutation.isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Simulating Dispatch...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm Dispatch (Simulation)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
