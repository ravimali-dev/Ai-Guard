import React from 'react';
import { ShieldAlert, DollarSign, KeyRound, Cpu } from 'lucide-react';
import { AggregateMetrics } from '../types';

interface DashboardMetricsProps {
  metrics: AggregateMetrics;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Metric 1: Prompt Injections */}
      <div
        id="metric-injections-card"
        className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Prompt Injections</span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">
            {metrics.injectionsBlocked}
          </span>
          <span className="text-xs text-rose-600 font-medium">Blocked</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 truncate">
          DAN, system leaks, delimiter attacks
        </p>
      </div>

      {/* Metric 2: Cost-Drain Saved */}
      <div
        id="metric-cost-card"
        className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Cost Drain Prevented</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">
            ${metrics.costSavedUsd.toFixed(3)}
          </span>
          <span className="text-xs text-emerald-600 font-medium">Saved</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 truncate">
          {(metrics.tokensSaved / 1000).toFixed(1)}k spam tokens deflected
        </p>
      </div>

      {/* Metric 3: Data Leaks Redacted */}
      <div
        id="metric-leaks-card"
        className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Data Leaks Filtered</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <KeyRound className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">
            {metrics.leaksRedacted}
          </span>
          <span className="text-xs text-amber-600 font-medium">Sanitized</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 truncate">
          API keys, PII, auth bearer tokens
        </p>
      </div>

      {/* Metric 4: Latency Overhead */}
      <div
        id="metric-latency-card"
        className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Middleware Overhead</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">
            {metrics.avgLatencyOverheadMs.toFixed(1)}
            <span className="text-base font-normal text-slate-500 ml-1">ms</span>
          </span>
          <span className="text-xs text-indigo-600 font-medium">Ultra-fast</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 truncate">
          Zero external network hop
        </p>
      </div>
    </div>
  );
};
