import { createAnthropic } from '@ai-sdk/anthropic';
import { LanguageModelV1 } from 'ai';
import { ResolvedModelConfig } from '../types.js';

export function createAnthropicModel(config: ResolvedModelConfig): LanguageModelV1 {
  const anthropic = createAnthropic({
    apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY || 'mock-key',
    baseURL: config.baseUrl || process.env.ANTHROPIC_BASE_URL,
  });

  return anthropic(config.model);
}
