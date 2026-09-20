import { getDockerClient, containerManager } from '@codecraft/sandbox';
import net from 'node:net';

export interface ProjectPreviewStatus {
  projectId: string;
  containerId: string | null;
  status: 'stopped' | 'starting' | 'running' | 'error';
  port: number | null;
  previewUrl: string | null;
}

// Active project preview map
const activePreviews = new Map<string, { containerId: string; port: number }>();

/**
 * Resolves the public host for preview URLs.
 * When running inside Docker, use PUBLIC_HOST env var or host.docker.internal.
 * Default: localhost for local development.
 */
function getPreviewHost(): string {
  return process.env.PUBLIC_HOST || process.env.PREVIEW_HOST || 'localhost';
}

export class PreviewManager {
  /**
   * Finds an available free TCP port on localhost.
   */
  async findFreePort(startPort = 4000): Promise<number> {
    const usedPorts = new Set(Array.from(activePreviews.values()).map((p) => p.port));
    let testPort = startPort;
    while (usedPorts.has(testPort)) {
      testPort++;
    }

    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.unref();
      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(this.findFreePort(testPort + 1));
        } else {
          reject(err);
        }
      });
      server.listen(testPort, () => {
        const port = (server.address() as net.AddressInfo).port;
        server.close(() => resolve(port));
      });
    });
  }

  /**
   * Starts a persistent live preview container for a project workspace.
   * The container mounts the project workspace at /workspace (host-to-container sync via volume).
   * The dev server is started inside the container; changes made by the agent also go through /workspace.
   */
  async startPreview(
    projectId: string,
    workspaceHostPath: string
  ): Promise<ProjectPreviewStatus> {
    const existing = activePreviews.get(projectId);
    if (existing) {
      const previewHost = getPreviewHost();
      return {
        projectId,
        containerId: existing.containerId,
        status: 'running',
        port: existing.port,
        previewUrl: `http://${previewHost}:${existing.port}`,
      };
    }

    const port = await this.findFreePort();
    const docker = getDockerClient();
    const containerName = `codecraft-preview-${projectId.slice(0, 8)}-${Date.now()}`;
    // Use unified sandbox image (supports both runner + preview modes)
    const imageName =
      process.env.SANDBOX_DOCKER_IMAGE ||
      process.env.PREVIEW_DOCKER_IMAGE ||
      'codecraft-sandbox:latest';

    const container = (await docker.createContainer({
      Image: imageName,
      name: containerName,
      WorkingDir: '/workspace',
      // Ensure dependencies are installed and dev server starts bound to 0.0.0.0
      Cmd: ['sh', '-c', 'if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/vite" ]; then pnpm install; fi && pnpm dev'],
      Labels: {
        'codecraft.project.id': projectId,
        'codecraft.container.type': 'preview',
      },
      ExposedPorts: {
        '3000/tcp': {},
      },
      HostConfig: {
        // Mount project workspace so edits from agent/UI are immediately visible in preview
        Binds: [`${workspaceHostPath}:/workspace`],
        PortBindings: {
          '3000/tcp': [{ HostPort: port.toString() }],
        },
        AutoRemove: false,
      },
    })) as { id: string; start: () => Promise<unknown> };

    await container.start();

    activePreviews.set(projectId, {
      containerId: container.id,
      port,
    });

    const previewHost = getPreviewHost();
    return {
      projectId,
      containerId: container.id,
      status: 'running',
      port,
      previewUrl: `http://${previewHost}:${port}`,
    };
  }

  /**
   * Stops and removes a project's preview container.
   */
  async stopPreview(projectId: string): Promise<void> {
    const active = activePreviews.get(projectId);
    if (active) {
      await containerManager.stopAndRemoveContainer(active.containerId);
      activePreviews.delete(projectId);
    }
  }

  /**
   * Gets the current preview status for a project.
   */
  getPreviewStatus(projectId: string): ProjectPreviewStatus {
    const active = activePreviews.get(projectId);
    if (!active) {
      return {
        projectId,
        containerId: null,
        status: 'stopped',
        port: null,
        previewUrl: null,
      };
    }

    const previewHost = getPreviewHost();
    return {
      projectId,
      containerId: active.containerId,
      status: 'running',
      port: active.port,
      previewUrl: `http://${previewHost}:${active.port}`,
    };
  }
}

export const previewManager = new PreviewManager();
