import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code, Cpu, ShieldCheck } from 'lucide-react';

interface CodeIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeIntegrationModal: React.FC<CodeIntegrationModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'express' | 'nextjs' | 'standalone' | 'comparison'>('express');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const expressCode = `import express from 'express';
import { aiGuard } from './server/middleware/aiGuardExpress'; // Drop-in AI Guard middleware

const app = express();
app.use(express.json());

// 🛡️ Integrate in 2 lines!
app.use('/api/chat', aiGuard());

// Your normal AI route:
app.post('/api/chat', async (req, res) => {
  // 1. Layer 1 (Prompt Injection) & Layer 2 (Cost Guard) have already passed!
  const { prompt } = req.body;
  
  // Call your AI model (OpenAI, Claude, or Gemini):
  const response = await ai.models.generateContent({ model: 'gemini-3.8-flash', contents: prompt });

  // 2. Layer 3 (Data Leakage) automatically filters & redacts secrets in res.json!
  res.json({ reply: response.text });
});

app.listen(3000);`;

  const nextjsCode = `// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { inspectFullPipeline } from '@/server/middleware/aiGuardExpress';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const userId = req.headers.get('x-user-id') || 'anon';

  // 1. In-process inspection
  const scan = inspectFullPipeline(prompt, userId);
  
  if (!scan.promptInjection.passed) {
    return NextResponse.json({ error: 'Prompt injection blocked' }, { status: 400 });
  }
  if (!scan.tokenGuard.passed) {
    return NextResponse.json({ error: 'Token limit exceeded' }, { status: 429 });
  }

  // 2. Call AI & apply Layer 3 leakage filter
  const completion = await callAI(prompt);
  const safeOutput = scan.dataLeakageFilter ? scan.dataLeakageFilter(completion) : completion;

  return NextResponse.json({ reply: safeOutput });
}`;

  const standaloneCode = `import {
  detectPromptInjection,
  checkTokenGuard,
  filterDataLeakage
} from './aiGuardCore';

// Layer 1: Prompt Injection Check
const injection = detectPromptInjection(userPrompt, {
  enabled: true,
  sensitivity: 'high',
  action: 'block'
});

if (!injection.passed) {
  throw new Error(\`Blocked injection attack: \${injection.riskScore}%\`);
}

// Layer 2: Token / Cost Guard Check
const tokenCheck = checkTokenGuard(userId, userPrompt, {
  enabled: true,
  maxTokensPerWindow: 4000,
  windowMs: 60000,
  maxPromptTokens: 1500,
  maxRequestsPerWindow: 20,
  estimatedCostPer1MInput: 0.15,
  estimatedCostPer1MOutput: 0.60
});

if (!tokenCheck.passed) {
  throw new Error('Rate limit exceeded: sliding window tokens drained');
}

// Layer 3: Data Leakage Filter
const sanitized = filterDataLeakage(rawAiResponse, {
  enabled: true,
  action: 'redact',
  detectApiKeys: true,
  detectEmails: true,
  detectPii: true,
  customKeywords: []
});

console.log(sanitized.filteredText); // all API keys & PII cleanly masked!`;

  const activeCodeSnippet =
    tab === 'express' ? expressCode : tab === 'nextjs' ? nextjsCode : standaloneCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Integration in 2-3 Lines of Code
              </h3>
              <p className="text-xs text-slate-500">
                Lightweight Node.js middleware for indie hackers &amp; SaaS builders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-100 bg-slate-50 px-4 pt-2 gap-1 text-xs">
          <button
            onClick={() => setTab('express')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              tab === 'express'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Express.js (2 Lines)
          </button>
          <button
            onClick={() => setTab('nextjs')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              tab === 'nextjs'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Next.js App Router
          </button>
          <button
            onClick={() => setTab('standalone')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              tab === 'standalone'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Standalone Functions
          </button>
          <button
            onClick={() => setTab('comparison')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              tab === 'comparison'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            vs Enterprise Gateways
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-mono text-xs">
          {tab !== 'comparison' ? (
            <div className="relative">
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 overflow-x-auto leading-relaxed border border-slate-800">
                <code>{activeCodeSnippet}</code>
              </pre>
            </div>
          ) : (
            <div className="font-sans text-xs space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Enterprise AI gateways like <strong>Cloudflare AI Gateway</strong> or <strong>Lakera Guard</strong> require external network roundtrips, DNS configuration, and costly tiered subscriptions. AI Guard solves the indie developer dilemma:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="p-3">Feature</th>
                      <th className="p-3 text-emerald-700">AI Guard Middleware</th>
                      <th className="p-3 text-slate-500">Cloudflare AI Gateway / Lakera</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="p-3 font-medium text-slate-800">Deployment</td>
                      <td className="p-3 text-emerald-700 font-medium">In-Process (Express / Node)</td>
                      <td className="p-3">External Reverse Proxy</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-800">Latency Overhead</td>
                      <td className="p-3 text-emerald-700 font-medium">&lt; 1.5ms (pure CPU)</td>
                      <td className="p-3">40ms - 150ms network hop</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-800">Cost</td>
                      <td className="p-3 text-emerald-700 font-medium">100% Free / Open Source</td>
                      <td className="p-3">Usage-based / $$,$$$ Enterprise</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-800">Data Privacy</td>
                      <td className="p-3 text-emerald-700 font-medium">Never leaves your server</td>
                      <td className="p-3">Routed through 3rd-party vendor</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-800">Setup Time</td>
                      <td className="p-3 text-emerald-700 font-medium">2 lines in Express</td>
                      <td className="p-3">Complex DNS / routing keys</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <span>Zero external SDK dependencies required for core inspection</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
