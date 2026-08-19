import React from 'react';
import { X, History, FileText, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
  onRefreshLogs: () => void;
}

export const AuditLogsDrawer: React.FC<AuditLogsDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onRefreshLogs
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-slideLeft">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Parsing Logs & Audit Trail
              </h3>
              <p className="text-[11px] text-slate-500">
                Enterprise compliance activity log
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={onRefreshLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {logs.map(log => (
            <div
              key={log.id}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white flex items-center">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5" />
                  {log.action}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {log.details}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>By: {log.user}</span>
                <span className="uppercase font-semibold text-indigo-600 dark:text-indigo-400">{log.type}</span>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p>No activity logs recorded yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            SOC2 & GDPR Audit Stream
          </span>
          <span>{logs.length} events logged</span>
        </div>

      </div>
    </div>
  );
};
