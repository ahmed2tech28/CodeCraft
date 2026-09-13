import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1 } from 'ai';
import { ResolvedModelConfig } from '../types.js';

export function createOpenAIModel(config: ResolvedModelConfig): LanguageModelV1 {
  const openai = createOpenAI({
    apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'mock-key',
    baseURL: config.baseUrl || process.env.OPENAI_BASE_URL,
  });

  return openai(config.model);
}
