import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs-extra';
import path from 'node:path';
import { AgentContext } from '../types.js';
import { containerManager } from '@codecraft/sandbox';

/**
 * Edits a specific code snippet within a file, either via docker exec (when container running)
 * or directly on the host filesystem.
 */
export function createEditFileTool(context: AgentContext) {
  return tool({
    description: 'Replaces a specific target code snippet within a file with new replacement code.',
    parameters: z.object({
      path: z.string().describe('Relative path to the file to edit'),
      targetSnippet: z.string().describe('Exact code snippet to find and replace'),
      replacementSnippet: z.string().describe('New code snippet to replace the target with'),
    }),
    execute: async ({ path: relPath, targetSnippet, replacementSnippet }) => {
      const normalized = path.normalize(relPath);
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        return { error: `Security violation: ${relPath} is outside workspace.` };
      }

      if (context.containerId) {
        // Read the current file content from container
        const containerPath = `/workspace/${normalized}`;
        const readResult = await containerManager.execCommand(
          context.containerId,
          `cat "${containerPath}"`,
          { workingDir: '/workspace' }
        );

        if (readResult.exitCode !== 0) {
          return { error: `File not found: ${relPath}. ${readResult.stderr}` };
        }

        const original = readResult.stdout;

        if (!original.includes(targetSnippet)) {
          return {
            error: `Target snippet was not found in ${relPath}. Please use read_file to check exact lines before editing, or use write_file to overwrite the whole file.`,
          };
        }

        const updated = original.replace(targetSnippet, replacementSnippet);

        // Write the updated file back via base64 to handle special characters safely
        const base64Content = Buffer.from(updated, 'utf-8').toString('base64');
        const writeResult = await containerManager.execCommand(
          context.containerId,
          `echo "${base64Content}" | base64 -d > "${containerPath}"`,
          { workingDir: '/workspace' }
        );

        if (writeResult.exitCode !== 0) {
          return { error: `Failed to write updated file: ${writeResult.stderr}` };
        }
      } else {
        // Fallback: direct host filesystem edit
        const targetPath = path.resolve(context.workspacePath, normalized);
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
      }

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
