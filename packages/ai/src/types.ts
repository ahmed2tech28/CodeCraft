import { LanguageModelV1 } from 'ai';
import { AIProviderName } from '@codecraft/shared';

export interface ResolvedModelConfig {
  provider: AIProviderName;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ProviderFactoryResult {
  model: LanguageModelV1;
  config: ResolvedModelConfig;
}

export interface ConnectionTestResult {
  success: boolean;
  provider: string;
  model: string;
  latencyMs?: number;
  message?: string;
  error?: string;
}
