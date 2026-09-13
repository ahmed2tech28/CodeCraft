import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs-extra';
import path from 'node:path';
import { AgentContext } from '../types.js';

export function createEditFileTool(context: AgentContext) {
  return tool({
    description: 'Replaces a specific target code snippet within a file with new replacement code.',
    parameters: z.object({
      path: z.string().describe('Relative path to the file to edit'),
      targetSnippet: z.string().describe('Exact code snippet to find and replace'),
      replacementSnippet: z.string().describe('New code snippet to replace the target with'),
    }),
    execute: async ({ path: relPath, targetSnippet, replacementSnippet }) => {
      const targetPath = path.resolve(context.workspacePath, relPath);

      if (!targetPath.startsWith(context.workspacePath)) {
        return { error: `Security violation: ${relPath} is outside workspace.` };
      }

      if (!(await fs.pathExists(targetPath))) {
        return { error: `File not found: ${relPath}` };
      }

      const original = await fs.readFile(targetPath, 'utf-8');

      if (!original.includes(targetSnippet)) {
        return {
          error: `Target snippet was not found in ${relPath}. Please use read_file to check exact lines before editing, or use write_file.`,
        };
      }

      const updated = original.replace(targetSnippet, replacementSnippet);
      await fs.writeFile(targetPath, updated, 'utf-8');

      context.emitEvent({
        type: 'file_change',
        filePath: relPath,
        text: `Edited ${relPath}`,
        timestamp: new Date().toISOString(),
      });

      return { success: true, path: relPath };
    },
  });
}
