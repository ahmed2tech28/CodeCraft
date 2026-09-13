import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import { gitService } from '../services/git.service.js';

async function runGitTests() {
  console.log('🧪 Starting Git Checkpointing & Rollback Tests...');
  const tempDir = path.join(os.tmpdir(), `codecraft-git-test-${Date.now()}`);

  try {
    await fs.ensureDir(tempDir);
    await fs.writeFile(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'test-app' }, null, 2));
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Initial Readme');

    // Test 1: Init repo
    await gitService.initRepository(tempDir);
    if (!(await fs.pathExists(path.join(tempDir, '.git')))) throw new Error('.git dir missing');
    if (!(await fs.pathExists(path.join(tempDir, '.gitignore')))) throw new Error('.gitignore missing');

    const checkpoints1 = await gitService.getCheckpoints(tempDir);
    if (checkpoints1.length !== 1 || !checkpoints1[0]) throw new Error(`Expected 1 checkpoint, got ${checkpoints1.length}`);
    if (!checkpoints1[0].message.includes('Initial Project Template Checkpoint')) {
      throw new Error(`Unexpected commit message: ${checkpoints1[0].message}`);
    }
    console.log('  ✓ Git repository initialized with initial template checkpoint');

    // Test 2: Modify & create checkpoint
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Updated Readme by Agent');
    await fs.ensureDir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'console.log("hello world");');

    const commitHash = await gitService.createCheckpoint(tempDir, 'Add index.ts and update README');
    if (!commitHash) throw new Error('Failed to create commit checkpoint');

    const checkpoints2 = await gitService.getCheckpoints(tempDir);
    if (checkpoints2.length !== 2 || !checkpoints2[0] || !checkpoints2[1]) {
      throw new Error(`Expected 2 checkpoints, got ${checkpoints2.length}`);
    }
    console.log('  ✓ Agent code modifications committed as discrete checkpoints');

    // Test 3: Diff generation
    const diff = await gitService.getDiff(tempDir, checkpoints2[0].hash);
    if (!diff.includes('Updated Readme by Agent') || !diff.includes('hello world')) {
      throw new Error('Diff does not contain expected changes');
    }
    console.log('  ✓ Visual commit diff generated successfully');

    // Test 4: Rollback
    const initialHash = checkpoints2[1].hash;
    await fs.writeFile(path.join(tempDir, 'unwanted.txt'), 'Delete this');
    await gitService.createCheckpoint(tempDir, 'Breaking change');

    await gitService.rollbackToCheckpoint(tempDir, initialHash);
    const readmeContent = await fs.readFile(path.join(tempDir, 'README.md'), 'utf-8');
    if (readmeContent !== '# Initial Readme') {
      throw new Error(`Rollback failed! Expected initial readme, got: ${readmeContent}`);
    }
    if (await fs.pathExists(path.join(tempDir, 'unwanted.txt'))) {
      throw new Error('Rollback failed to clean untracked files');
    }
    console.log('  ✓ Rollback successfully restored workspace to previous checkpoint');

    console.log('🎉 ALL GIT CHECKPOINT TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    await fs.remove(tempDir);
  }
}

runGitTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
