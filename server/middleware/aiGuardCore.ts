import {
  PromptInjectionResult,
  PromptInjectionRule,
  TokenGuardConfig,
  TokenGuardResult,
  TokenUsageRecord,
  DataLeakageResult,
  DataLeakageRule,
  GuardConfig,
  ThreatLevel
} from '../types';

// ==========================================
// 1. PROMPT INJECTION DETECTOR
// ==========================================

export const DEFAULT_INJECTION_RULES: PromptInjectionRule[] = [
  {
    id: 'pi-sys-override-01',
    name: 'Instruction Disregard / Override',
    category: 'system_override',
    pattern: '\\b(?:ignore|disregard|forget|bypass|override)\\s+(?:all\\s+)?(?:previous|prior|above|system|existing)?\\s*(?:instructions?|prompts?|rules?|commands?|guidelines?)\\b',
    description: 'Attempts to wipe prior instructions or system guidelines.',
    severity: 'critical',
    weight: 45
  },
  {
    id: 'pi-sys-override-02',
    name: 'New Persona / Rule Reset',
    category: 'system_override',
    pattern: '\\b(?:from now on|henceforth)\\s+(?:you\\s+(?:must|will|are)|act\\s+as|ignore)\\b',
    description: 'Attempts to reset conversational constraints with a new persona.',
    severity: 'medium',
    weight: 25
  },
  {
    id: 'pi-jailbreak-01',
    name: 'DAN / Unrestricted Jailbreak',
    category: 'jailbreak',
    pattern: '\\b(?:DAN|do\\s+anything\\s+now|developer\\s+mode|unrestricted\\s+mode|jailbreak(?:ed)?|evil\\s+mode|an\\s+uncensored\\s+AI)\\b',
    description: 'Common jailbreak personas (Do Anything Now, Uncensored, Developer Mode).',
    severity: 'critical',
    weight: 50
  },
  {
    id: 'pi-jailbreak-02',
    name: 'Ethical Bypass / Hypothetical Framing',
    category: 'jailbreak',
    pattern: '\\b(?:pretend\\s+you\\s+have\\s+no\\s+(?:ethics|rules|filters|morals)|in\\s+a\\s+fictional\\s+world\\s+where\\s+nothing\\s+is\\s+illegal)\\b',
    description: 'Attempts to coax unethical output via fictional or amoral roleplay.',
    severity: 'high' as ThreatLevel,
    weight: 35
  },
  {
    id: 'pi-sys-leak-01',
    name: 'System Prompt Extraction',
    category: 'system_leak',
    pattern: '\\b(?:repeat|reveal|display|output|show|print|leak|tell\\s+me)\\s+(?:your|the)?\\s*(?:entire\\s+)?(?:system\\s+prompt|initial\\s+instructions?|hidden\\s+instructions?|secret\\s+prompt|developer\\s+notes?)\\b',
    description: 'Attempts to steal or dump internal system prompts.',
    severity: 'critical',
    weight: 40
  },
  {
    id: 'pi-delimiter-01',
    name: 'Delimiter / Tag Injection',
    category: 'delimiter_injection',
    pattern: '(?:---+|===+)\\s*(?:START|END)\\s+(?:SYSTEM|PROMPT|INSTRUCTIONS?)|<\\/?(?:im_start|im_end|sys|system|inst|instruction)[^>]*>|\\[INST\\]|\\[\\/INST\\]',
    description: 'Fakes system token boundaries or chat-markup delimiters.',
    severity: 'critical',
    weight: 45
  },
  {
    id: 'pi-encoded-01',
    name: 'Obfuscated / Base64 Payload',
    category: 'encoded_payload',
    pattern: '(?:[A-Za-z0-9+/]{36,}={0,2})',
    description: 'Suspicious long Base64 string that may contain disguised attack text.',
    severity: 'medium',
    weight: 30
  }
];

