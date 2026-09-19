import Docker from 'dockerode';
import { getDockerClient } from './docker-client.js';
import {
  CreateContainerOptions,
  ExecCommandOptions,
  ExecResult,
  ContainerInfo,
} from './types.js';
import { SANDBOX_DEFAULTS } from '@codecraft/shared';

export class ContainerManager {
  private docker: Docker;

  constructor(dockerClient?: Docker) {
    this.docker = dockerClient || getDockerClient();
  }

  /**
   * Spawns an isolated runner container for a specific project workspace.
   */
  async createRunnerContainer(options: CreateContainerOptions): Promise<ContainerInfo> {
    const timestamp = Date.now();
    const containerName = `codecraft-runner-${options.projectId.slice(0, 8)}-${timestamp}`;
    const imageName =
      options.imageName ||
      process.env.SANDBOX_DOCKER_IMAGE ||
      process.env.RUNNER_DOCKER_IMAGE ||
      'codecraft-sandbox:latest';

    const memoryBytes =
      options.limits?.memoryBytes || SANDBOX_DEFAULTS.MEMORY_LIMIT;
    const nanoCpus =
      options.limits?.nanoCpus || SANDBOX_DEFAULTS.CPU_LIMIT;
    const pidsLimit =
      options.limits?.pidsLimit || SANDBOX_DEFAULTS.PIDS_LIMIT;

    const envArray: string[] = ['NODE_ENV=development', 'CI=true'];
    if (options.env) {
      for (const [k, v] of Object.entries(options.env)) {
        envArray.push(`${k}=${v}`);
      }
    }

    const container = (await this.docker.createContainer({
      Image: imageName,
      name: containerName,
      WorkingDir: '/workspace',
      Cmd: ['sleep', 'infinity'],
      Env: envArray,
      Labels: {
        'codecraft.project.id': options.projectId,
        'codecraft.container.type': 'runner',
      },
      HostConfig: {
        Binds: [`${options.workspaceHostPath}:/workspace`],
        Memory: memoryBytes,
        NanoCpus: nanoCpus,
        PidsLimit: pidsLimit,
        AutoRemove: false,
        NetworkMode: options.networkName || 'bridge',
      },
    })) as Docker.Container;

    await container.start();

    return {
      id: container.id,
      name: containerName,
      projectId: options.projectId,
      type: 'runner',
      status: 'running',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Executes a bash command inside a running Docker container with timeout and output capture.
   */
  async execCommand(
    containerId: string,
    command: string,
    options: ExecCommandOptions = {}
  ): Promise<ExecResult> {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || SANDBOX_DEFAULTS.EXEC_TIMEOUT_MS;
    const container = this.docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: ['bash', '-c', command],
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: options.workingDir || '/workspace',
      Env: options.env
        ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`)
        : undefined,
    });

    return new Promise<ExecResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const timeoutTimer = setTimeout(async () => {
        isTimedOut = true;
        try {
          // Attempt to kill container process on timeout
          await container.kill({ signal: 'SIGKILL' }).catch(() => {});
        } catch {
          // ignore
        }
        resolve({
          exitCode: 124, // Standard Linux timeout exit code
          stdout,
          stderr: stderr + `\n[Command timed out after ${timeoutMs}ms]`,
          durationMs: Date.now() - startTime,
          timedOut: true,
        });
      }, timeoutMs);

      exec.start({ hijack: true, stdin: false }, (err, stream) => {
        if (err || !stream) {
          clearTimeout(timeoutTimer);
          return resolve({
            exitCode: 1,
            stdout: '',
            stderr: err?.message || 'Failed to start container exec stream',
            durationMs: Date.now() - startTime,
            timedOut: false,
          });
        }

        // Demux Docker stream into stdout and stderr
        this.docker.modem.demuxStream(
          stream,
          {
            write: (chunk: Buffer) => {
              const str = chunk.toString('utf-8');
              stdout += str;
              options.onStdout?.(str);
            },
          } as unknown as NodeJS.WritableStream,
          {
            write: (chunk: Buffer) => {
              const str = chunk.toString('utf-8');
              stderr += str;
              options.onStderr?.(str);
            },
          } as unknown as NodeJS.WritableStream
        );

        stream.on('end', async () => {
          if (isTimedOut) return;
          clearTimeout(timeoutTimer);

          try {
            const inspectResult = await exec.inspect();
            resolve({
              exitCode: inspectResult.ExitCode ?? 0,
              stdout,
              stderr,
              durationMs: Date.now() - startTime,
              timedOut: false,
            });
          } catch {
            resolve({
              exitCode: 0,
              stdout,
              stderr,
              durationMs: Date.now() - startTime,
              timedOut: false,
            });
          }
        });

        stream.on('error', (streamErr) => {
          if (isTimedOut) return;
          clearTimeout(timeoutTimer);
          resolve({
            exitCode: 1,
            stdout,
            stderr: stderr + `\n${streamErr.message}`,
            durationMs: Date.now() - startTime,
            timedOut: false,
          });
        });
      });
    });
  }

  /**
   * Gracefully stops and removes a container.
   */
  async stopAndRemoveContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: 2 }).catch(() => {});
      await container.remove({ force: true }).catch(() => {});
    } catch {
      // Container already removed or nonexistent
    }
  }

  /**
   * Lists all containers associated with a given project.
   */
  async listProjectContainers(projectId: string): Promise<ContainerInfo[]> {
    const containers = await this.docker.listContainers({
      all: true,
      filters: {
        label: [`codecraft.project.id=${projectId}`],
      },
    });

    return containers.map((c) => ({
      id: c.Id,
      name: c.Names[0]?.replace(/^\//, '') || c.Id,
      projectId,
      type: (c.Labels['codecraft.container.type'] as 'runner' | 'preview') || 'runner',
      status: c.State === 'running' ? 'running' : 'stopped',
      createdAt: new Date(c.Created * 1000).toISOString(),
    }));
  }
}

export const containerManager = new ContainerManager();
