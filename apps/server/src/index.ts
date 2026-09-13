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

dotenv.config();

// Ensure SQLite migrations are up to date on server start
runMigrations();

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
