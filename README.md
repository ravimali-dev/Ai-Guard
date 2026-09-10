# 🛡️ AI Guard: Project Architecture & Folder Structure Guide

Yeh project **Frontend** aur **Backend** ke beech saaf aur alag (clean separation) tarike se organize kiya gaya hai, taaki aapko turant samajh aa sake ki kaun si file kahan hai aur kya kaam karti hai.

---

## 📁 Overall Folder Tree

```text
├── server/                               # 🛡️ MAIN BACKEND (Express Server & Security Engine)
│   ├── middleware/                       # AI Guard Middleware (In-Process Security)
│   │   ├── aiGuardCore.ts                # 3 Core engines: Prompt Injection, Token sliding window, Data redactor
│   │   └── aiGuardExpress.ts             # Express adapter: app.use(aiGuard()) plugin
│   ├── routes/                           # Express API endpoints
│   │   ├── chatRoutes.ts                 # /api/chat/guarded (Live protected AI route)
│   │   └── guardRoutes.ts                # /api/guard/* (inspect, metrics, audit logs, config)
│   ├── services/
│   │   └── geminiService.ts              # Google Gemini 2.5/3 Flash API SDK connection
│   └── types.ts                          # Backend TypeScript interfaces & types
│
├── src/                                  # 🖥️ FRONTEND (React 19 + Tailwind CSS)
│   ├── components/                       # Visual UI components
│   │   ├── Header.tsx                    # Top nav, status indicator & folder guide button
│   │   ├── DashboardMetrics.tsx          # Telemetry cards (Injections blocked, Cost saved, Tokens)
│   │   ├── Playground.tsx                # Interactive prompt tester & attack simulator buttons
│   │   ├── PipelineVisualizer.tsx        # 3-Layer step-by-step visual diagnostic inspection
│   │   ├── ThreatLog.tsx                 # Real-time threat audit trail table
│   │   ├── RuleConfigurator.tsx          # Security rule sensitivity & threshold editor
│   │   ├── CodeIntegrationModal.tsx      # 2-line Express / Next.js integration guide
│   │   └── ArchitectureModal.tsx         # In-App visual folder structure modal
│   ├── data/
│   │   └── presets.ts                    # Real attack payloads (DAN jailbreak, System prompt override, Leaks)
│   ├── types.ts                          # Frontend UI state interfaces & default config
│   ├── App.tsx                           # Main React application view & state manager
│   ├── main.tsx                          # React DOM entry point
│   └── index.css                         # Tailwind CSS global styles
│
├── server.ts                             # ⚙️ MAIN SERVER ENTRY POINT (Port 3000, Boots Express + Vite)
├── package.json                          # Scripts & dependencies (Express, React 19, Vite, Tailwind v4)
├── tsconfig.json                         # TypeScript configuration
└── vite.config.ts                        # Vite bundler configuration
```

---

## 1. 🛡️ Main Backend (`/server` aur `server.ts`)

Backend ka main kaam hai:
1. **`server/middleware/aiGuardCore.ts`**:
   - **Layer 1 (Prompt Injection)**: Regex-based pattern scanner jo user ke input ko model ke paas jane se pehle check karta hai.
   - **Layer 2 (Token / Cost Guard)**: In-memory sliding-window token tracker jo user ID ke basis par bots aur bill-drain spam ko throttle karta hai (HTTP 429).
   - **Layer 3 (Outbound Data Leakage)**: Regex rules jo AI ke response me se secret API keys (`sk-...`, `AIza...`), DB URIs, aur customer PII (Emails, cards) ko mask (`[REDACTED]`) karti hain.
2. **`server/middleware/aiGuardExpress.ts`**:
   - Express middleware export karta hai: `aiGuard()`.
   - Incoming request ke prompt ko scan karta hai aur outgoing `res.json` ko wrap karke leaks sanitize karta hai.
3. **`server/routes/`**:
   - `chatRoutes.ts`: `/api/chat/guarded` endpoint jisme real middleware laga hua hai.
   - `guardRoutes.ts`: `/api/guard/inspect`, `/api/guard/metrics`, `/api/guard/logs`, `/api/guard/config`.
4. **`server/services/geminiService.ts`**:
   - Gemini API connection.
5. **`server.ts`**:
   - Root file jo Express ko start karti hai aur Vite development server ko mount karti hai (Port 3000).

---

## 2. 🖥️ Frontend (`/src`)

Frontend ka kaam hai user ko visual testing interface provide karna:
1. **`src/components/Playground.tsx`**:
   - Input textarea jahan aap custom prompt likh sakte hain.
   - 6 Quick Attack Buttons (DAN Jailbreak, System Override, Base64 Obfuscation, Token Flood, Secret Key Leak).
   - "Test Express Route" aur "Simulate 10x Burst Spam" buttons.
2. **`src/components/PipelineVisualizer.tsx`**:
   - 3-Layer diagnostic display jo step-by-step dikhata hai ki kaun sa layer pass hua aur kaun sa block/redact hua.
3. **`src/components/DashboardMetrics.tsx`**:
   - Real-time telemetry: Injections blocked, Token quota, Cost saved ($), aur Latency (<1.5ms).
4. **`src/components/ThreatLog.tsx`**:
   - Har request ka audit trail (Timestamp, User ID, Stage, Status, Tokens).
5. **`src/components/RuleConfigurator.tsx`**:
   - Rules ko customize karne ka panel (High/Med/Low sensitivity, Token quotas, Custom keywords).

---

## 3. Apne Project me sirf Backend Middleware kaise copy karein?

Agar aapko apne kisi doosre Express project me AI Guard lagana hai, toh sirf yeh 2 files copy karni hain:
1. `server/middleware/aiGuardCore.ts`
2. `server/middleware/aiGuardExpress.ts`

Aur apne backend me likhein:
```typescript
import express from 'express';
import { aiGuard } from './server/middleware/aiGuardExpress';

const app = express();
app.use(express.json());

// 🛡️ 1 Line Middleware
app.use('/api/chat', aiGuard());

app.post('/api/chat', async (req, res) => {
  // Safe input, safe output!
  res.json({ reply: 'AI response here' });
});

app.listen(3000);
```
