import { FastifyInstance } from 'fastify';
import { isDockerAvailable } from '@codecraft/sandbox';
import { testProviderConnection } from '@codecraft/ai';
import { providerRepository, maskApiKey } from '@codecraft/db';

export async function systemRoutes(server: FastifyInstance) {
  // System Health
  const healthHandler = async () => {
    const dockerStatus = await isDockerAvailable();
    return {
      status: 'ok',
      dockerAvailable: dockerStatus,
      timestamp: new Date().toISOString(),
    };
  };

  server.get('/api/health', healthHandler);
  server.get('/health', healthHandler);
  server.get('/api/system/health', healthHandler);

  // Test AI Connection
  server.post('/api/system/test-ai', async (req) => {
    const body = req.body as {
      provider?: 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'gemini';
      model?: string;
      apiKey?: string;
      baseUrl?: string;
    };

    const result = await testProviderConnection(body);
    return result;
  });

  // Get active AI provider config (with API key masked for client security)
  server.get('/api/system/provider-config', async () => {
    const config = await providerRepository.getActiveConfig();
    if (!config) return { config: null };

    const maskedConfig = {
      ...config,
      apiKeyEncrypted: maskApiKey(config.apiKeyEncrypted),
      hasApiKey: Boolean(config.apiKeyEncrypted),
    };
    return { config: maskedConfig };
  });

  // Save / Update AI provider config
  server.post('/api/system/provider-config', async (req) => {
    const body = req.body as {
      provider: 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'gemini';
      model: string;
      apiKey?: string;
      baseUrl?: string;
    };

    const config = await providerRepository.saveConfig(body);
    const maskedConfig = {
      ...config,
      apiKeyEncrypted: maskApiKey(config.apiKeyEncrypted),
      hasApiKey: Boolean(config.apiKeyEncrypted),
    };
    return { success: true, config: maskedConfig };
  });
}
