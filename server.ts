import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { guardRouter, activeConfig } from './server/routes/guardRoutes';
import { chatRouter } from './server/routes/chatRoutes';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // ==========================================
  // BACKEND API ROUTES
  // ==========================================

  // 1. Health check & status
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      activeRules: {
        promptInjection: activeConfig.promptInjection.enabled,
        costGuard: activeConfig.tokenGuard.enabled,
        dataLeakage: activeConfig.dataLeakage.enabled
      }
    });
  });

  // 2. AI Guard Telemetry & Management Routes (/api/guard/*)
  app.use('/api/guard', guardRouter);

  // 3. Live Guarded AI Chat Endpoint (/api/chat/*)
  app.use('/api/chat', chatRouter);

  // ==========================================
  // FRONTEND VITE INTEGRATION
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Guard Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
