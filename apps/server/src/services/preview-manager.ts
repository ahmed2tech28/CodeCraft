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

export class PreviewManager {
  /**
   * Finds an available free TCP port on localhost.
   */
  async findFreePort(startPort = 4000): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.unref();
      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(this.findFreePort(startPort + 1));
        } else {
          reject(err);
        }
      });
      server.listen(startPort, () => {
        const port = (server.address() as net.AddressInfo).port;
        server.close(() => resolve(port));
      });
    });
  }

  /**
   * Starts a persistent live preview container for a project workspace.
   */
  async startPreview(
    projectId: string,
    workspaceHostPath: string
  ): Promise<ProjectPreviewStatus> {
    const existing = activePreviews.get(projectId);
    if (existing) {
      return {
        projectId,
        containerId: existing.containerId,
        status: 'running',
        port: existing.port,
        previewUrl: `http://localhost:${existing.port}`,
      };
    }

    const port = await this.findFreePort();
    const docker = getDockerClient();
    const containerName = `codecraft-preview-${projectId.slice(0, 8)}-${Date.now()}`;
    const imageName = process.env.PREVIEW_DOCKER_IMAGE || 'codecraft-runner:latest';

    const container = (await docker.createContainer({
      Image: imageName,
      name: containerName,
      WorkingDir: '/app',
      Cmd: ['pnpm', 'dev', '--host', '0.0.0.0', '--port', '3000'],
      Labels: {
        'codecraft.project.id': projectId,
        'codecraft.container.type': 'preview',
      },
      ExposedPorts: {
        '3000/tcp': {},
      },
      HostConfig: {
        Binds: [`${workspaceHostPath}:/app`],
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

    return {
      projectId,
      containerId: container.id,
      status: 'running',
      port,
      previewUrl: `http://localhost:${port}`,
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

    return {
      projectId,
      containerId: active.containerId,
      status: 'running',
      port: active.port,
      previewUrl: `http://localhost:${active.port}`,
    };
  }
}

export const previewManager = new PreviewManager();
