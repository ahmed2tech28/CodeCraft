import { simpleGit, SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'node:path';

export interface CheckpointInfo {
  hash: string;
  date: string;
  message: string;
  author: string;
}

export class GitService {
  private getGit(workspacePath: string): SimpleGit {
    return simpleGit({ baseDir: workspacePath });
  }

  /**
   * Initializes a local Git repository for a project workspace.
   */
  async initRepository(workspacePath: string): Promise<void> {
    const gitDir = path.join(workspacePath, '.git');
    if (await fs.pathExists(gitDir)) return;

    const git = this.getGit(workspacePath);
    await git.init();

    // Ensure .gitignore exists
    const gitignorePath = path.join(workspacePath, '.gitignore');
    if (!(await fs.pathExists(gitignorePath))) {
      await fs.writeFile(
        gitignorePath,
        `node_modules\n.next\ndist\nbuild\n.turbo\n.cache\n*.log\n`
      );
    }

    // Configure local committer info
    await git.addConfig('user.name', 'CodeCraft AI Agent');
    await git.addConfig('user.email', 'agent@codecraft.local');

    // Create initial commit
    await git.add('.');
    await git.commit('Initial Project Template Checkpoint');
  }

  /**
   * Creates a new Git commit checkpoint after an agent modification run.
   */
  async createCheckpoint(workspacePath: string, message: string): Promise<string | null> {
    const git = this.getGit(workspacePath);
    const status = await git.status();

    if (status.isClean()) {
      return null;
    }

    await git.add('.');
    const commitSummary = await git.commit(`[Checkpoint] ${message.slice(0, 72)}`);
    return commitSummary.commit;
  }

  /**
   * Returns list of recent commit checkpoints.
   */
  async getCheckpoints(workspacePath: string, maxCount = 30): Promise<CheckpointInfo[]> {
    const git = this.getGit(workspacePath);
    try {
      const log = await git.log({ maxCount });
      return log.all.map((entry) => ({
        hash: entry.hash,
        date: entry.date,
        message: entry.message,
        author: entry.author_name,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Returns visual patch diff for a specific commit.
   */
  async getDiff(workspacePath: string, commitHash: string): Promise<string> {
    const git = this.getGit(workspacePath);
    try {
      const diff = await git.show([commitHash, '--stat', '--patch']);
      return diff;
    } catch (err: unknown) {
      return `Error generating diff: ${(err as Error).message}`;
    }
  }

  /**
   * Rolls back project workspace to a specific Git commit hash.
   */
  async rollbackToCheckpoint(workspacePath: string, commitHash: string): Promise<void> {
    const git = this.getGit(workspacePath);
    await git.reset(['--hard', commitHash]);
    await git.clean('f', ['-d']);
  }
}

export const gitService = new GitService();
