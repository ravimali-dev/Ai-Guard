import React, { useState } from 'react';
import { Settings2, ShieldCheck, Flame, KeyRound, Save, RotateCcw } from 'lucide-react';
import { GuardConfig, DEFAULT_GUARD_CONFIG } from '../types';

interface RuleConfiguratorProps {
  config: GuardConfig;
  onSaveConfig: (newConfig: GuardConfig) => void;
  isSaving: boolean;
}

export const RuleConfigurator: React.FC<RuleConfiguratorProps> = ({
  config,
  onSaveConfig,
  isSaving
}) => {
  const [localConfig, setLocalConfig] = useState<GuardConfig>(config);
  const [customInjectionKeywords, setCustomInjectionKeywords] = useState<string>(
    config.promptInjection.customKeywords.join(', ')
  );
  const [customLeakKeywords, setCustomLeakKeywords] = useState<string>(
    config.dataLeakage.customKeywords.join(', ')
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GuardConfig = {
      ...localConfig,
      promptInjection: {
        ...localConfig.promptInjection,
        customKeywords: customInjectionKeywords
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      },
      dataLeakage: {
        ...localConfig.dataLeakage,
        customKeywords: customLeakKeywords
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
    };
    onSaveConfig(updated);
  };

  const handleResetToDefaults = () => {
    setLocalConfig(DEFAULT_GUARD_CONFIG);
    setCustomInjectionKeywords('');
    setCustomLeakKeywords('');
    onSaveConfig(DEFAULT_GUARD_CONFIG);
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-700" />
            Security Rules &amp; Policy Configurator
          </h3>
          <p className="text-xs text-slate-500">
            Tune detection thresholds, rate-limiting windows, and data redacting behavior
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : 'Apply Rules'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Prompt Injection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-semibold text-slate-900">1. Prompt Injection</h4>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.promptInjection.enabled}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    promptInjection: { ...localConfig.promptInjection, enabled: e.target.checked }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-600" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Sensitivity Threshold
            </label>
            <select
              value={localConfig.promptInjection.sensitivity}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  promptInjection: {
                    ...localConfig.promptInjection,
                    sensitivity: e.target.value as any
                  }
                })
              }
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="high">High (Trigger on score &ge; 35%)</option>
              <option value="medium">Medium (Trigger on score &ge; 50%)</option>
              <option value="low">Low (Trigger on score &ge; 70%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Violation Action
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setLocalConfig({
                    ...localConfig,
                    promptInjection: { ...localConfig.promptInjection, action: 'block' }
                  })
                }
                className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                  localConfig.promptInjection.action === 'block'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Block (HTTP 400)
              </button>
              <button
                type="button"
                onClick={() =>
                  setLocalConfig({
                    ...localConfig,
                    promptInjection: { ...localConfig.promptInjection, action: 'sanitize' }
                  })
                }
                className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                  localConfig.promptInjection.action === 'sanitize'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Strip / Sanitize
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Custom Blocked Terms
            </label>
            <input
              type="text"
              value={customInjectionKeywords}
              onChange={(e) => setCustomInjectionKeywords(e.target.value)}
              placeholder="e.g. bypass_auth, confidential_system"
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Comma-separated keywords</span>
          </div>
        </div>

        {/* Module 2: Token / Cost Guard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-semibold text-slate-900">2. Token / Cost Guard</h4>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.tokenGuard.enabled}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    tokenGuard: { ...localConfig.tokenGuard, enabled: e.target.checked }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Max Tokens per Sliding Window
            </label>
            <input
              type="number"
              value={localConfig.tokenGuard.maxTokensPerWindow}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  tokenGuard: {
                    ...localConfig.tokenGuard,
                    maxTokensPerWindow: Number(e.target.value) || 1000
                  }
                })
              }
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Window Size (sec)
              </label>
              <input
                type="number"
                value={Math.round(localConfig.tokenGuard.windowMs / 1000)}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    tokenGuard: {
                      ...localConfig.tokenGuard,
                      windowMs: (Number(e.target.value) || 60) * 1000
                    }
                  })
                }
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Max Requests / Win
              </label>
              <input
                type="number"
                value={localConfig.tokenGuard.maxRequestsPerWindow}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    tokenGuard: {
                      ...localConfig.tokenGuard,
                      maxRequestsPerWindow: Number(e.target.value) || 10
                    }
                  })
                }
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Max Single Prompt Tokens
            </label>
            <input
              type="number"
              value={localConfig.tokenGuard.maxPromptTokens}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  tokenGuard: {
                    ...localConfig.tokenGuard,
                    maxPromptTokens: Number(e.target.value) || 500
                  }
                })
              }
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Prevents giant payload denial</span>
          </div>
        </div>

        {/* Module 3: Data Leakage Filter */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-semibold text-slate-900">3. Data Leakage Filter</h4>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.dataLeakage.enabled}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    dataLeakage: { ...localConfig.dataLeakage, enabled: e.target.checked }
                  })
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Action When Leak Found
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setLocalConfig({
                    ...localConfig,
                    dataLeakage: { ...localConfig.dataLeakage, action: 'redact' }
                  })
                }
                className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                  localConfig.dataLeakage.action === 'redact'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Mask / Redact
              </button>
              <button
                type="button"
                onClick={() =>
                  setLocalConfig({
                    ...localConfig,
                    dataLeakage: { ...localConfig.dataLeakage, action: 'block' }
                  })
                }
                className={`py-1.5 px-2 rounded-lg border text-center font-medium ${
                  localConfig.dataLeakage.action === 'block'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                Halt / Block (403)
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.dataLeakage.detectApiKeys}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    dataLeakage: { ...localConfig.dataLeakage, detectApiKeys: e.target.checked }
                  })
                }
                className="rounded text-indigo-600 focus:ring-0"
              />
              <span>Detect API Keys (OpenAI, Gemini, AWS, GitHub)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.dataLeakage.detectEmails}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    dataLeakage: { ...localConfig.dataLeakage, detectEmails: e.target.checked }
                  })
                }
                className="rounded text-indigo-600 focus:ring-0"
              />
              <span>Detect Email Addresses (PII)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.dataLeakage.detectPii}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    dataLeakage: { ...localConfig.dataLeakage, detectPii: e.target.checked }
                  })
                }
                className="rounded text-indigo-600 focus:ring-0"
              />
              <span>Detect SSN, Credit Cards, DB Strings</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Custom Secret Keywords
            </label>
            <input
              type="text"
              value={customLeakKeywords}
              onChange={(e) => setCustomLeakKeywords(e.target.value)}
              placeholder="e.g. PROJECT_OMEGA, secret_db_key"
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
