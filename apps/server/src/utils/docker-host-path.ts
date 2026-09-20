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
 *  1. process.env.HOST_DATA_DIR (explicit override)
 *  2. Auto-detected from container mount table via Docker socket
 *  3. Fallback: /app/data (works for local dev without Docker)
 */
export async function resolveHostDataPath(): Promise<string> {
  if (_hostDataPath !== undefined) return _hostDataPath;

  // 1. Check explicit env override first
  if (process.env.HOST_DATA_DIR) {
    _hostDataPath = process.env.HOST_DATA_DIR;
    return _hostDataPath;
  }

  // 2. Try auto-detect by inspecting this container's own mounts via Docker socket
  const containerId = process.env.HOSTNAME; // Docker sets HOSTNAME = container short ID
  if (containerId) {
    try {
      const docker = getDockerClient();
      const container = docker.getContainer(containerId);
      const info = await container.inspect();

      const dataMount = (
        (info as { Mounts?: { Destination: string; Source: string }[] }).Mounts ?? []
      ).find((m) => m.Destination === '/app/data');

      if (dataMount?.Source) {
        console.log(`[workspace] Auto-detected host data path: ${dataMount.Source}`);
        _hostDataPath = dataMount.Source;
        return _hostDataPath;
      }
    } catch (err) {
      // Docker socket not available or inspect failed — fall through
      console.warn('[workspace] Could not inspect container mounts:', (err as Error).message);
    }
  }

  // 3. Fallback: use the container-internal path (local dev without Docker)
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
