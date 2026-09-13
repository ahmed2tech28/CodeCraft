import { z } from 'zod';

// Onboarding & Superuser Creation Schema
export const createSuperUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  aiProvider: z.enum(['openai', 'anthropic', 'openrouter', 'ollama']).default('openai'),
  aiModel: z.string().min(1, 'Model name is required'),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
});

export type CreateSuperUserInput = z.infer<typeof createSuperUserSchema>;

// User Login Schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Project Creation Schema
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(50),
  prompt: z.string().optional(),
  template: z.enum(['nextjs', 'blank']).default('nextjs'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// File Operation Schemas
export const readFileQuerySchema = z.object({
  path: z.string().min(1, 'File path is required'),
});

export const writeFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  content: z.string(),
});

export type WriteFileInput = z.infer<typeof writeFileSchema>;

// Agent Run Execution Schema
export const startAgentRunSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
  conversationId: z.string().optional(),
  modelOverride: z.string().optional(),
});

export type StartAgentRunInput = z.infer<typeof startAgentRunSchema>;

// AI Provider Configuration Schema
export const providerConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'openrouter', 'ollama']),
  model: z.string().min(1, 'Model is required'),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

export type ProviderConfigInput = z.infer<typeof providerConfigSchema>;
