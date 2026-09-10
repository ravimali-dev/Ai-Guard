import type { Request, Response, NextFunction } from 'express';
import {
  detectPromptInjection,
  checkTokenGuard,
  filterDataLeakage,
  DEFAULT_INJECTION_RULES,
  DEFAULT_LEAKAGE_RULES
} from './aiGuardCore';
import {
  GuardConfig,
  AIGuardPipelineResult,
  PromptInjectionResult,
  TokenGuardResult,
  DataLeakageResult
} from '../types';

export interface AIGuardOptions {
  promptInjection?: Partial<GuardConfig['promptInjection']>;
  tokenGuard?: Partial<GuardConfig['tokenGuard']>;
  dataLeakage?: Partial<GuardConfig['dataLeakage']>;
  getUserId?: (req: Request) => string;
  extractPrompt?: (req: Request) => string;
  onThreatDetected?: (threat: {
    type: 'prompt_injection' | 'token_drain' | 'data_leak';
    userId: string;
    details: PromptInjectionResult | TokenGuardResult | DataLeakageResult;
  }) => void;
}

export const DEFAULT_GUARD_CONFIG: GuardConfig = {
  promptInjection: {
    enabled: true,
    sensitivity: 'high',
    action: 'block',
    customKeywords: []
  },
  tokenGuard: {
    enabled: true,
    maxTokensPerWindow: 4000,
    windowMs: 60 * 1000, // 1 minute sliding window
    maxPromptTokens: 1500,
    maxRequestsPerWindow: 20,
    estimatedCostPer1MInput: 0.15, // $0.15 / 1M tokens (Gemini 2.5/3 Flash benchmark)
    estimatedCostPer1MOutput: 0.60
  },
  dataLeakage: {
    enabled: true,
    action: 'redact',
    detectApiKeys: true,
    detectEmails: true,
    detectPii: true,
    customKeywords: []
  }
};

export interface GuardedRequest extends Request {
  aiGuard?: {
    userId: string;
    prompt: string;
    tokensEstimated: number;
    tokensRemaining: number;
    injectionResult: PromptInjectionResult;
    tokenResult: TokenGuardResult;
    filterResponse: (text: string) => string;
  };
}

/**
 * 🛡️ Express Middleware for AI Security
 * Integrate in 2-3 lines:
 *
 * ```ts
 * import { aiGuard } from './aiGuardExpress';
 * app.use('/api/chat', aiGuard());
 * ```
 */
