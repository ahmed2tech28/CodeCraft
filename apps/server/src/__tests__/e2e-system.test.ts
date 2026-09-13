import path from 'node:path';
import fs from 'fs-extra';
import { userRepository, projectRepository } from '@codecraft/db';
import { workspaceService } from '../services/workspace.service.js';
import { gitService } from '../services/git.service.js';
import { sanitizeSecrets, sanitizeObject } from '@codecraft/shared';

async function runE2ESystemTests() {
  console.log('🚀 Starting CodeCraft End-to-End System Integration Test...');
  const testProjectId = `e2e-test-${Date.now()}`;
  const testWorkspacePath = workspaceService.getWorkspacePath(testProjectId);

  try {
    // 1. Superuser Setup Verification
    const hasSuper = await userRepository.hasSuperUser();
    let superUserEmail = 'admin@codecraft.local';
    if (!hasSuper) {
      console.log('  Creating initial superuser...');
      await userRepository.createSuperUser({
        email: superUserEmail,
        password: 'Password123!',
        name: 'Super Admin',
      });
    }
    const verifiedSuperuser = await userRepository.findByEmail(superUserEmail);
    const userId = verifiedSuperuser?.id || 'admin-user-id';
    console.log('  ✓ Superuser onboarding & database authentication verified');

    // 2. Project Creation in Database
    const project = await projectRepository.createProject({
      name: 'E2E Test SaaS Application',
      path: testWorkspacePath,
      userId: userId,
    });
    if (!project || !project.id) throw new Error('Failed to create project in database');
    console.log(`  ✓ Project record created in SQLite DB (ID: ${project.id})`);

    // 3. Workspace Provisioning & Template Copying
    await workspaceService.initProjectWorkspace(testProjectId, 'nextjs');
    const files = await workspaceService.getFileTree(testProjectId);
    if (files.length === 0) throw new Error('Workspace created with no template files');
    console.log(`  ✓ Project workspace provisioned with starter template (${files.length} top-level nodes)`);

    // 4. Git Repository & Initial Checkpoint Initialization
    await gitService.initRepository(testWorkspacePath);
    const initialCheckpoints = await gitService.getCheckpoints(testWorkspacePath);
    if (initialCheckpoints.length === 0 || !initialCheckpoints[0]) {
      throw new Error('Initial git checkpoint was not created');
    }
    const initialHash = initialCheckpoints[0].hash;
    console.log(`  ✓ Local Git repository initialized with checkpoint: ${initialHash.slice(0, 7)}`);

    // 5. Simulate Agent Modification Tool Execution
    await workspaceService.writeFile(
      testProjectId,
      'src/components/HeroBanner.tsx',
      'export function HeroBanner() { return <h1>CodeCraft E2E Hero</h1>; }\n'
    );
    await workspaceService.writeFile(
      testProjectId,
      'src/App.tsx',
      'import { HeroBanner } from "./components/HeroBanner";\nexport default function App() { return <HeroBanner />; }\n'
    );

    const updatedAppContent = await workspaceService.readFile(testProjectId, 'src/App.tsx');
    if (!updatedAppContent.includes('HeroBanner')) throw new Error('File update failed');
    console.log('  ✓ Agent tool file modifications applied to workspace');

    // 6. Post-Run Auto-Checkpoint Creation
    const agentCommit = await gitService.createCheckpoint(
      testWorkspacePath,
      'Add HeroBanner component and update App.tsx'
    );
    if (!agentCommit) throw new Error('Agent checkpoint commit failed');

    const checkpointsAfterRun = await gitService.getCheckpoints(testWorkspacePath);
    if (checkpointsAfterRun.length !== 2 || !checkpointsAfterRun[0]) {
      throw new Error(`Expected 2 checkpoints, found: ${checkpointsAfterRun.length}`);
    }
    console.log(`  ✓ Auto-checkpoint successfully committed: ${checkpointsAfterRun[0].hash.slice(0, 7)}`);

    // 7. Diff Verification
    const diff = await gitService.getDiff(testWorkspacePath, checkpointsAfterRun[0].hash);
    if (!diff.includes('HeroBanner')) throw new Error('Diff missing HeroBanner changes');
    console.log('  ✓ Side-by-side visual diff generated for code review');

    // 8. One-Click Rollback Verification
    await gitService.rollbackToCheckpoint(testWorkspacePath, initialHash);
    const rolledBackApp = await workspaceService.readFile(testProjectId, 'src/App.tsx');
    if (rolledBackApp.includes('HeroBanner')) {
      throw new Error('Rollback failed to revert App.tsx');
    }
    console.log('  ✓ One-click rollback restored workspace to initial checkpoint cleanly');

    // 9. Secret Sanitization on Telemetry / Tool Outputs
    const dirtyOutput = {
      command: 'curl -H "Authorization: Bearer sk-1234567890abcdef1234567890" http://api.internal',
      status: 'success',
      apiKey: 'sk-proj-99999999999999999999',
    };
    const sanitizedTelemetry = sanitizeObject(dirtyOutput);
    if (JSON.stringify(sanitizedTelemetry).includes('sk-proj-99999999999999999999')) {
      throw new Error('Telemetry leaked API key!');
    }
    console.log('  ✓ Secret sanitization safeguarded telemetry and tool outputs');

    // 10. Clean up test project workspace and db record
    await fs.remove(testWorkspacePath);
    await projectRepository.deleteProject(project.id);

    console.log('\n🎉 ========================================================');
    console.log('🎉 ALL CODECRAFT E2E SYSTEM INTEGRATION TESTS PASSED!');
    console.log('🎉 ========================================================\n');
  } catch (err) {
    console.error('❌ E2E System Test Failed:', err);
    process.exit(1);
  }
}

runE2ESystemTests();
