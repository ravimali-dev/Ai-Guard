import { Router, Response } from 'express';
import { aiGuard } from '../middleware/aiGuardExpress';
import { generateAiResponse } from '../services/geminiService';

export const chatRouter = Router();

// Configure the AI Guard middleware for chat endpoints
const guard = aiGuard({
  getUserId: (req) => (req.headers['x-user-id'] as string) || req.body?.userId || 'express-user-1',
  onThreatDetected: (threat) => {
    console.warn(`[AI-GUARD] Threat intercepted: ${threat.type} by user ${threat.userId}`);
  }
});

/**
 * POST /api/chat/guarded
 * Live Express endpoint protected by AI Guard middleware.
 * - Layer 1 (Prompt Injection) runs automatically before route handler.
 * - Layer 2 (Sliding Token Budget) runs automatically before route handler.
 * - Layer 3 (Data Leakage Redactor) automatically wraps res.json.
 */
chatRouter.post('/guarded', guard, async (req: any, res: Response) => {
  const { prompt, simulateOutputLeak } = req.body;

  let responseContent = '';
  if (simulateOutputLeak) {
    // Allows testing Layer 3 (outbound secret masking)
    responseContent = simulateOutputLeak;
  } else {
    responseContent = await generateAiResponse(prompt || 'Hello');
  }

  // res.json is intercepted by Layer 3 to redact any sensitive keys or PII
  res.json({
    success: true,
    message: responseContent,
    guardTelemetry: {
      userId: req.aiGuard?.userId,
      tokensEstimated: req.aiGuard?.tokensEstimated,
      tokensRemaining: req.aiGuard?.tokensRemaining,
      injectionRiskScore: req.aiGuard?.injectionResult?.riskScore ?? 0
    }
  });
});
