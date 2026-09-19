import { tool } from 'ai';
import { z } from 'zod';
import fs from 'fs-extra';
import path from 'node:path';
import { AgentContext } from '../types.js';
import { containerManager } from '@codecraft/sandbox';

/**
 * Writes a file either directly on the host workspace path or via docker exec into
 * the sandbox container at /workspace. When containerId is present, the write
 * goes through the container — the volume mount automatically syncs it back to host.
 */
export function createWriteFileTool(context: AgentContext) {
  return tool({
    description: 'Creates a new file or completely overwrites an existing file with the provided code content.',
    parameters: z.object({
      path: z.string().describe('Relative path to the file to create or write (e.g. "src/components/Navbar.tsx")'),
      content: z.string().describe('The complete code/text content to write to the file'),
    }),
    execute: async ({ path: relPath, content }) => {
      // Security: prevent path traversal
      const normalized = path.normalize(relPath);
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        return { error: `Security violation: ${relPath} is outside workspace.` };
      }

      if (context.containerId) {
        // Write inside the Docker container via exec — synced back to host via volume
        const containerPath = `/workspace/${normalized}`;
        const dir = path.dirname(containerPath);

        // Escape content for safe shell injection using base64 to avoid quote issues
        const base64Content = Buffer.from(content, 'utf-8').toString('base64');
        const mkdirResult = await containerManager.execCommand(
          context.containerId,
          `mkdir -p "${dir}"`,
          { workingDir: '/workspace' }
        );

        if (mkdirResult.exitCode !== 0) {
          return { error: `Failed to create directory: ${mkdirResult.stderr}` };
        }

        const writeResult = await containerManager.execCommand(
          context.containerId,
          `echo "${base64Content}" | base64 -d > "${containerPath}"`,
          { workingDir: '/workspace' }
        );

        if (writeResult.exitCode !== 0) {
          return { error: `Failed to write file: ${writeResult.stderr}` };
        }
      } else {
        // Fallback: write directly to host workspace (no container running)
        const targetPath = path.resolve(context.workspacePath, normalized);
        if (!targetPath.startsWith(context.workspacePath)) {
          return { error: `Security violation: ${relPath} is outside workspace.` };
        }
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, content, 'utf-8');
      }

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
