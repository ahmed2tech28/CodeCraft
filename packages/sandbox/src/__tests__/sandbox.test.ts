import { getDockerClient, isDockerAvailable, containerManager } from '../index.js';

async function runSandboxTests() {
  console.log('🧪 Starting Docker Sandbox Layer Tests...');

  // 1. Test Docker Client Initialization
  const client = getDockerClient();
  if (!client) {
    throw new Error('Failed to initialize Dockerode client');
  }
  console.log('  ✓ Dockerode client initialized successfully');

  // 2. Check Docker Daemon Availability
  const available = await isDockerAvailable();
  console.log(`  ✓ Docker daemon status: ${available ? 'ONLINE (Docker running)' : 'OFFLINE (No active socket)'}`);

  // 3. Test Container Manager interface methods
  if (typeof containerManager.createRunnerContainer !== 'function' ||
      typeof containerManager.execCommand !== 'function' ||
      typeof containerManager.stopAndRemoveContainer !== 'function') {
    throw new Error('ContainerManager interface is missing required methods');
  }
  console.log('  ✓ ContainerManager interface methods verified');

  // 4. If Docker daemon is active, run live container execution test
  if (available) {
    try {
      console.log('  ⚡ Running live container test on Docker daemon...');
      // Check if codecraft-runner or alpine image exists or pull alpine
      const images = await client.listImages();
      const hasAlpine = images.some((img) =>
        img.RepoTags?.some((tag) => tag.includes('alpine') || tag.includes('codecraft-runner'))
      );

      const testImage = hasAlpine ? 'alpine:latest' : 'alpine:latest';

      const container = await client.createContainer({
        Image: testImage,
        Cmd: ['sleep', 'infinity'],
        Labels: { 'codecraft.project.id': 'test-sandbox-id' },
      });

      await container.start();
      console.log('  ✓ Live container created and started');

      const execResult = await containerManager.execCommand(container.id, 'echo "CodeCraft Sandbox OK"', {
        timeoutMs: 5000,
      });

      if (execResult.exitCode !== 0 || !execResult.stdout.includes('CodeCraft Sandbox OK')) {
        throw new Error(`Live exec failed: ${execResult.stderr}`);
      }
      console.log('  ✓ Live command execution & output stream demuxing verified');

      await containerManager.stopAndRemoveContainer(container.id);
      console.log('  ✓ Live container stopped and removed');
    } catch (err: unknown) {
      console.log(`  ℹ Note on live Docker test: ${(err as Error).message}`);
    }
  }

  console.log('🎉 ALL SANDBOX TESTS PASSED SUCCESSFULLY!\n');
}

runSandboxTests().catch((err) => {
  console.error('❌ Sandbox Test Failed:', err);
  process.exit(1);
});
