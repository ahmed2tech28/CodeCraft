import { z } from 'zod';
import { DEFAULT_AI_PROVIDER, DEFAULT_AI_MODEL } from '@codecraft/shared';
import { ResolvedModelConfig } from './types.js';

const aiConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'openrouter', 'ollama']).default('openai'),
  model: z.string().min(1).default(DEFAULT_AI_MODEL),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

export function resolveAndValidateConfig(customConfig?: Partial<ResolvedModelConfig>): ResolvedModelConfig {
  const provider = (
    customConfig?.provider ||
    process.env.AI_PROVIDER ||
    DEFAULT_AI_PROVIDER
  ) as 'openai' | 'anthropic' | 'openrouter' | 'ollama';

  let apiKey = customConfig?.apiKey;
  let baseUrl = customConfig?.baseUrl;
  const model = customConfig?.model || process.env.AI_MODEL || DEFAULT_AI_MODEL;

  // Resolve API key from environment if not provided explicitly
  if (!apiKey) {
    if (provider === 'openai') apiKey = process.env.OPENAI_API_KEY;
    else if (provider === 'anthropic') apiKey = process.env.ANTHROPIC_API_KEY;
    else if (provider === 'openrouter') apiKey = process.env.OPENROUTER_API_KEY;
  }

  // Resolve base URL for local models
  if (!baseUrl && provider === 'ollama') {
    baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
  }

  const parsed = aiConfigSchema.parse({
    provider,
    model,
    apiKey,
    baseUrl,
  });

  return parsed;
}
