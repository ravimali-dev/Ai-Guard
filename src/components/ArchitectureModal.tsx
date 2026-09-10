import React, { useState } from 'react';
import { X, Folder, FileCode, Server, Monitor, Shield, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'all' | 'backend' | 'frontend'>('all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Project Architecture: Frontend vs. Backend
              </h3>
              <p className="text-xs text-slate-500">
                Spasht folder structure aur responsibility guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Badges */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Full Structure (All)
            </button>
            <button
              onClick={() => setActiveSection('backend')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeSection === 'backend'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Server className="w-3 h-3" />
              <span>🛡️ Backend (`/server`)</span>
            </button>
            <button
              onClick={() => setActiveSection('frontend')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeSection === 'frontend'
                  ? 'bg-indigo-700 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>🖥️ Frontend (`/src`)</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Port 3000 (Unified Full-Stack)</span>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Visual Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backend Column */}
            {(activeSection === 'all' || activeSection === 'backend') && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>🛡️ MAIN BACKEND (`/server`)</span>
                </div>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  Yahan aapka <strong>Express Server</strong>, <strong>AI Guard Middleware</strong> (Layer 1, 2, 3), API routes aur Gemini Service chalti hai.
                </p>
                <div className="space-y-1.5 font-mono text-xs bg-white rounded-lg p-3 border border-emerald-200 text-slate-700">
                  <div className="text-slate-900 font-semibold">📁 server/</div>
                  <div className="pl-3 text-emerald-700">├── 📁 middleware/ <span className="text-[10px] text-slate-400 font-sans">(Core Security)</span></div>
                  <div className="pl-6 text-slate-600">├── aiGuardCore.ts <span className="text-[10px] text-slate-400 font-sans"># Regex, Quotas, Redaction</span></div>
                  <div className="pl-6 text-slate-600">└── aiGuardExpress.ts <span className="text-[10px] text-slate-400 font-sans"># Express Middleware adapter</span></div>
                  <div className="pl-3 text-emerald-700">├── 📁 routes/ <span className="text-[10px] text-slate-400 font-sans">(API Endpoints)</span></div>
                  <div className="pl-6 text-slate-600">├── chatRoutes.ts <span className="text-[10px] text-slate-400 font-sans"># /api/chat/guarded (Protected route)</span></div>
                  <div className="pl-6 text-slate-600">└── guardRoutes.ts <span className="text-[10px] text-slate-400 font-sans"># /api/guard/inspect, metrics, logs</span></div>
                  <div className="pl-3 text-emerald-700">├── 📁 services/</div>
                  <div className="pl-6 text-slate-600">└── geminiService.ts <span className="text-[10px] text-slate-400 font-sans"># Gemini AI client</span></div>
                  <div className="pl-3 text-emerald-700">└── types.ts <span className="text-[10px] text-slate-400 font-sans"># Backend types & config</span></div>
                  <div className="text-slate-900 font-semibold pt-1">📄 server.ts <span className="text-[10px] text-slate-400 font-sans"># Server entrypoint (Port 3000)</span></div>
                </div>
              </div>
            )}

            {/* Frontend Column */}
            {(activeSection === 'all' || activeSection === 'frontend') && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span>🖥️ FRONTEND (`/src`)</span>
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed">
                  Yahan aapka <strong>React 19 Dashboard UI</strong>, Attack Playground, Pipeline Visualizer aur Real-time Logs hain.
                </p>
                <div className="space-y-1.5 font-mono text-xs bg-white rounded-lg p-3 border border-indigo-200 text-slate-700">
                  <div className="text-slate-900 font-semibold">📁 src/</div>
                  <div className="pl-3 text-indigo-700">├── 📁 components/ <span className="text-[10px] text-slate-400 font-sans">(UI Components)</span></div>
                  <div className="pl-6 text-slate-600">├── Header.tsx <span className="text-[10px] text-slate-400 font-sans"># Top bar & status indicator</span></div>
                  <div className="pl-6 text-slate-600">├── Playground.tsx <span className="text-[10px] text-slate-400 font-sans"># Prompt tester & attack buttons</span></div>
                  <div className="pl-6 text-slate-600">├── PipelineVisualizer.tsx <span className="text-[10px] text-slate-400 font-sans"># 3-Layer step cards</span></div>
                  <div className="pl-6 text-slate-600">├── DashboardMetrics.tsx <span className="text-[10px] text-slate-400 font-sans"># Savings & blocks counter</span></div>
                  <div className="pl-6 text-slate-600">├── ThreatLog.tsx <span className="text-[10px] text-slate-400 font-sans"># Audit trail table</span></div>
                  <div className="pl-6 text-slate-600">└── RuleConfigurator.tsx <span className="text-[10px] text-slate-400 font-sans"># Policy editor</span></div>
                  <div className="pl-3 text-indigo-700">├── 📁 data/</div>
                  <div className="pl-6 text-slate-600">└── presets.ts <span className="text-[10px] text-slate-400 font-sans"># Real attack prompt presets</span></div>
                  <div className="pl-3 text-slate-600">├── App.tsx <span className="text-[10px] text-slate-400 font-sans"># Main React View State</span></div>
                  <div className="pl-3 text-slate-600">├── main.tsx <span className="text-[10px] text-slate-400 font-sans"># React DOM Mount</span></div>
                  <div className="pl-3 text-slate-600">└── index.css <span className="text-[10px] text-slate-400 font-sans"># Tailwind CSS</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Request Flow Diagram */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Request Flow: Frontend se Backend tak kaise jata hai?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-indigo-700 uppercase">1. User Prompt</div>
                <p className="text-slate-600 text-[11px]">
                  React Frontend (<code className="text-slate-900 font-mono">/src</code>) se user prompt type karta hai ya attack preset choose karta hai.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-amber-700 uppercase">2. Express Server</div>
                <p className="text-slate-600 text-[11px]">
                  Request backend route <code className="text-slate-900 font-mono">/api/chat/guarded</code> ya <code className="text-slate-900 font-mono">/api/guard/inspect</code> par aati hai.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">3. AI Guard Middleware</div>
                <p className="text-slate-600 text-[11px]">
                  <code className="text-slate-900 font-mono">server/middleware/</code> prompt injection aur token quota check karta hai (1ms).
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-purple-700 uppercase">4. Safe Response</div>
                <p className="text-slate-600 text-[11px]">
                  AI response se secret keys redact hoti hain aur React UI me visualizer update ho jata hai.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Summary Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-semibold">
                <tr>
                  <th className="p-2.5 border-b border-slate-200">Folder / File</th>
                  <th className="p-2.5 border-b border-slate-200">Kiska Part Hai?</th>
                  <th className="p-2.5 border-b border-slate-200">Main Kaam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                <tr>
                  <td className="p-2.5 font-mono text-emerald-700 font-medium">server/middleware/</td>
                  <td className="p-2.5 font-medium text-emerald-900">🛡️ Backend (Core)</td>
                  <td className="p-2.5">Prompt injection, sliding token counter &amp; data leakage masking</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-emerald-700 font-medium">server/routes/</td>
                  <td className="p-2.5 font-medium text-emerald-900">🛡️ Backend (API)</td>
                  <td className="p-2.5">Guarded chat endpoint &amp; security telemetry inspection APIs</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-emerald-700 font-medium">server/services/</td>
                  <td className="p-2.5 font-medium text-emerald-900">🛡️ Backend (AI)</td>
                  <td className="p-2.5">Gemini AI model SDK connection</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-slate-800 font-medium">server.ts</td>
                  <td className="p-2.5 font-medium text-slate-900">⚙️ Server Entry</td>
                  <td className="p-2.5">Express server ko port 3000 par start karta hai aur Vite ko host karta hai</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-indigo-700 font-medium">src/components/</td>
                  <td className="p-2.5 font-medium text-indigo-900">🖥️ Frontend (UI)</td>
                  <td className="p-2.5">Playground, 3-layer visualizer, threat table, metrics cards</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono text-indigo-700 font-medium">src/App.tsx</td>
                  <td className="p-2.5 font-medium text-indigo-900">🖥️ Frontend (View)</td>
                  <td className="p-2.5">Main client-side state, API callers &amp; tabs layout</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Folder structure ab 100% clean aur separated hai!</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
