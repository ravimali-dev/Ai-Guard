import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DashboardMetrics } from './components/DashboardMetrics';
import { Playground } from './components/Playground';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { ThreatLog } from './components/ThreatLog';
import { RuleConfigurator } from './components/RuleConfigurator';
import { CodeIntegrationModal } from './components/CodeIntegrationModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import {
  AggregateMetrics,
  AIGuardPipelineResult,
  AuditLogEntry,
  GuardConfig,
  DEFAULT_GUARD_CONFIG
} from './types';
import { ATTACK_PRESETS } from './data/presets';
import { Sliders, Activity, ShieldCheck, Terminal, AlertCircle, FolderTree } from 'lucide-react';

export default function App() {
  const [metrics, setMetrics] = useState<AggregateMetrics>({
    totalRequests: 48,
    injectionsBlocked: 14,
    costLimitBlocks: 9,
    leaksRedacted: 12,
    tokensConsumed: 28450,
    tokensSaved: 42100,
    costSavedUsd: 0.158,
    avgLatencyOverheadMs: 1.2
  });

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [config, setConfig] = useState<GuardConfig>(DEFAULT_GUARD_CONFIG);
  const [currentResult, setCurrentResult] = useState<AIGuardPipelineResult | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'config' | 'logs'>('inspector');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [burstLoading, setBurstLoading] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [serverHealthy, setServerHealthy] = useState<boolean>(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch metrics & logs on mount
  const fetchData = useCallback(async () => {
    try {
      const [healthRes, metricsRes, logsRes, configRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/guard/metrics'),
        fetch('/api/guard/logs'),
        fetch('/api/guard/config')
      ]);

      if (healthRes.ok) setServerHealthy(true);
      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m);
      }
      if (logsRes.ok) {
        const l = await logsRes.json();
        setLogs(l);
      }
      if (configRes.ok) {
        const c = await configRes.json();
        setConfig(c);
      }
    } catch {
      setServerHealthy(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Preload default inspection result with the first preset
    handleInspect(ATTACK_PRESETS[0].prompt, 'sandbox-user-1');
  }, [fetchData]);

  // Run full 3-layer inspection
  const handleInspect = async (prompt: string, userId: string, simulateLeak?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/guard/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userId,
          simulateOutputLeak: simulateLeak,
          customConfig: config
        })
      });

      if (!res.ok) throw new Error('Inspection failed');
      const data: AIGuardPipelineResult = await res.json();
      setCurrentResult(data);
      // Refresh metrics and logs
      fetchData();
    } catch (err: any) {
      showNotification(`Error scanning request: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Send request directly to live Express endpoint with aiGuard middleware
  const handleSendLiveEndpoint = async (prompt: string, userId: string, simulateLeak?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat/guarded', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          prompt,
          simulateOutputLeak: simulateLeak
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        showNotification(`Express Route HTTP 200: Passed middleware successfully!`, 'success');
      } else if (res.status === 400) {
        showNotification(
          `Express Route HTTP 400: ${data.error || 'Blocked by Prompt Injection Detector'}`,
          'warning'
        );
      } else if (res.status === 429) {
        showNotification(
          `Express Route HTTP 429: ${data.error || 'Throttled by Cost Guard budget'}`,
          'error'
        );
      } else {
        showNotification(`Express Route HTTP ${res.status}: ${data.error || 'Response blocked'}`, 'warning');
      }

      // Also trigger inspector view for this request
      handleInspect(prompt, userId, simulateLeak);
    } catch (err: any) {
      showNotification(`Live route call error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Burst attack simulator (triggers 429 rate limit)
  const handleSimulateBurst = async (userId: string) => {
    setBurstLoading(true);
    try {
      const res = await fetch('/api/guard/simulate-burst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 12, userId, tokensPerReq: 400 })
      });

      const data = await res.json();
      showNotification(
        `Burst attack completed: Fired 12 requests, ${data.blockedCount} throttled with HTTP 429!`,
        data.blockedCount > 0 ? 'warning' : 'success'
      );
      fetchData();
      // Inspect one throttled sample
      handleInspect('Spam token flood payload '.repeat(50), userId);
    } catch (err: any) {
      showNotification(`Burst failed: ${err.message}`, 'error');
    } finally {
      setBurstLoading(false);
    }
  };

  // Reset metrics
  const handleResetMetrics = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/guard/metrics/reset', { method: 'POST' });
      showNotification('Telemetry metrics and user sliding-token windows reset.', 'success');
      fetchData();
    } catch {
      showNotification('Failed to reset metrics', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Clear audit logs
  const handleClearLogs = async () => {
    try {
      await fetch('/api/guard/logs/clear', { method: 'POST' });
      setLogs([]);
      showNotification('Audit log cleared.', 'success');
    } catch {
      showNotification('Failed to clear logs', 'error');
    }
  };

  // Save rules
  const handleSaveConfig = async (newConfig: GuardConfig) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/guard/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const saved = await res.json();
        setConfig(saved);
        showNotification('Security rules updated successfully.', 'success');
        setActiveTab('inspector');
      }
    } catch {
      showNotification('Failed to save security configuration.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 font-sans antialiased flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
                : notification.type === 'warning'
                ? 'bg-amber-950 text-amber-100 border-amber-800'
                : 'bg-rose-950 text-rose-100 border-rose-800'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenIntegration={() => setIsModalOpen(true)}
        onOpenArchitecture={() => setIsArchModalOpen(true)}
        onResetMetrics={handleResetMetrics}
        isResetting={isResetting}
        serverHealthy={serverHealthy}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Telemetry Metric Cards */}
        <DashboardMetrics metrics={metrics} />

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id="tab-btn-inspector"
              onClick={() => setActiveTab('inspector')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'inspector'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Inspection Playground</span>
            </button>

            <button
              id="tab-btn-config"
              onClick={() => setActiveTab('config')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'config'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Policy &amp; Rules</span>
            </button>

            <button
              id="tab-btn-logs"
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit Logs ({logs.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center text-xs text-slate-500 gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Target: Express.js Route Guard</span>
          </div>
        </div>

        {/* Tab 1: Inspection Playground & 3-Layer Pipeline Visualizer */}
        {activeTab === 'inspector' && (
          <div className="space-y-6">
            <Playground
              onInspect={handleInspect}
              onSendLiveEndpoint={handleSendLiveEndpoint}
              onSimulateBurst={handleSimulateBurst}
              isLoading={isLoading}
              burstLoading={burstLoading}
            />

            <PipelineVisualizer result={currentResult} isLoading={isLoading} />
          </div>
        )}

        {/* Tab 2: Security Rules & Policy Configurator */}
        {activeTab === 'config' && (
          <RuleConfigurator
            config={config}
            onSaveConfig={handleSaveConfig}
            isSaving={isSavingConfig}
          />
        )}

        {/* Tab 3: Real-Time Threat Audit Trail */}
        {activeTab === 'logs' && <ThreatLog logs={logs} onClearLogs={handleClearLogs} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            AI Guard Middleware • Lightweight in-process security for chatbots, RAG tools, and AI SaaS
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsArchModalOpen(true)}
              className="text-slate-800 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <FolderTree className="w-3.5 h-3.5 text-indigo-600" /> Frontend vs. Backend Structure
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-slate-800 font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Terminal className="w-3 h-3 text-emerald-600" /> View 2-line Express code
            </button>
          </div>
        </div>
      </footer>

      {/* 2-3 Line Integration Modal */}
      <CodeIntegrationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Architecture & Folder Structure Modal */}
      <ArchitectureModal isOpen={isArchModalOpen} onClose={() => setIsArchModalOpen(false)} />
    </div>
  );
}
