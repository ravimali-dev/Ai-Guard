import React from 'react';
import { ShieldCheck, Terminal, BookOpen, Zap, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenIntegration: () => void;
  onOpenArchitecture: () => void;
  onResetMetrics: () => void;
  isResetting: boolean;
  serverHealthy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenIntegration,
  onOpenArchitecture,
  onResetMetrics,
  isResetting,
  serverHealthy
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                AI Guard
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                v1.2.0 • Express Middleware
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              3-Layer In-Process AI Security: Injections, Cost-Drain, Data Leaks
            </p>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                serverHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{serverHealthy ? 'Middleware Active' : 'Connecting'}</span>
            <span className="text-slate-400">•</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
              <Zap className="w-3 h-3 text-amber-500" /> &lt;1.5ms overhead
            </span>
          </div>

          <button
            id="header-open-architecture-btn"
            onClick={onOpenArchitecture}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
            title="View Frontend vs Backend folder structure"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Folder Structure</span>
          </button>

          <button
            id="header-reset-metrics-btn"
            onClick={onResetMetrics}
            disabled={isResetting}
            title="Reset telemetry metrics and sliding token windows"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="header-open-integration-btn"
            onClick={onOpenIntegration}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>2-Line Integration</span>
          </button>
        </div>
      </div>
    </header>
  );
};