export function detectPromptInjection(
  prompt: string,
  config: GuardConfig['promptInjection']
): PromptInjectionResult {
  const startTime = performance.now();
  if (!config.enabled || !prompt || typeof prompt !== 'string') {
    return {
      passed: true,
      action: 'allow',
      riskScore: 0,
      threatLevel: 'safe',
      matchedRules: [],
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  const matchedRules: PromptInjectionResult['matchedRules'] = [];
  let rawScore = 0;

  // 1. Built-in rules
  for (const rule of DEFAULT_INJECTION_RULES) {
    try {
      const regex = new RegExp(rule.pattern, 'gi');
      const matches = prompt.match(regex);
      if (matches && matches.length > 0) {
        matchedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          matchedText: matches[0],
          severity: rule.severity
        });
        rawScore += rule.weight * (matches.length > 1 ? 1.2 : 1.0);
      }
    } catch {
      // safe fallback for regex parsing
    }
  }

  // 2. Base64 payload decoding check (inspects if decoded string has injection phrases)
  const base64Candidate = prompt.match(/[A-Za-z0-9+/]{24,}={0,2}/g);
  if (base64Candidate) {
    for (const candidate of base64Candidate) {
      try {
        const decoded = typeof atob === 'function' ? atob(candidate) : Buffer.from(candidate, 'base64').toString('utf-8');
        if (decoded && /ignore\s+(all\s+)?instructions|system\s+prompt|jailbreak|DAN/i.test(decoded)) {
          matchedRules.push({
            ruleId: 'pi-encoded-decoded-hit',
            ruleName: 'Hidden Injection inside Base64 Payload',
            category: 'encoded_payload',
            matchedText: `${candidate.slice(0, 16)}... -> "${decoded.slice(0, 40)}"`,
            severity: 'critical'
          });
          rawScore += 50;
        }
      } catch {
        // not valid base64
      }
    }
  }

  // 3. Custom user keywords
  if (config.customKeywords && config.customKeywords.length > 0) {
    for (const keyword of config.customKeywords) {
      const trimmed = keyword.trim();
      if (trimmed && prompt.toLowerCase().includes(trimmed.toLowerCase())) {
        matchedRules.push({
          ruleId: 'pi-custom-rule',
          ruleName: `Custom Blocked Term: "${trimmed}"`,
          category: 'custom',
          matchedText: trimmed,
          severity: 'critical'
        });
        rawScore += 40;
      }
    }
  }

  const riskScore = Math.min(100, Math.round(rawScore));

  // Determine threshold based on sensitivity
  let threshold = 50; // medium
  if (config.sensitivity === 'high') threshold = 35;
  if (config.sensitivity === 'low') threshold = 70;

  const hasCriticalMatch = matchedRules.some((r) => r.severity === 'critical');
  const isBlocked = riskScore >= threshold || hasCriticalMatch;

  let threatLevel: ThreatLevel = 'safe';
  if (riskScore >= 75 || hasCriticalMatch) threatLevel = 'critical';
  else if (riskScore >= 45) threatLevel = 'medium';
  else if (riskScore > 0) threatLevel = 'low';

  const latencyMs = Number((performance.now() - startTime).toFixed(2));

  return {
    passed: !isBlocked,
    action: isBlocked ? (config.action === 'sanitize' ? 'flag' : 'block') : 'allow',
    riskScore,
    threatLevel,
    matchedRules,
    sanitizedPrompt: isBlocked && config.action === 'sanitize' ? sanitizeText(prompt, matchedRules) : undefined,
    latencyMs
  };
}

