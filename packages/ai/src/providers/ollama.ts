import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1 } from 'ai';
import { ResolvedModelConfig } from '../types.js';

export function createOllamaModel(config: ResolvedModelConfig): LanguageModelV1 {
  const baseURL = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';

  const ollama = createOpenAI({
    apiKey: config.apiKey || 'ollama', // Ollama doesn't require a real key
    baseURL,
  });

  return ollama(config.model);
}
