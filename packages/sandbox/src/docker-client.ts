import Docker from 'dockerode';
import fs from 'node:fs';

let _dockerInstance: Docker | null = null;

export function getDockerClient(): Docker {
  if (_dockerInstance) return _dockerInstance;

  const socketPath =
    process.env.DOCKER_SOCKET_PATH ||
    (process.platform === 'win32'
      ? '//./pipe/docker_engine'
      : '/var/run/docker.sock');

  if (process.env.DOCKER_HOST) {
    _dockerInstance = new Docker();
  } else if (fs.existsSync(socketPath) || process.platform === 'win32') {
    _dockerInstance = new Docker({ socketPath });
  } else {
    // Fallback to default Docker constructor
    _dockerInstance = new Docker();
  }

  return _dockerInstance;
}

export async function isDockerAvailable(): Promise<boolean> {
  try {
    const docker = getDockerClient();
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}
