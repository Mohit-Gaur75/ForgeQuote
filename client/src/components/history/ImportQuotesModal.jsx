// client/src/components/history/ImportQuotesModal.jsx
import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Database,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';

export function ImportQuotesModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.xlsx')) {
        setErrorMsg('Please select an Excel (.xlsx) file.');
        return;
      }
      setFile(selected);
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const handleUploadFile = async () => {
    if (!file) {
      setErrorMsg('Please select an Excel file to upload.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1];
          const res = await api.post('/history/import-excel', { fileBase64: base64 });
          setSuccessMsg(
            res.data?.message || `Successfully imported ${res.data?.importedCount || 0} historical quotations.`
          );
          setIsLoading(false);
          setFile(null);
          if (onImportSuccess) onImportSuccess();
        } catch (err) {
          setErrorMsg(err.message || 'Failed to process Excel import.');
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read the file.');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg(err.message || 'Import failed.');
      setIsLoading(false);
    }
  };

  const handleQuickImport1400 = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/history/import-excel', { useSample1400: true });
      setSuccessMsg(
        res.data?.message || 'Successfully ingested 1,400 historical quotation records from Company A archive!'
      );
      setIsLoading(false);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to run 1,400 sample import.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center shadow">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Import Past Quotations from Excel
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Populate historical quotes, cycle times & machine rates
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Status Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* 1-Click Demo Shortcut */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>1-Click Assessment Dataset (1,400 Quotes)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">
                Company A Archive
              </span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Instantly ingest the entire 1,400-row historical dataset across Bajaj, Mahindra, Tata Motors, Carraro, and Dana with real Pune machining cycle times.
            </p>
            <button
              type="button"
              onClick={handleQuickImport1400}
              disabled={isLoading}
              className="mt-1 flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Ingesting 1,400 Records...' : 'Import 1,400 Historical Quotes'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 font-mono text-[10px] uppercase">
              Or Upload Custom .xlsx File
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20"
          >
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <span className="font-semibold text-slate-700 block">
              {file ? file.name : 'Click to select Excel file (.xlsx)'}
            </span>
            <span className="text-slate-400 text-[11px] mt-1 block">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports standard Company A Past Quotes format'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Action Links */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <a
              href="/api/v1/history/template-excel"
              download="CompanyA_Past_Quotes_Template.xlsx"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Blank Template (.xlsx)</span>
            </a>

            <a
              href="/api/v1/history/sample-excel"
              download="CompanyA_1400_Past_Quotes_Archive.xlsx"
              className="text-slate-600 hover:text-slate-800 font-mono flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download 1,400 Sample Dataset (.xlsx)</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            Powered by ExcelJS • PostgreSQL Batched
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-700 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleUploadFile}
              disabled={!file || isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing...' : 'Upload & Import'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
