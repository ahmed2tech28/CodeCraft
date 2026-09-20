/**
 * Docker Host Path Resolver
 *
 * When running inside a Docker container, the Docker socket gives us access to the
 * host Docker daemon. But bind-mount paths passed when spawning child containers
 * (e.g. preview/runner containers) must be HOST paths — not container-internal paths.
 *
 * This module auto-detects the host-side path for the /app/data directory by
 * inspecting our own container's mount table via the Docker API.
 * No user configuration needed.
 */

import { getDockerClient } from '@codecraft/sandbox';

let _hostDataPath: string | undefined;

/**
 * Returns the host machine path that maps to /app/data inside this container.
 * On first call it inspects the container; subsequent calls use the cached value.
 *
 * Priority:
 *  1. process.env.HOST_DATA_DIR (if set and not the container-internal /app/data)
 *  2. Auto-detected from container mount table via Docker socket (codecraft-app, HOSTNAME, or container search)
 *  3. Fallback: /app/data (local dev without Docker)
 */
export async function resolveHostDataPath(): Promise<string> {
  if (_hostDataPath !== undefined) return _hostDataPath;

  // 1. Explicit environment variable override (ignore if it's set to internal /app/data)
  if (process.env.HOST_DATA_DIR && process.env.HOST_DATA_DIR !== '/app/data') {
    _hostDataPath = process.env.HOST_DATA_DIR;
    console.log(`[workspace] Using HOST_DATA_DIR env: ${_hostDataPath}`);
    return _hostDataPath;
  }

  // 2. Try auto-detect by inspecting this container's own mounts via Docker socket
  try {
    const docker = getDockerClient();
    const candidateIds = [
      'codecraft-app',
      process.env.HOSTNAME,
      process.env.CONTAINER_NAME,
    ].filter(Boolean) as string[];

    for (const id of candidateIds) {
      try {
        const container = docker.getContainer(id);
        const info = (await container.inspect()) as {
          Mounts?: { Destination: string; Source: string }[];
        };
        const dataMount = (info.Mounts ?? []).find(
          (m) => m.Destination === '/app/data' || m.Destination.endsWith('/data')
        );

        if (dataMount?.Source) {
          console.log(`[workspace] Auto-detected host data path from container "${id}": ${dataMount.Source}`);
          _hostDataPath = dataMount.Source;
          return _hostDataPath;
        }
      } catch {
        // Try next candidate
      }
    }

    // 3. Fallback search: list running containers and inspect ones matching codecraft
    const containers = await docker.listContainers();
    for (const c of containers) {
      if (c.Names?.some((n) => n.includes('codecraft-app') || n.includes('codecraft'))) {
        try {
          const info = (await docker.getContainer(c.Id).inspect()) as {
            Mounts?: { Destination: string; Source: string }[];
          };
          const dataMount = (info.Mounts ?? []).find(
            (m) => m.Destination === '/app/data' || m.Destination.endsWith('/data')
          );
          if (dataMount?.Source) {
            console.log(`[workspace] Auto-detected host data path from listed container "${c.Id}": ${dataMount.Source}`);
            _hostDataPath = dataMount.Source;
            return _hostDataPath;
          }
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn('[workspace] Docker mount inspection failed:', (err as Error).message);
  }

  // 4. Final fallback (local dev without Docker)
  _hostDataPath = '/app/data';
  console.log(`[workspace] Using fallback host data path: ${_hostDataPath}`);
  return _hostDataPath;
}

/**
 * Converts a container-internal /app/data/... path to its host-side equivalent.
 * e.g. /app/data/projects/abc → /Users/me/project/data/projects/abc
 */
export async function toHostPath(containerPath: string): Promise<string> {
  const hostDataPath = await resolveHostDataPath();
  const relative = containerPath.replace(/^\/app\/data\/?/, '');
  return relative ? `${hostDataPath}/${relative}` : hostDataPath;
}
