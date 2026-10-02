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
      // Security: prevent path traversal and shell injection
      const normalized = path.normalize(relPath);
      if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        return { error: `Security violation: ${relPath} is outside workspace.` };
      }

      // Strict path validation to prevent shell metacharacter injection
      if (!/^[a-zA-Z0-9_\-\./]+$/.test(normalized)) {
        return { error: `Security violation: ${relPath} contains illegal path characters.` };
      }

      // Safe write: write to host workspace path (synced directly into container via volume mount)
      const targetPath = path.resolve(context.workspacePath, normalized);
      if (!targetPath.startsWith(context.workspacePath)) {
        return { error: `Security violation: ${relPath} is outside workspace.` };
      }

      await fs.ensureDir(path.dirname(targetPath));
      await fs.writeFile(targetPath, content, 'utf-8');

      if (context.containerId) {
        // Optional verification inside container
        const containerPath = `/workspace/${normalized}`;
        const safeDir = path.dirname(containerPath).replace(/'/g, "'\\''");
        const safePath = containerPath.replace(/'/g, "'\\''");
        const base64Content = Buffer.from(content, 'utf-8').toString('base64');
        
        await containerManager.execCommand(
          context.containerId,
          `mkdir -p '${safeDir}' && echo '${base64Content}' | base64 -d > '${safePath}'`,
          { workingDir: '/workspace' }
        );
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
