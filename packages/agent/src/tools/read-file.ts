import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs-extra';
import path from 'node:path';
import { AgentContext } from '../types.js';

export function createReadFileTool(context: AgentContext) {
  return tool({
    description: 'Reads the complete content of a file in the project workspace.',
    parameters: z.object({
      path: z.string().describe('Relative path to the file to read (e.g. "src/App.tsx")'),
    }),
    execute: async ({ path: relPath }) => {
      const targetPath = path.resolve(context.workspacePath, relPath);

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
    },
  });
}
