import { generateText } from 'ai';
import { getLanguageModel } from './provider-factory.js';
import { ConnectionTestResult, ResolvedModelConfig } from './types.js';

export async function testProviderConnection(
  config?: Partial<ResolvedModelConfig>
): Promise<ConnectionTestResult> {
  const startTime = Date.now();

  try {
    const { model, config: resolvedConfig } = getLanguageModel(config);

    const response = await generateText({
      model,
      prompt: 'Respond with only the single word: "READY"',
      maxTokens: 10,
    });

    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      provider: resolvedConfig.provider,
      model: resolvedConfig.model,
      latencyMs,
      message: response.text.trim(),
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    return {
      success: false,
      provider: config?.provider || 'unknown',
      model: config?.model || 'unknown',
      latencyMs,
      error: errorMessage,
    };
  }
}
