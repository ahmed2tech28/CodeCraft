export interface ResourceLimits {
  memoryBytes?: number; // RAM in bytes (e.g. 1GB = 1073741824)
  nanoCpus?: number; // CPU in nanoCPUs (e.g. 2 cores = 2000000000)
  pidsLimit?: number; // Max processes
}

export interface CreateContainerOptions {
  projectId: string;
  workspaceHostPath: string;
  imageName?: string;
  limits?: ResourceLimits;
  env?: Record<string, string>;
  networkName?: string;
  containerType?: 'runner' | 'preview';
  exposedPort?: number;
}

export interface ExecCommandOptions {
  workingDir?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

export interface ContainerInfo {
  id: string;
  name: string;
  projectId: string;
  type: 'runner' | 'preview';
  status: 'created' | 'running' | 'stopped' | 'error';
  createdAt: string;
  port?: number;
}
