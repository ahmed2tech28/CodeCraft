import { tool } from 'ai';
import { z } from 'zod';
import { AgentContext } from '../types.js';
import { containerManager } from '@codecraft/sandbox';
import fs from 'fs-extra';
import path from 'node:path';
import { IGNORED_DIRECTORIES } from '@codecraft/shared';

/**
 * Lists files in the project workspace either via docker exec (when container is running)
 * or directly from host filesystem.
 */
export function createListFilesTool(context: AgentContext) {
  return tool({
    description: 'Lists all files and directories in the project workspace.',
    parameters: z.object({
      subDirectory: z
        .string()
        .optional()
        .describe('Optional sub-directory to list relative to project root.'),
    }),
    execute: async ({ subDirectory }) => {
      if (context.containerId) {
        // List files inside the container via find command — respects IGNORED_DIRECTORIES
        const targetDir = subDirectory ? `/workspace/${path.normalize(subDirectory)}` : '/workspace';
        const ignoredPattern = IGNORED_DIRECTORIES.map((d) => `-name "${d}"`).join(' -o ');

        const result = await containerManager.execCommand(
          context.containerId,
          `find "${targetDir}" \\( ${ignoredPattern} \\) -prune -o -print 2>/dev/null | sed 's|^/workspace/||' | sort`,
          { workingDir: '/workspace' }
        );

        if (result.exitCode !== 0) {
          return { files: [] };
        }

        const files = result.stdout
          .split('\n')
          .map((f) => f.trim())
          .filter((f) => f.length > 0 && f !== '.');

        return { files };
      } else {
        // Fallback: scan host filesystem directly
        const targetDir = subDirectory
          ? path.resolve(context.workspacePath, subDirectory)
          : context.workspacePath;

        if (!targetDir.startsWith(context.workspacePath)) {
          return { error: 'Access denied: cannot browse outside project directory' };
        }

        if (!(await fs.pathExists(targetDir))) {
          return { files: [] };
        }

        async function scan(dir: string, baseDir: string): Promise<string[]> {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          const results: string[] = [];

          for (const entry of entries) {
            if (IGNORED_DIRECTORIES.includes(entry.name)) continue;

            const fullPath = path.join(dir, entry.name);
            const relPath = path.relative(baseDir, fullPath);

            if (entry.isDirectory()) {
              results.push(`${relPath}/`);
              const subResults = await scan(fullPath, baseDir);
              results.push(...subResults);
            } else {
              results.push(relPath);
            }
          }
          return results;
        }

        const files = await scan(targetDir, context.workspacePath);
        return { files };
      }
    },
  });
}
