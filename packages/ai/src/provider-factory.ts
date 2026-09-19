import { LanguageModelV1 } from 'ai';
import { resolveAndValidateConfig } from './config-validator.js';
import { createOpenAIModel } from './providers/openai.js';
import { createAnthropicModel } from './providers/anthropic.js';
import { createOpenRouterModel } from './providers/openrouter.js';
import { createOllamaModel } from './providers/ollama.js';
import { createGeminiModel } from './providers/gemini.js';
import { ProviderFactoryResult, ResolvedModelConfig } from './types.js';

export function getLanguageModel(customConfig?: Partial<ResolvedModelConfig>): ProviderFactoryResult {
  const config = resolveAndValidateConfig(customConfig);
  let model: LanguageModelV1;

  switch (config.provider) {
    case 'openai':
      model = createOpenAIModel(config);
      break;
    case 'anthropic':
      model = createAnthropicModel(config);
      break;
    case 'openrouter':
      model = createOpenRouterModel(config);
      break;
    case 'ollama':
      model = createOllamaModel(config);
      break;
    case 'gemini':
      model = createGeminiModel(config);
      break;
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  return { model, config };
}
