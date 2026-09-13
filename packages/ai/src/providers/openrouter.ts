import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1 } from 'ai';
import { ResolvedModelConfig } from '../types.js';

export function createOpenRouterModel(config: ResolvedModelConfig): LanguageModelV1 {
  const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || 'mock-key';

  const openrouter = createOpenAI({
    apiKey,
    baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': 'https://github.com/codecraft-ai/codecraft',
      'X-Title': 'CodeCraft AI App Builder',
    },
  });

  return openrouter(config.model);
}
