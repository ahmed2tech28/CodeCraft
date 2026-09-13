import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs-extra';
import path from 'node:path';
import { AgentContext } from '../types.js';

export function createWriteFileTool(context: AgentContext) {
  return tool({
    description: 'Creates a new file or completely overwrites an existing file with the provided code content.',
    parameters: z.object({
      path: z.string().describe('Relative path to the file to create or write (e.g. "src/components/Navbar.tsx")'),
      content: z.string().describe('The complete code/text content to write to the file'),
    }),
    execute: async ({ path: relPath, content }) => {
      const targetPath = path.resolve(context.workspacePath, relPath);

      if (!targetPath.startsWith(context.workspacePath)) {
        return { error: `Security violation: ${relPath} is outside workspace.` };
      }

      await fs.ensureDir(path.dirname(targetPath));
      await fs.writeFile(targetPath, content, 'utf-8');

      context.emitEvent({
        type: 'file_change',
        filePath: relPath,
        text: `Updated ${relPath}`,
        timestamp: new Date().toISOString(),
      });

      return { success: true, path: relPath, sizeBytes: Buffer.byteLength(content, 'utf-8') };
    },
  });
}
