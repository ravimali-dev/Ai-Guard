import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Flame, CheckCircle, Trash2, Filter } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface ThreatLogProps {
  logs: AuditLogEntry[];
  onClearLogs: () => void;
}

export const ThreatLog: React.FC<ThreatLogProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'prompt_injection' | 'token_guard' | 'data_leakage'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.stage === filter;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Security Audit Trail &amp; Telemetry</h3>
          <p className="text-xs text-slate-500">
            Real-time intercept log across all Express middleware request cycles
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Stage Filter */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'all' ? 'bg-white font-medium text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('prompt_injection')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'prompt_injection' ? 'bg-white font-medium text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Injections
            </button>
            <button
              onClick={() => setFilter('token_guard')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'token_guard' ? 'bg-white font-medium text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Cost Limits
            </button>
            <button
              onClick={() => setFilter('data_leakage')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'data_leakage' ? 'bg-white font-medium text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Data Leaks
            </button>
          </div>

          <button
            onClick={onClearLogs}
            title="Clear audit log"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-transparent transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Log list */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-mono text-[11px]">
              <th className="pb-2 font-medium">TIME</th>
              <th className="pb-2 font-medium">USER</th>
              <th className="pb-2 font-medium">STAGE</th>
              <th className="pb-2 font-medium">VERDICT</th>
              <th className="pb-2 font-medium">PROMPT / REASON</th>
              <th className="pb-2 font-medium text-right">TOKENS</th>
              <th className="pb-2 font-medium text-right">LATENCY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No log records found for this filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-mono text-slate-500 whitespace-nowrap">{dateStr}</td>
                    <td className="py-2.5 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {log.userId}
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      {log.stage === 'prompt_injection' && (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                          <ShieldAlert className="w-3 h-3" /> Injection
                        </span>
                      )}
                      {log.stage === 'token_guard' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Flame className="w-3 h-3" /> Cost Guard
                        </span>
                      )}
                      {log.stage === 'data_leakage' && (
                        <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
                          <KeyRound className="w-3 h-3" /> Data Leak
                        </span>
                      )}
                      {log.stage === 'clean' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle className="w-3 h-3" /> Clean
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium text-[10px] uppercase tracking-wider ${
                          log.status === 'blocked'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : log.status === 'redacted'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 max-w-xs truncate text-slate-700" title={log.reason}>
                      <span className="font-medium text-slate-800">{log.reason}</span>
                      {log.promptPreview && (
                        <span className="block text-[11px] text-slate-400 truncate">
                          &ldquo;{log.promptPreview}&rdquo;
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-600">
                      {log.tokensEstimated}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-500 whitespace-nowrap">
                      {log.latencyMs.toFixed(1)} ms
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
