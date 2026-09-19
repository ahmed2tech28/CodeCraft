import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs-extra';
import path from 'node:path';
import { AgentContext } from '../types.js';
import { containerManager } from '@codecraft/sandbox';

/**
 * Reads a file either from the host workspace path or via docker exec from /workspace
 * inside the sandbox container. When containerId is present, reads through container
 * to always get the live in-container version.
 */
export function createReadFileTool(context: AgentContext) {
  return tool({
    description: 'Reads the complete content of a file in the project workspace.',
    parameters: z.object({
      path: z.string().describe('Relative path to the file to read (e.g. "src/App.tsx")'),
    }),
    execute: async ({ path: relPath }) => {
      const normalized = path.normalize(relPath);
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        return { error: `Security violation: ${relPath} is outside workspace.` };
      }

      if (context.containerId) {
        // Read from container via exec — ensures we see the true in-container state
        const containerPath = `/workspace/${normalized}`;
        const result = await containerManager.execCommand(
          context.containerId,
          `cat "${containerPath}"`,
          { workingDir: '/workspace' }
        );

        if (result.exitCode !== 0) {
          return { error: `File not found or unreadable: ${relPath}. ${result.stderr}` };
        }

        return { path: relPath, content: result.stdout };
      } else {
        // Fallback: read directly from host workspace
        const targetPath = path.resolve(context.workspacePath, normalized);
        if (!targetPath.startsWith(context.workspacePath)) {
          return { error: `Security violation: ${relPath} is outside workspace.` };
        }
        if (!(await fs.pathExists(targetPath))) {
          return { error: `File not found: ${relPath}` };
        }
        const stat = await fs.stat(targetPath);
        if (stat.isDirectory()) {
          return { error: `Path is a directory, not a file: ${relPath}` };
        }
        const content = await fs.readFile(targetPath, 'utf-8');
        return { path: relPath, content };
      }
    },
  });
}
