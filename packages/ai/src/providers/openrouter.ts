import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1 } from 'ai';
import { ResolvedModelConfig } from '../types.js';

export function createOpenRouterModel(config: ResolvedModelConfig): LanguageModelV1 {
  const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || '';

  if (!apiKey || apiKey === 'mock-key') {
    if (process.env.NODE_ENV !== 'test' && !config.apiKey && !process.env.OPENROUTER_API_KEY) {
      throw new Error(
        'Missing OpenRouter API Key. Please provide a valid OpenRouter API key (sk-or-v1-...) in Settings, Onboarding, or the OPENROUTER_API_KEY environment variable. (Note: Free models on OpenRouter still require a free account API key).'
      );
    }
  }

  const openrouter = createOpenAI({
    apiKey: apiKey || 'mock-key',
    baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': 'https://github.com/codecraft-ai/codecraft',
      'X-Title': 'CodeCraft AI App Builder',
    },
  });

  return openrouter(config.model);
}
