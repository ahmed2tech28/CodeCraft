import { containerManager, ExecResult } from '@codecraft/sandbox';

export class RunnerManager {
  /**
   * Executes a command inside a temporary, isolated Docker runner container and cleans it up immediately upon completion.
   */
  async runInSandbox(
    projectId: string,
    workspaceHostPath: string,
    command: string,
    options: {
      timeoutMs?: number;
      env?: Record<string, string>;
      onStdout?: (chunk: string) => void;
      onStderr?: (chunk: string) => void;
    } = {}
  ): Promise<ExecResult> {
    const container = await containerManager.createRunnerContainer({
      projectId,
      workspaceHostPath,
      containerType: 'runner',
      env: options.env,
    });

    try {
      const result = await containerManager.execCommand(container.id, command, {
        timeoutMs: options.timeoutMs,
        env: options.env,
        onStdout: options.onStdout,
        onStderr: options.onStderr,
      });

      return result;
    } finally {
      // Destroy temporary runner container
      await containerManager.stopAndRemoveContainer(container.id);
    }
  }
}

export const runnerManager = new RunnerManager();
