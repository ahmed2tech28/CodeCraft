import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import dotenv from 'dotenv';
import { DEFAULT_AI_PROVIDER, DEFAULT_AI_MODEL } from '@codecraft/shared';

dotenv.config();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

await server.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

await server.register(formbody);

// Health check endpoint
server.get('/api/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    defaultProvider: DEFAULT_AI_PROVIDER,
    defaultModel: DEFAULT_AI_MODEL,
  };
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
