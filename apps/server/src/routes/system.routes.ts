import { FastifyInstance } from 'fastify';
import { isDockerAvailable } from '@codecraft/sandbox';
import { testProviderConnection } from '@codecraft/ai';
import { providerRepository } from '@codecraft/db';

export async function systemRoutes(server: FastifyInstance) {
  // System Health
  server.get('/api/system/health', async () => {
    const dockerStatus = await isDockerAvailable();
    return {
      status: 'ok',
      dockerAvailable: dockerStatus,
      timestamp: new Date().toISOString(),
    };
  });

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

  // Get active AI provider config
  server.get('/api/system/provider-config', async () => {
    const config = await providerRepository.getActiveConfig();
    return { config };
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
    return { success: true, config };
  });
}
