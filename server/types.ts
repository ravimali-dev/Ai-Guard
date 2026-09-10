export type ThreatLevel = 'safe' | 'low' | 'medium' | 'critical';

export type GuardAction = 'allow' | 'block' | 'redact' | 'flag';

export interface PromptInjectionRule {
  id: string;
  name: string;
  category: 'system_override' | 'jailbreak' | 'delimiter_injection' | 'system_leak' | 'encoded_payload' | 'custom';
  pattern: string; // regex string
  description: string;
  severity: ThreatLevel;
  weight: number;
}

export interface PromptInjectionResult {
  passed: boolean;
  action: GuardAction;
  riskScore: number; // 0 - 100
  threatLevel: ThreatLevel;
  matchedRules: Array<{
    ruleId: string;
    ruleName: string;
    category: string;
    matchedText: string;
    severity: ThreatLevel;
  }>;
  sanitizedPrompt?: string;
  latencyMs: number;
}

export interface TokenGuardConfig {
  enabled: boolean;
  maxTokensPerWindow: number;
  windowMs: number;
  maxPromptTokens: number;
  maxRequestsPerWindow: number;
  estimatedCostPer1MInput: number; // in USD, e.g. 0.15 for Flash, 2.50 for GPT-4o
  estimatedCostPer1MOutput: number;
}

export interface TokenUsageRecord {
  timestamp: number;
  tokens: number;
}

export interface TokenGuardResult {
  passed: boolean;
  action: GuardAction;
  userId: string;
  estimatedPromptTokens: number;
  windowTokensUsed: number;
  windowTokensRemaining: number;
  windowResetMs: number;
  requestsInWindow: number;
  estimatedCostUsd: number;
  costSavedUsd: number;
  blockedReason?: string;
  latencyMs: number;
}

export interface DataLeakageRule {
  id: string;
  name: string;
  category: 'api_key' | 'pii' | 'credentials' | 'system_info' | 'custom';
  pattern: string;
  description: string;
  replacement: string;
}

export interface DataLeakageResult {
  passed: boolean;
  action: 'allow' | 'redacted' | 'blocked';
  leaksFound: number;
  originalText: string;
  filteredText: string;
  matchedItems: Array<{
    ruleId: string;
    category: string;
    ruleName: string;
    redactedValue: string;
    matchPreview: string;
  }>;
  latencyMs: number;
}

export interface AIGuardPipelineResult {
  requestId: string;
  timestamp: number;
  userId: string;
  prompt: string;
  promptInjection: PromptInjectionResult;
  tokenGuard: TokenGuardResult;
  aiResponse?: string;
  dataLeakage?: DataLeakageResult;
  overallStatus: 'passed' | 'blocked_prompt_injection' | 'blocked_cost_limit' | 'blocked_data_leakage' | 'passed_with_redactions';
  totalLatencyMs: number;
  aiSource: 'gemini' | 'simulated';
}

export interface GuardConfig {
  promptInjection: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high';
    action: 'block' | 'sanitize';
    customKeywords: string[];
  };
  tokenGuard: TokenGuardConfig;
  dataLeakage: {
    enabled: boolean;
    action: 'redact' | 'block';
    detectApiKeys: boolean;
    detectEmails: boolean;
    detectPii: boolean;
    customKeywords: string[];
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string;
  promptPreview: string;
  status: 'allowed' | 'blocked' | 'redacted';
  stage: 'prompt_injection' | 'token_guard' | 'data_leakage' | 'clean';
  reason: string;
  latencyMs: number;
  tokensEstimated: number;
  costSavedUsd: number;
}

export interface AggregateMetrics {
  totalRequests: number;
  injectionsBlocked: number;
  costLimitBlocks: number;
  leaksRedacted: number;
  tokensConsumed: number;
  tokensSaved: number;
  costSavedUsd: number;
  avgLatencyOverheadMs: number;
}

export interface AttackPreset {
  id: string;
  name: string;
  moduleTarget: 'prompt_injection' | 'token_guard' | 'data_leakage' | 'safe';
  categoryLabel: string;
  prompt: string;
  simulateOutputLeak?: string;
  description: string;
}
