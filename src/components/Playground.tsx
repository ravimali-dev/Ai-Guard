import React, { useState } from 'react';
import { Play, Sparkles, AlertTriangle, Flame, ShieldAlert, CheckCircle2, User, Key, Eye, EyeOff } from 'lucide-react';
import { ATTACK_PRESETS } from '../data/presets';
import { AttackPreset, estimateTokens } from '../types';

interface PlaygroundProps {
  onInspect: (prompt: string, userId: string, simulateLeak?: string) => void;
  onSendLiveEndpoint: (prompt: string, userId: string, simulateLeak?: string) => void;
  onSimulateBurst: (userId: string) => void;
  isLoading: boolean;
  burstLoading: boolean;
}

export const Playground: React.FC<PlaygroundProps> = ({
  onInspect,
  onSendLiveEndpoint,
  onSimulateBurst,
  isLoading,
  burstLoading
}) => {
  const [prompt, setPrompt] = useState<string>(ATTACK_PRESETS[0].prompt);
  const [userId, setUserId] = useState<string>('sandbox-user-1');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(ATTACK_PRESETS[0].id);
  const [enableSimulatedLeak, setEnableSimulatedLeak] = useState<boolean>(false);
  const [simulatedLeakText, setSimulatedLeakText] = useState<string>(
    ATTACK_PRESETS[5].simulateOutputLeak || ''
  );

  const estimatedPromptTokens = estimateTokens(prompt);

  const handleSelectPreset = (preset: AttackPreset) => {
    setSelectedPresetId(preset.id);
    setPrompt(preset.prompt);
    if (preset.simulateOutputLeak) {
      setEnableSimulatedLeak(true);
      setSimulatedLeakText(preset.simulateOutputLeak);
    } else {
      setEnableSimulatedLeak(false);
    }
  };

  const handleRunInspection = (e: React.FormEvent) => {
    e.preventDefault();
    onInspect(prompt, userId, enableSimulatedLeak ? simulatedLeakText : undefined);
  };

  const handleRunLive = () => {
    onSendLiveEndpoint(prompt, userId, enableSimulatedLeak ? simulatedLeakText : undefined);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
      {/* Preset Pills */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            One-Click Attack Vectors &amp; Test Presets
          </label>
          <span className="text-[11px] text-slate-400">Click to load payload</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {ATTACK_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            let badgeBg = 'hover:bg-slate-100 text-slate-700 border-slate-200';
            if (isSelected) {
              badgeBg = 'bg-slate-900 text-white border-slate-900 shadow-xs';
            }

            return (
              <button
                key={preset.id}
                type="button"
                id={`preset-btn-${preset.id}`}
                onClick={() => handleSelectPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${badgeBg}`}
              >
                {preset.moduleTarget === 'prompt_injection' && (
                  <ShieldAlert className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-400' : 'text-rose-500'}`} />
                )}
                {preset.moduleTarget === 'token_guard' && (
                  <Flame className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-amber-500'}`} />
                )}
                {preset.moduleTarget === 'data_leakage' && (
                  <Key className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-indigo-500'}`} />
                )}
                {preset.moduleTarget === 'safe' && (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-emerald-500'}`} />
                )}
                <span className="font-medium">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form: User ID & Prompt Area */}
      <form onSubmit={handleRunInspection}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {/* User selector for sliding window testing */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> User Identity:
            </span>
            <select
              id="user-identity-select"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="sandbox-user-1">sandbox-user-1 (Standard User)</option>
              <option value="user-alice">user-alice (VIP tier)</option>
              <option value="attacker-spammer-99">attacker-spammer-99 (Bot client)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Est: <strong className="text-slate-800">{estimatedPromptTokens}</strong> tokens ({prompt.length} chars)
            </span>
          </div>
        </div>

        {/* Input prompt */}
        <div className="relative">
          <textarea
            id="prompt-input-textarea"
            rows={4}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setSelectedPresetId('');
            }}
            placeholder="Type your AI prompt here or test an injection attempt..."
            className="w-full text-sm font-sans p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-mono leading-relaxed"
          />
        </div>

        {/* Optional: Simulated Outbound AI Data Leakage Section */}
        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <button
              type="button"
              id="toggle-simulated-leak-btn"
              onClick={() => setEnableSimulatedLeak(!enableSimulatedLeak)}
              className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              {enableSimulatedLeak ? (
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>
                {enableSimulatedLeak
                  ? 'Simulate Outbound AI Data Leakage (Active)'
                  : 'Test Layer 3: Inject Simulated AI Response with Leaked Secrets'}
              </span>
            </button>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Tests output redaction
            </span>
          </div>

          {enableSimulatedLeak && (
            <div className="mt-2.5">
              <p className="text-[11px] text-slate-500 mb-1">
                Raw AI completion containing sensitive keys/PII to test outbound redaction:
              </p>
              <textarea
                id="simulated-leak-textarea"
                rows={3}
                value={simulatedLeakText}
                onChange={(e) => setSimulatedLeakText(e.target.value)}
                placeholder="Paste AI response containing secrets (sk-proj-..., emails, AWS keys)..."
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              id="run-inspect-btn"
              disabled={isLoading || !prompt.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>{isLoading ? 'Scanning Pipeline...' : 'Run 3-Layer Scan'}</span>
            </button>

            <button
              type="button"
              id="run-live-express-btn"
              onClick={handleRunLive}
              disabled={isLoading || !prompt.trim()}
              title="Sends request directly to the Express route protected by the aiGuard middleware"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-200 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Test Express Route</span>
            </button>
          </div>

          {/* Burst Attack Simulation */}
          <button
            type="button"
            id="run-burst-spam-btn"
            onClick={() => onSimulateBurst(userId)}
            disabled={burstLoading}
            title="Sends a rapid burst of requests to trigger sliding window 429 rate limit"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>{burstLoading ? 'Firing Burst...' : 'Simulate 10x Burst Spam'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
