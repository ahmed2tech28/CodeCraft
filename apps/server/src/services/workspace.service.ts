import fs from 'fs-extra';
import path from 'node:path';
import { FileNode, IGNORED_DIRECTORIES } from '@codecraft/shared';
import { templateService } from './template.service.js';

function findMonorepoRoot(startDir: string = process.cwd()): string {
  let curr = startDir;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'pnpm-workspace.yaml'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return startDir;
}

export class WorkspaceService {
  private dataProjectsRoot: string;

  constructor(dataProjectsRoot?: string) {
    if (dataProjectsRoot) {
      this.dataProjectsRoot = dataProjectsRoot;
    } else if (process.env.DATA_PROJECTS_ROOT) {
      this.dataProjectsRoot = path.resolve(process.env.DATA_PROJECTS_ROOT);
    } else {
      const root = findMonorepoRoot();
      this.dataProjectsRoot = path.resolve(root, 'data/projects');
    }
  }

  getWorkspacePath(projectId: string): string {
    return path.resolve(this.dataProjectsRoot, projectId);
  }

  /**
   * Resolves a file path strictly within the project workspace to prevent directory traversal attacks.
   */
  resolveSafePath(projectId: string, relativePath: string): string {
    const projectRoot = this.getWorkspacePath(projectId);
    // Normalize and resolve absolute target path
    const resolvedPath = path.resolve(projectRoot, relativePath);

    // Verify target path begins with projectRoot
    if (!resolvedPath.startsWith(projectRoot)) {
      throw new Error(`Path traversal security violation: ${relativePath} is outside project workspace.`);
    }

    return resolvedPath;
  }

  async initProjectWorkspace(
    projectId: string,
    templateName: string = 'nextjs'
  ): Promise<string> {
    const projectPath = this.getWorkspacePath(projectId);
    await fs.ensureDir(projectPath);

    if (templateName !== 'blank') {
      await templateService.copyTemplateToWorkspace(projectPath, templateName);
    }

    return projectPath;
  }

  async getFileTree(projectId: string, subDir = ''): Promise<FileNode[]> {
    const rootPath = this.getWorkspacePath(projectId);
    const targetDir = this.resolveSafePath(projectId, subDir);

    if (!(await fs.pathExists(targetDir))) {
      return [];
    }

    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (IGNORED_DIRECTORIES.includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(targetDir, entry.name);
      const relativePath = path.relative(rootPath, fullPath);

      if (entry.isDirectory()) {
        const children = await this.getFileTree(projectId, relativePath);
        nodes.push({
          name: entry.name,
          path: relativePath,
          isDirectory: true,
          children,
        });
      } else {
        const stats = await fs.stat(fullPath);
        nodes.push({
          name: entry.name,
          path: relativePath,
          isDirectory: false,
          sizeBytes: stats.size,
        });
      }
    }

    // Sort: directories first, then alphabetically
    return nodes.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });
  }

  async readFile(projectId: string, relativePath: string): Promise<string> {
    const safePath = this.resolveSafePath(projectId, relativePath);

    if (!(await fs.pathExists(safePath))) {
      throw new Error(`File not found: ${relativePath}`);
    }

    const stat = await fs.stat(safePath);
    if (stat.isDirectory()) {
      throw new Error(`Cannot read directory as file: ${relativePath}`);
    }

    return fs.readFile(safePath, 'utf-8');
  }

  async writeFile(projectId: string, relativePath: string, content: string): Promise<void> {
    const safePath = this.resolveSafePath(projectId, relativePath);
    await fs.ensureDir(path.dirname(safePath));
    await fs.writeFile(safePath, content, 'utf-8');
  }

  async deleteFile(projectId: string, relativePath: string): Promise<void> {
    const safePath = this.resolveSafePath(projectId, relativePath);
    if (await fs.pathExists(safePath)) {
      await fs.remove(safePath);
    }
  }

  async fileExists(projectId: string, relativePath: string): Promise<boolean> {
    try {
      const safePath = this.resolveSafePath(projectId, relativePath);
      return await fs.pathExists(safePath);
    } catch {
      return false;
    }
  }
}

export const workspaceService = new WorkspaceService();
