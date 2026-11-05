// client/src/components/common/AuditTrailDrawer.jsx
import React, { useState } from 'react';
import {
  X,
  History,
  ShieldCheck,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useAuditLogs } from '../../hooks/useAudit';

export function AuditTrailDrawer({
  isOpen,
  onClose,
  entityType,
  entityId,
  title = 'Audit Trail & Compliance History',
}) {
  const { data: logs = [], isLoading, error } = useAuditLogs(entityType, entityId);
  const [expandedLogId, setExpandedLogId] = useState(null);

  if (!isOpen) return null;

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('APPROVED')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (action.includes('REJECTED')) return 'bg-red-100 text-red-800 border-red-200';
    if (action.includes('CREATED') || action.includes('DISPATCHED'))
      return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('UPDATED') || action.includes('MODIFIED'))
      return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shadow">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  {title}
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  Target: {entityType} • {entityId ? entityId.slice(0, 8) + '...' : ''}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading immutable audit records...</span>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                Failed to load audit history: {error.message}
              </div>
            ) : logs.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p>No audit trail recorded yet for this entity.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const hasDetails = log.newValues || log.oldValues;

                  return (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-slate-200" />

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 hover:border-slate-300 transition">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(log.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <strong>{log.user?.name || 'System User'}</strong>
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-500">
                            {log.user?.role || 'SYSTEM'}
                          </span>
                        </div>

                        {hasDetails && (
                          <div>
                            <button
                              type="button"
                              onClick={() => toggleExpand(log.id)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              <span>{isExpanded ? 'Hide Payload Diff' : 'View Payload Diff'}</span>
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-2 bg-slate-900 text-emerald-400 rounded font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-800">
                                <pre>{JSON.stringify({ oldValues: log.oldValues, newValues: log.newValues }, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Immutable Ledger • PostgreSQL</span>
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
