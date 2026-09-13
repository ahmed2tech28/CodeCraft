import { FastifyInstance } from 'fastify';
import { gitService } from '../services/git.service.js';
import { workspaceService } from '../services/workspace.service.js';

export async function checkpointsRoutes(server: FastifyInstance) {
  // Get all checkpoints
  server.get('/api/projects/:id/checkpoints', async (req) => {
    const { id } = req.params as { id: string };
    const workspacePath = workspaceService.getWorkspacePath(id);
    const checkpoints = await gitService.getCheckpoints(workspacePath);
    return { checkpoints };
  });

  // Get diff for a checkpoint
  server.get('/api/projects/:id/checkpoints/:hash/diff', async (req) => {
    const { id, hash } = req.params as { id: string; hash: string };
    const workspacePath = workspaceService.getWorkspacePath(id);
    const diff = await gitService.getDiff(workspacePath, hash);
    return { diff };
  });

  // Rollback to checkpoint
  server.post('/api/projects/:id/checkpoints/rollback', async (req) => {
    const { id } = req.params as { id: string };
    const { hash } = req.body as { hash: string };
    const workspacePath = workspaceService.getWorkspacePath(id);

    await gitService.rollbackToCheckpoint(workspacePath, hash);

    return {
      success: true,
      restoredHash: hash,
    };
  });
}
