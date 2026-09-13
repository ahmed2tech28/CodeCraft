// User & Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  isSuperuser: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

// System Settings & Onboarding
export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStatus {
  isInitialized: boolean;
  hasSuperuser: boolean;
  defaultProviderConfigured: boolean;
}

// Project & Workspace Types
export type ProjectStatus = 'idle' | 'building' | 'running' | 'error' | 'stopped';

export interface Project {
  id: string;
  userId: string;
  name: string;
  slug: string;
  path: string;
  status: ProjectStatus;
  previewUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes?: number;
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  content: string;
}

// Conversation & Agent Types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokens?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
}

export type AgentRunStatus =
  | 'queued'
  | 'planning'
  | 'coding'
  | 'installing'
  | 'building'
  | 'debugging'
  | 'testing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AgentRun {
  id: string;
  projectId: string;
  prompt: string;
  status: AgentRunStatus;
  durationMs?: number;
  tokensUsed?: number;
  error?: string | null;
  createdAt: string;
}

export interface AgentToolCall {
  id: string;
  agentRunId: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | string | null;
  status: 'pending' | 'success' | 'error';
  durationMs?: number;
  createdAt: string;
}

export interface AgentStepEvent {
  type: 'connected' | 'status' | 'thinking' | 'tool_call' | 'tool_result' | 'file_change' | 'complete' | 'error';
  status?: AgentRunStatus;
  text?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown> | string;
  filePath?: string;
  error?: string;
  timestamp: string;
}

// AI Provider Types
export type AIProviderName = 'openai' | 'anthropic' | 'openrouter' | 'ollama';

export interface ProviderConfig {
  id: string;
  provider: AIProviderName;
  model: string;
  isActive: boolean;
  apiKey?: string;
  baseUrl?: string;
  createdAt: string;
}