function sanitizeText(
  text: string,
  matched: PromptInjectionResult['matchedRules']
): string {
  let cleaned = text;
  for (const m of matched) {
    cleaned = cleaned.replace(new RegExp(escapeRegExp(m.matchedText), 'gi'), '[STRIPPED_SECURITY_VIOLATION]');
  }
  return cleaned;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==========================================
// 2. TOKEN & COST GUARD (SLIDING WINDOW)
// ==========================================

// In-memory sliding window user state
const userWindowStore = new Map<string, TokenUsageRecord[]>();

/**
 * Fast & accurate token counter heuristic (avg 3.8 chars/token for English/code).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Account for words, whitespace, and punctuation
  const trimmed = text.trim();
  const wordCount = (trimmed.match(/\S+/g) || []).length;
  const charCount = trimmed.length;
  // Blend char-based and word-based heuristics
  const tokenEstimate = Math.ceil(Math.max(charCount / 3.8, wordCount * 1.3));
  return tokenEstimate;
}

export function checkTokenGuard(
  userId: string,
  prompt: string,
  config: TokenGuardConfig
): TokenGuardResult {
  const startTime = performance.now();
  const estimatedPromptTokens = estimateTokens(prompt);
  const now = Date.now();

  if (!config.enabled) {
    return {
      passed: true,
      action: 'allow',
      userId,
      estimatedPromptTokens,
      windowTokensUsed: estimatedPromptTokens,
      windowTokensRemaining: config.maxTokensPerWindow,
      windowResetMs: config.windowMs,
      requestsInWindow: 1,
      estimatedCostUsd: (estimatedPromptTokens / 1_000_000) * config.estimatedCostPer1MInput,
      costSavedUsd: 0,
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  // Retrieve or init user records
  let records = userWindowStore.get(userId) || [];
  // Evict records older than windowMs
  const windowStart = now - config.windowMs;
  records = records.filter((r) => r.timestamp > windowStart);

  const tokensUsedInWindow = records.reduce((sum, r) => sum + r.tokens, 0);
  const requestsInWindow = records.length;

  let passed = true;
  let blockedReason = '';

  // Check 1: Single prompt max token limit
  if (estimatedPromptTokens > config.maxPromptTokens) {
    passed = false;
    blockedReason = `Prompt exceeds single-request token limit (${estimatedPromptTokens} > ${config.maxPromptTokens} max).`;
  }
  // Check 2: Max requests per window limit
  else if (requestsInWindow >= config.maxRequestsPerWindow) {
    passed = false;
    blockedReason = `Request rate limit exceeded (${requestsInWindow}/${config.maxRequestsPerWindow} requests in ${Math.round(config.windowMs / 1000)}s window).`;
  }
  // Check 3: Sliding window token budget
  else if (tokensUsedInWindow + estimatedPromptTokens > config.maxTokensPerWindow) {
    passed = false;
    blockedReason = `Sliding token budget exceeded (used ${tokensUsedInWindow} + ${estimatedPromptTokens} > ${config.maxTokensPerWindow} quota).`;
  }

  const estimatedCostUsd = Number(
    ((estimatedPromptTokens / 1_000_000) * config.estimatedCostPer1MInput).toFixed(6)
  );

  let costSavedUsd = 0;
  if (!passed) {
    // If request blocked, calculate potential cost saved (including response cost multiplier)
    const hypotheticalTotalTokens = estimatedPromptTokens * 2.5;
    costSavedUsd = Number(
      ((hypotheticalTotalTokens / 1_000_000) * config.estimatedCostPer1MInput).toFixed(6)
    );
  } else {
    // Commit to sliding window
    records.push({ timestamp: now, tokens: estimatedPromptTokens });
    userWindowStore.set(userId, records);
  }

  // Oldest record dictates window reset
  const oldestRecord = records[0];
  const windowResetMs = oldestRecord ? Math.max(0, oldestRecord.timestamp + config.windowMs - now) : config.windowMs;

  const currentWindowTotal = records.reduce((sum, r) => sum + r.tokens, 0);
  const remaining = Math.max(0, config.maxTokensPerWindow - currentWindowTotal);

  return {
    passed,
    action: passed ? 'allow' : 'block',
    userId,
    estimatedPromptTokens,
    windowTokensUsed: currentWindowTotal,
    windowTokensRemaining: remaining,
    windowResetMs,
    requestsInWindow: records.length,
    estimatedCostUsd,
    costSavedUsd,
    blockedReason: blockedReason || undefined,
    latencyMs: Number((performance.now() - startTime).toFixed(2))
  };
}

export function resetUserTokenWindow(userId?: string) {
  if (userId) {
    userWindowStore.delete(userId);
  } else {
    userWindowStore.clear();
  }
}

// ==========================================
// 3. DATA LEAKAGE FILTER
// ==========================================

export const DEFAULT_LEAKAGE_RULES: DataLeakageRule[] = [
  {
    id: 'leak-openai-key',
    name: 'OpenAI API Key',
    category: 'api_key',
    pattern: '\\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\\b',
    description: 'Live OpenAI secret API key pattern.',
    replacement: '[REDACTED_OPENAI_API_KEY]'
  },
  {
    id: 'leak-anthropic-key',
    name: 'Anthropic Claude API Key',
    category: 'api_key',
    pattern: '\\bsk-ant-[A-Za-z0-9_-]{20,}\\b',
    description: 'Anthropic Claude secret API key pattern.',
    replacement: '[REDACTED_ANTHROPIC_KEY]'
  },
  {
    id: 'leak-google-key',
    name: 'Google AI / Cloud API Key',
    category: 'api_key',
    pattern: '\\bAIza[0-9A-Za-z_-]{35}\\b',
    description: 'Google AI Studio / GCP API Key.',
    replacement: '[REDACTED_GOOGLE_API_KEY]'
  },
  {
    id: 'leak-aws-access',
    name: 'AWS Access Key ID',
    category: 'api_key',
    pattern: '\\bAKIA[0-9A-Z]{16}\\b',
    description: 'Amazon Web Services IAM Access Key ID.',
    replacement: '[REDACTED_AWS_ACCESS_KEY]'
  },
  {
    id: 'leak-github-pat',
    name: 'GitHub Personal Token',
    category: 'api_key',
    pattern: '\\bgh[pousr]_[A-Za-z0-9_]{36,}\\b',
    description: 'GitHub Personal Access Token.',
    replacement: '[REDACTED_GITHUB_TOKEN]'
  },
  {
    id: 'leak-jwt-token',
    name: 'JWT / Bearer Token',
    category: 'credentials',
    pattern: '\\beyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]+\\b',
    description: 'JSON Web Token (JWT) session credential.',
    replacement: '[REDACTED_JWT_TOKEN]'
  },
  {
    id: 'leak-private-key',
    name: 'Private RSA / SSH Key',
    category: 'credentials',
    pattern: '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\\s\\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    description: 'Asymmetric Cryptographic Private Key block.',
    replacement: '[REDACTED_PRIVATE_KEY_BLOCK]'
  },
  {
    id: 'leak-email',
    name: 'Email Address (PII)',
    category: 'pii',
    pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b',
    description: 'Customer or user email address.',
    replacement: '[REDACTED_EMAIL]'
  },
  {
    id: 'leak-us-ssn',
    name: 'US Social Security Number',
    category: 'pii',
    pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
    description: 'US Social Security Number format.',
    replacement: '[REDACTED_SSN]'
  },
  {
    id: 'leak-credit-card',
    name: 'Credit Card Number',
    category: 'pii',
    pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b',
    description: 'Standard credit card number pattern.',
    replacement: '[REDACTED_CREDIT_CARD]'
  },
  {
    id: 'leak-database-uri',
    name: 'Database Connection String',
    category: 'credentials',
    pattern: '(?:postgres(?:ql)?|mongodb(?:\\+srv)?|mysql|redis):\\/\\/[^\\s"\'`<>]+',
    description: 'Database connection URI with credentials.',
    replacement: '[REDACTED_DATABASE_URI]'
  }
];

export function filterDataLeakage(
  responseText: string,
  config: GuardConfig['dataLeakage']
): DataLeakageResult {
  const startTime = performance.now();

  if (!config.enabled || !responseText) {
    return {
      passed: true,
      action: 'allow',
      leaksFound: 0,
      originalText: responseText || '',
      filteredText: responseText || '',
      matchedItems: [],
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  let filteredText = responseText;
  const matchedItems: DataLeakageResult['matchedItems'] = [];

  for (const rule of DEFAULT_LEAKAGE_RULES) {
    // Check if category is enabled in config
    if (rule.category === 'api_key' && !config.detectApiKeys) continue;
    if (rule.category === 'pii' && rule.id === 'leak-email' && !config.detectEmails) continue;
    if (rule.category === 'pii' && rule.id !== 'leak-email' && !config.detectPii) continue;

    try {
      const regex = new RegExp(rule.pattern, 'g');
      const matches = responseText.match(regex);
      if (matches && matches.length > 0) {
        for (const match of matches) {
          matchedItems.push({
            ruleId: rule.id,
            category: rule.category,
            ruleName: rule.name,
            redactedValue: rule.replacement,
            matchPreview: maskSecret(match)
          });
        }
        filteredText = filteredText.replace(regex, rule.replacement);
      }
    } catch {
      // safe regex fallback
    }
  }

  // Custom keywords filter
  if (config.customKeywords && config.customKeywords.length > 0) {
    for (const kw of config.customKeywords) {
      const trimmed = kw.trim();
      if (!trimmed) continue;
      const regex = new RegExp(escapeRegExp(trimmed), 'gi');
      if (regex.test(responseText)) {
        matchedItems.push({
          ruleId: 'leak-custom',
          category: 'custom',
          ruleName: `Custom Secret: "${trimmed}"`,
          redactedValue: '[REDACTED_INTERNAL_SECRET]',
          matchPreview: maskSecret(trimmed)
        });
        filteredText = filteredText.replace(regex, '[REDACTED_INTERNAL_SECRET]');
      }
    }
  }

  const leaksFound = matchedItems.length;
  const isBlocked = leaksFound > 0 && config.action === 'block';
  const isRedacted = leaksFound > 0 && config.action === 'redact';

  return {
    passed: !isBlocked,
    action: isBlocked ? 'blocked' : isRedacted ? 'redacted' : 'allow',
    leaksFound,
    originalText: responseText,
    filteredText: isBlocked ? 'SECURITY ALERT: Output blocked by AI Guard due to sensitive data leakage.' : filteredText,
    matchedItems,
    latencyMs: Number((performance.now() - startTime).toFixed(2))
  };
}

function maskSecret(val: string): string {
  if (!val) return '';
  if (val.includes('@')) {
    const [user, domain] = val.split('@');
    return `${user.slice(0, 2)}***@${domain}`;
  }
  if (val.length <= 8) return '****';
  return `${val.slice(0, 4)}...${val.slice(-4)}`;
}
