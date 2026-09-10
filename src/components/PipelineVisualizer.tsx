import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Flame,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  AlertTriangle,
  ArrowRight,
  Eye,
  FileCode,
  Layers
} from 'lucide-react';
import { AIGuardPipelineResult } from '../types';

interface PipelineVisualizerProps {
  result: AIGuardPipelineResult | null;
  isLoading: boolean;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ result, isLoading }) => {
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [diffTab, setDiffTab] = useState<'redacted' | 'original'>('redacted');

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-600 mb-3 animate-pulse">
          <Layers className="w-6 h-6 animate-spin text-slate-900" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Processing 3-Layer Security Inspection</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Evaluating prompt against injection heuristics, token sliding-window budget, and data leakage filters...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-400 mb-3 border border-slate-100">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">No Request Inspected Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Choose an attack preset above or click <strong>"Run 3-Layer Scan"</strong> to watch the AI Guard middleware inspect the payload across all 3 defensive tiers in real-time.
        </p>
      </div>
    );
  }

  const { promptInjection, tokenGuard, dataLeakage, overallStatus, totalLatencyMs, aiResponse } = result;

  return (
    <div className="space-y-4">
      {/* Top Banner: Overall Decision */}
      <div
        id="pipeline-decision-banner"
        className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
          overallStatus === 'passed'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : overallStatus === 'passed_with_redactions'
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : 'bg-rose-50/70 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              overallStatus === 'passed'
                ? 'bg-emerald-600 text-white'
                : overallStatus === 'passed_with_redactions'
                ? 'bg-amber-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {overallStatus === 'passed' ? (
              <ShieldCheck className="w-5 h-5" />
            ) : overallStatus === 'passed_with_redactions' ? (
              <KeyRound className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {overallStatus === 'passed' && 'Pipeline Verdict: Clean & Delivered'}
                {overallStatus === 'passed_with_redactions' && 'Pipeline Verdict: Delivered with Redactions'}
                {overallStatus === 'blocked_prompt_injection' && 'Pipeline Verdict: Blocked at Layer 1 (Prompt Injection)'}
                {overallStatus === 'blocked_cost_limit' && 'Pipeline Verdict: Blocked at Layer 2 (Token / Cost Guard)'}
                {overallStatus === 'blocked_data_leakage' && 'Pipeline Verdict: Blocked at Layer 3 (Data Leakage)'}
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              Request ID: <span className="font-mono">{result.requestId}</span> • User:{' '}
              <span className="font-mono">{result.userId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-mono opacity-70 block">Total Inspection Time</span>
            <span className="text-sm font-semibold font-mono">{totalLatencyMs.toFixed(2)} ms</span>
          </div>
          <button
            id="toggle-raw-telemetry-btn"
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-white/80 border border-slate-200/80 text-slate-700 hover:bg-white transition-colors flex items-center gap-1"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{showRawJson ? 'Hide JSON' : 'Raw JSON'}</span>
          </button>
        </div>
      </div>

      {/* Raw JSON Debug Viewer */}
      {showRawJson && (
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* 3 Sequential Layer Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ======================================================== */}
        {/* LAYER 1: Prompt Injection Detector */}
        {/* ======================================================== */}
        <div
          id="layer-1-card"
          className={`p-4 rounded-2xl border transition-all ${
            promptInjection.passed
              ? 'bg-white border-slate-200/90 shadow-xs'
              : 'bg-rose-50/40 border-rose-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  promptInjection.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-700'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Layer 1</span>
                <h4 className="text-xs font-semibold text-slate-900">Prompt Injection Detector</h4>
              </div>
            </div>

            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                promptInjection.passed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {promptInjection.passed ? 'PASSED' : 'BLOCKED'}
            </span>
          </div>

          {/* Risk Score Meter */}
          <div className="mt-3.5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Injection Risk Score</span>
              <span
                className={`font-mono font-semibold ${
                  promptInjection.riskScore >= 50
                    ? 'text-rose-600'
                    : promptInjection.riskScore > 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {promptInjection.riskScore}% ({promptInjection.threatLevel.toUpperCase()})
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  promptInjection.riskScore >= 50
                    ? 'bg-rose-500'
                    : promptInjection.riskScore > 0
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(5, promptInjection.riskScore)}%` }}
              />
            </div>
          </div>

          {/* Matched Rules Breakdown */}
          <div className="mt-3.5">
            <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
              Matched Heuristics ({promptInjection.matchedRules.length})
            </span>
            {promptInjection.matchedRules.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero injection patterns or jailbreak signatures detected.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {promptInjection.matchedRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-rose-50/80 border border-rose-200 text-xs text-rose-900"
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span>{rule.ruleName}</span>
                      <span className="text-[10px] uppercase font-bold text-rose-600">
                        {rule.severity}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] bg-white/70 p-1 rounded border border-rose-200/50 text-rose-800 break-all">
                      &ldquo;{rule.matchedText}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Latency</span>
            <span>{promptInjection.latencyMs} ms</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LAYER 2: Token / Cost Guard */}
        {/* ======================================================== */}
        <div
          id="layer-2-card"
          className={`p-4 rounded-2xl border transition-all ${
            tokenGuard.passed
              ? 'bg-white border-slate-200/90 shadow-xs'
              : 'bg-amber-50/40 border-amber-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  tokenGuard.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Layer 2</span>
                <h4 className="text-xs font-semibold text-slate-900">Token / Cost Guard</h4>
              </div>
            </div>

            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                tokenGuard.passed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {tokenGuard.passed ? 'ALLOWED' : 'THROTTLED (429)'}
            </span>
          </div>

          {/* Sliding Window Meter */}
          <div className="mt-3.5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Sliding Window Quota</span>
              <span className="font-mono font-semibold text-slate-700">
                {tokenGuard.windowTokensUsed} tokens used
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  !tokenGuard.passed ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (tokenGuard.windowTokensUsed /
                        (tokenGuard.windowTokensUsed + tokenGuard.windowTokensRemaining || 1)) *
                        100
                    )
                  )}%`
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
              <span>{tokenGuard.windowTokensRemaining} remaining</span>
              <span>Window reset: {Math.ceil(tokenGuard.windowResetMs / 1000)}s</span>
            </div>
          </div>

          {/* Cost impact & Tokens */}
          <div className="mt-3.5 space-y-2">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">Current Prompt Tokens</span>
              <span className="font-mono font-semibold text-slate-900">
                {tokenGuard.estimatedPromptTokens} tokens
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">Estimated Cost Impact</span>
              <span className="font-mono font-semibold text-emerald-600">
                ${tokenGuard.estimatedCostUsd}
              </span>
            </div>

            {!tokenGuard.passed && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <span className="font-semibold block mb-0.5">Rate Limit Enforced:</span>
                <span className="text-[11px] text-amber-800">{tokenGuard.blockedReason}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Latency</span>
            <span>{tokenGuard.latencyMs} ms</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LAYER 3: Data Leakage Filter */}
        {/* ======================================================== */}
        <div
          id="layer-3-card"
          className={`p-4 rounded-2xl border transition-all ${
            !dataLeakage || dataLeakage.passed
              ? dataLeakage?.action === 'redacted'
                ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                : 'bg-white border-slate-200/90 shadow-xs'
              : 'bg-rose-50/40 border-rose-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  !dataLeakage || dataLeakage.passed
                    ? dataLeakage?.action === 'redacted'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Layer 3</span>
                <h4 className="text-xs font-semibold text-slate-900">Data Leakage Filter</h4>
              </div>
            </div>

            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                !dataLeakage || dataLeakage.action === 'allow'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : dataLeakage.action === 'redacted'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {!dataLeakage || dataLeakage.action === 'allow'
                ? 'CLEAN'
                : dataLeakage.action === 'redacted'
                ? `REDACTED (${dataLeakage.leaksFound})`
                : 'BLOCKED'}
            </span>
          </div>

          {/* Redaction findings */}
          <div className="mt-3.5">
            <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
              Secrets Detected ({dataLeakage ? dataLeakage.matchedItems.length : 0})
            </span>
            {!dataLeakage || dataLeakage.matchedItems.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>No API keys, credentials, or PII exposed in output.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {dataLeakage.matchedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold block">{item.ruleName}</span>
                      <span className="text-[10px] font-mono text-amber-700">{item.matchPreview}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-amber-800 border border-amber-300">
                      masked
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Latency</span>
            <span>{dataLeakage?.latencyMs || 0.0} ms</span>
          </div>
        </div>
      </div>

      {/* Outbound AI Response & Redaction Diff */}
      {aiResponse && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <h4 className="text-xs font-semibold text-slate-800">
                Outgoing AI Response (Post-Middleware)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                source: {result.aiSource === 'gemini' ? 'Gemini 3.8 Flash' : 'Simulated Response'}
              </span>
            </div>

            {dataLeakage && dataLeakage.leaksFound > 0 && (
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDiffTab('redacted')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    diffTab === 'redacted'
                      ? 'bg-white font-medium text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Guarded Output (Safe)
                </button>
                <button
                  type="button"
                  onClick={() => setDiffTab('original')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    diffTab === 'original'
                      ? 'bg-rose-100 font-medium text-rose-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Raw Leaked (Unsafe)
                </button>
              </div>
            )}
          </div>

          <div
            className={`p-3.5 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap ${
              diffTab === 'original' && dataLeakage && dataLeakage.leaksFound > 0
                ? 'bg-rose-50 text-rose-900 border border-rose-200'
                : 'bg-slate-50 text-slate-800 border border-slate-200'
            }`}
          >
            {diffTab === 'original' && dataLeakage ? dataLeakage.originalText : aiResponse}
          </div>
        </div>
      )}
    </div>
  );
};
