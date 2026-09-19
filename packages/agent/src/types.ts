import { AgentRunStatus, AgentStepEvent } from '@codecraft/shared';

export type { AgentStepEvent };

export interface AgentContext {
  projectId: string;
  workspacePath: string;
  workspaceHostPath?: string;
  containerId?: string;
  runId: string;
  emitEvent: (event: AgentStepEvent) => void;
}

export interface RunAgentOptions {
  projectId: string;
  prompt: string;
  workspacePath: string;
  workspaceHostPath?: string;
  containerId?: string;
  maxSteps?: number;
  providerOverride?: 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'gemini';
  modelOverride?: string;
  apiKeyOverride?: string;
  baseUrlOverride?: string;
  onEvent?: (event: AgentStepEvent) => void;
}

export interface RunAgentResult {
  runId: string;
  projectId: string;
  status: AgentRunStatus;
  summary: string;
  totalSteps: number;
  filesModified: string[];
  durationMs: number;
  error?: string;
}
