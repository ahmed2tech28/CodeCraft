import { FastifyInstance } from 'fastify';
import { projectRepository, userRepository, getDb, users } from '@codecraft/db';
import { workspaceService } from '../services/workspace.service.js';
import { previewManager } from '../services/preview-manager.js';
import { gitService } from '../services/git.service.js';
import { createProjectSchema } from '@codecraft/shared';

export async function projectsRoutes(server: FastifyInstance) {
  // List all projects
  server.get('/api/projects', async () => {
    const projects = await projectRepository.listProjects();
    return { projects };
  });

  // Create project
  server.post('/api/projects', async (req, reply) => {
    const body = createProjectSchema.parse(req.body);

    let userId = req.headers['x-user-id'] as string;
    if (!userId) {
      const db = getDb();
      const firstUser = db.select().from(users).limit(1).get();
      if (firstUser) {
        userId = firstUser.id;
      } else {
        const superUser = await userRepository.createSuperUser({
          name: 'Super Admin',
          email: 'admin@codecraft.local',
          password: 'Password123!',
        });
        userId = superUser.id;
      }
    }

    const project = await projectRepository.createProject({
      userId,
      name: body.name,
      path: workspaceService.getWorkspacePath('placeholder'),
    });

    // Update actual path with generated project ID
    const projectPath = await workspaceService.initProjectWorkspace(
      project.id,
      body.template || 'nextjs'
    );

    // Initialize local Git repo & initial commit checkpoint
    await gitService.initRepository(projectPath);

    return reply.status(201).send({
      project: {
        ...project,
        path: projectPath,
      },
    });
  });

  // Get project by ID
  server.get('/api/projects/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = await projectRepository.getProjectById(id);

    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const preview = previewManager.getPreviewStatus(id);

    return {
      project,
      preview,
    };
  });

  // Delete project
  server.delete('/api/projects/:id', async (req) => {
    const { id } = req.params as { id: string };
    await previewManager.stopPreview(id);
    await projectRepository.deleteProject(id);
    await workspaceService.deleteFile(id, ''); // Deletes workspace directory
    return { success: true };
  });

  // Start preview container for project
  server.post('/api/projects/:id/preview/start', async (req) => {
    const { id } = req.params as { id: string };
    const workspaceHostPath = workspaceService.getWorkspaceHostPath(id);
    const previewStatus = await previewManager.startPreview(id, workspaceHostPath);
    await projectRepository.updateProjectStatus(id, 'running', previewStatus.previewUrl);
    return { preview: previewStatus };
  });

  // Stop preview container
  server.post('/api/projects/:id/preview/stop', async (req) => {
    const { id } = req.params as { id: string };
    await previewManager.stopPreview(id);
    await projectRepository.updateProjectStatus(id, 'stopped', null);
    return { success: true };
  });
}
