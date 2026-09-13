import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs-extra';
import path from 'node:path';
import { AgentContext } from '../types.js';
import { IGNORED_DIRECTORIES } from '@codecraft/shared';

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
    },
  });
}
