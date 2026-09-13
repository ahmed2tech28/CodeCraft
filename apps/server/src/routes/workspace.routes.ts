import { FastifyInstance } from 'fastify';
import { workspaceService } from '../services/workspace.service.js';
import { readFileQuerySchema, writeFileSchema } from '@codecraft/shared';

export async function workspaceRoutes(server: FastifyInstance) {
  // Get file tree
  server.get('/api/projects/:id/files', async (req) => {
    const { id } = req.params as { id: string };
    const files = await workspaceService.getFileTree(id);
    return { files };
  });

  // Read file content
  server.get('/api/projects/:id/file', async (req, reply) => {
    const { id } = req.params as { id: string };
    const query = readFileQuerySchema.parse(req.query);

    try {
      const content = await workspaceService.readFile(id, query.path);
      return { path: query.path, content };
    } catch (err: unknown) {
      return reply.status(404).send({ error: (err as Error).message });
    }
  });

  // Write file content
  server.put('/api/projects/:id/file', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = writeFileSchema.parse(req.body);

    try {
      await workspaceService.writeFile(id, body.path, body.content);
      return { success: true, path: body.path };
    } catch (err: unknown) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  // Delete file
  server.delete('/api/projects/:id/file', async (req, reply) => {
    const { id } = req.params as { id: string };
    const query = readFileQuerySchema.parse(req.query);

    try {
      await workspaceService.deleteFile(id, query.path);
      return { success: true };
    } catch (err: unknown) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });
}
