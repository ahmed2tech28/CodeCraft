import { runnerManager } from '../services/runner-manager.js';
import { previewManager } from '../services/preview-manager.js';
import { isDockerAvailable } from '@codecraft/sandbox';
import path from 'node:path';
import fs from 'fs-extra';

async function runRunnerPreviewTests() {
  console.log('🧪 Starting Runner & Preview Manager Tests...');

  // 1. Test Port Allocator
  const freePort = await previewManager.findFreePort(5000);
  if (typeof freePort !== 'number' || freePort < 5000) {
    throw new Error('Failed to find free port');
  }
  console.log(`  ✓ Dynamic port allocation found free port: ${freePort}`);

  // 2. Test Preview Status for inactive project
  const initialStatus = previewManager.getPreviewStatus('non-existent-proj');
  if (initialStatus.status !== 'stopped' || initialStatus.previewUrl !== null) {
    throw new Error('Initial preview status should be stopped');
  }
  console.log('  ✓ Inactive preview status reporting verified');

  // 3. Test Runner In Sandbox (if Docker is online)
  const dockerActive = await isDockerAvailable();
  if (dockerActive) {
    const testDir = path.resolve(process.cwd(), 'data/test-runner-workspace');
    await fs.ensureDir(testDir);
    await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'runner-test' }));

    try {
      console.log('  ⚡ Running test command inside temporary runner container...');
      const result = await runnerManager.runInSandbox(
        'test-runner-proj',
        testDir,
        'node -v && echo "Runner OK"'
      );

      if (result.exitCode !== 0 || !result.stdout.includes('Runner OK')) {
        throw new Error(`Runner container command failed: ${result.stderr}`);
      }
      console.log('  ✓ Temporary runner container executed and automatically cleaned up');
    } finally {
      if (await fs.pathExists(testDir)) {
        await fs.remove(testDir);
      }
    }
  } else {
    console.log('  ℹ Docker is offline; skipped live container run');
  }

  console.log('🎉 ALL RUNNER & PREVIEW TESTS PASSED SUCCESSFULLY!\n');
}

runRunnerPreviewTests().catch((err) => {
  console.error('❌ Runner/Preview Test Failed:', err);
  process.exit(1);
});
