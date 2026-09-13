import { tool } from 'ai';
import { z } from 'zod';
import { AgentContext } from '../types.js';
import { containerManager } from '@codecraft/sandbox';

export function createRunCommandTool(context: AgentContext) {
  return tool({
    description:
      'Executes a shell command inside the isolated project Docker sandbox container (e.g. "pnpm add lucide-react", "pnpm check", "pnpm build").',
    parameters: z.object({
      command: z.string().describe('The bash command to execute in the container workspace'),
      timeoutMs: z.number().optional().describe('Timeout in milliseconds (defaults to 180000ms)'),
    }),
    execute: async ({ command, timeoutMs }) => {
      if (!context.containerId) {
        return {
          error:
            'No active Docker container found for this project run. File operations are still active.',
          stdout: '',
          stderr: '',
          exitCode: 1,
        };
      }

      context.emitEvent({
        type: 'tool_call',
        toolName: 'run_command',
        toolInput: { command },
        timestamp: new Date().toISOString(),
      });

      const result = await containerManager.execCommand(context.containerId, command, {
        timeoutMs: timeoutMs || 180000,
        onStdout: (chunk) => {
          context.emitEvent({
            type: 'status',
            text: chunk,
            timestamp: new Date().toISOString(),
          });
        },
        onStderr: (chunk) => {
          context.emitEvent({
            type: 'status',
            text: chunk,
            timestamp: new Date().toISOString(),
          });
        },
      });

      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs,
        timedOut: result.timedOut,
      };
    },
  });
}
