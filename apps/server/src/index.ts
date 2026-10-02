import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import dotenv from 'dotenv';
import { runMigrations } from '@codecraft/db';
import { authRoutes } from './routes/auth.routes.js';
import { projectsRoutes } from './routes/projects.routes.js';
import { workspaceRoutes } from './routes/workspace.routes.js';
import { agentRoutes } from './routes/agent.routes.js';
import { systemRoutes } from './routes/system.routes.js';
import { checkpointsRoutes } from './routes/checkpoints.routes.js';
import { runStartupChecks } from './utils/startup-check.js';

import { authGuard } from './middleware/auth.middleware.js';

dotenv.config();

// Ensure SQLite migrations are up to date on server start
runMigrations();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

await server.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      cb(null, true);
      return;
    }
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

await server.register(formbody);

// Safely handle empty JSON bodies without throwing FST_ERR_CTP_EMPTY_JSON_BODY
server.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try {
    const str = body as string;
    const json = str && str.trim() ? JSON.parse(str) : {};
    done(null, json);
  } catch (err) {
    done(err as Error, undefined);
  }
});

// Authentication guard middleware hook
server.addHook('onRequest', authGuard);

// Register API Route Modules
await server.register(authRoutes);
await server.register(projectsRoutes);
await server.register(workspaceRoutes);
await server.register(agentRoutes);
await server.register(systemRoutes);
await server.register(checkpointsRoutes);

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

export async function buildServer() {
  return server;
}

const start = async () => {
  try {
    // Run preflight diagnostics
    await runStartupChecks();

    await server.listen({ port: PORT, host: HOST });
    server.log.info(`🚀 CodeCraft API Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Start server if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