export function aiGuard(options: AIGuardOptions = {}) {
  const mergedConfig: GuardConfig = {
    promptInjection: {
      ...DEFAULT_GUARD_CONFIG.promptInjection,
      ...options.promptInjection
    },
    tokenGuard: {
      ...DEFAULT_GUARD_CONFIG.tokenGuard,
      ...options.tokenGuard
    },
    dataLeakage: {
      ...DEFAULT_GUARD_CONFIG.dataLeakage,
      ...options.dataLeakage
    }
  };

  return function aiGuardMiddleware(req: GuardedRequest, res: Response, next: NextFunction) {
    // 1. Identify user (IP or Header or fallback)
    const userId = options.getUserId
      ? options.getUserId(req)
      : (req.headers['x-user-id'] as string) || req.ip || 'anonymous-user';

    // 2. Extract prompt text
    let promptText = '';
    if (options.extractPrompt) {
      promptText = options.extractPrompt(req);
    } else if (req.body) {
      if (typeof req.body.prompt === 'string') {
        promptText = req.body.prompt;
      } else if (Array.isArray(req.body.messages)) {
        promptText = req.body.messages.map((m: { content?: string }) => m.content || '').join('\n');
      } else if (typeof req.body.input === 'string') {
        promptText = req.body.input;
      } else if (typeof req.body.query === 'string') {
        promptText = req.body.query;
      }
    }

    // LAYER 1: Prompt Injection Detection
    const injectionResult = detectPromptInjection(promptText, mergedConfig.promptInjection);
    if (!injectionResult.passed && mergedConfig.promptInjection.action === 'block') {
      if (options.onThreatDetected) {
        options.onThreatDetected({ type: 'prompt_injection', userId, details: injectionResult });
      }
      res.status(400).json({
        error: 'Prompt injection attempt blocked by AI Guard',
        code: 'AIGUARD_PROMPT_INJECTION',
        riskScore: injectionResult.riskScore,
        threatLevel: injectionResult.threatLevel,
        matchedRules: injectionResult.matchedRules.map((r) => r.ruleName)
      });
      return;
    }

    // LAYER 2: Token / Cost Guard
    const tokenResult = checkTokenGuard(userId, promptText, mergedConfig.tokenGuard);
    res.setHeader('X-AIGuard-Remaining-Tokens', tokenResult.windowTokensRemaining.toString());
    res.setHeader('X-AIGuard-Window-Reset-Ms', tokenResult.windowResetMs.toString());

    if (!tokenResult.passed) {
      if (options.onThreatDetected) {
        options.onThreatDetected({ type: 'token_drain', userId, details: tokenResult });
      }
      res.setHeader('Retry-After', Math.ceil(tokenResult.windowResetMs / 1000).toString());
      res.status(429).json({
        error: 'Cost Guard budget exceeded',
        code: 'AIGUARD_RATE_LIMIT_EXCEEDED',
        details: tokenResult.blockedReason,
        windowTokensUsed: tokenResult.windowTokensUsed,
        quota: mergedConfig.tokenGuard.maxTokensPerWindow,
        resetInSeconds: Math.ceil(tokenResult.windowResetMs / 1000)
      });
      return;
    }

    // Attach metadata to req.aiGuard
    req.aiGuard = {
      userId,
      prompt: injectionResult.sanitizedPrompt || promptText,
      tokensEstimated: tokenResult.estimatedPromptTokens,
      tokensRemaining: tokenResult.windowTokensRemaining,
      injectionResult,
      tokenResult,
      filterResponse: (text: string) => {
        const leakResult = filterDataLeakage(text, mergedConfig.dataLeakage);
        return leakResult.filteredText;
      }
    };

    // LAYER 3: Intercept outgoing response for Data Leakage Protection
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Patch res.json
    res.json = function (body: unknown) {
      if (mergedConfig.dataLeakage.enabled && body) {
        if (typeof body === 'string') {
          const leak = filterDataLeakage(body, mergedConfig.dataLeakage);
          if (!leak.passed) {
            return res.status(403).json({ error: 'Response blocked due to sensitive data leak' });
          }
          return originalJson(leak.filteredText);
        } else if (typeof body === 'object') {
          try {
            const str = JSON.stringify(body);
            const leak = filterDataLeakage(str, mergedConfig.dataLeakage);
            if (!leak.passed) {
              return res.status(403).json({ error: 'Response blocked due to sensitive data leak' });
            }
            const parsed = JSON.parse(leak.filteredText);
            return originalJson(parsed);
          } catch {
            // fallback
          }
        }
      }
      return originalJson(body);
    } as any;

    // Patch res.send
    res.send = function (body: unknown) {
      if (mergedConfig.dataLeakage.enabled && typeof body === 'string') {
        const leak = filterDataLeakage(body, mergedConfig.dataLeakage);
        if (!leak.passed) {
          return res.status(403).send('Response blocked due to sensitive data leak');
        }
        return originalSend(leak.filteredText);
      }
      return originalSend(body);
    } as any;

    next();
  };
}

/**
 * Programmatic Full-Pipeline Inspector (used for the testing dashboard and standalone scripts)
 */
export function inspectFullPipeline(
  prompt: string,
  userId: string,
  simulatedResponseText?: string,
  config: GuardConfig = DEFAULT_GUARD_CONFIG
): AIGuardPipelineResult {
  const start = performance.now();
  const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
  const now = Date.now();

  // 1. Prompt Injection
  const piResult = detectPromptInjection(prompt, config.promptInjection);

  // 2. Token Guard
  const tgResult = checkTokenGuard(userId, prompt, config.tokenGuard);

  // 3. Response Leakage (if provided)
  let dlResult: DataLeakageResult | undefined;
  if (simulatedResponseText !== undefined) {
    dlResult = filterDataLeakage(simulatedResponseText, config.dataLeakage);
  }

  // Determine overall status
  let overallStatus: AIGuardPipelineResult['overallStatus'] = 'passed';
  if (!piResult.passed) {
    overallStatus = 'blocked_prompt_injection';
  } else if (!tgResult.passed) {
    overallStatus = 'blocked_cost_limit';
  } else if (dlResult && !dlResult.passed) {
    overallStatus = 'blocked_data_leakage';
  } else if (dlResult && dlResult.action === 'redacted') {
    overallStatus = 'passed_with_redactions';
  }

  const totalLatencyMs = Number((performance.now() - start).toFixed(2));

  return {
    requestId,
    timestamp: now,
    userId,
    prompt,
    promptInjection: piResult,
    tokenGuard: tgResult,
    aiResponse: dlResult ? dlResult.filteredText : simulatedResponseText,
    dataLeakage: dlResult,
    overallStatus,
    totalLatencyMs,
    aiSource: 'simulated'
  };
}

export { DEFAULT_INJECTION_RULES, DEFAULT_LEAKAGE_RULES };
