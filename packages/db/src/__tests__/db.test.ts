import { runMigrations } from '../migrate.js';
import { getDb, closeDb } from '../client.js';
import {
  userRepository,
  systemRepository,
  projectRepository,
  conversationRepository,
  agentRepository,
  providerRepository,
} from '../repositories/index.js';
import fs from 'node:fs';
import path from 'node:path';

async function runTests() {
  console.log('🧪 Starting Database Layer Tests...');

  const testDbPath = path.resolve(process.cwd(), 'data/test-db.sqlite');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // 1. Run Migrations
  const migrationResult = runMigrations(testDbPath);
  if (!migrationResult.success) throw new Error('Migration failed');
  console.log('  ✓ Migrations executed successfully');

  // Initialize DB with test path
  process.env.DATABASE_URL = testDbPath;
  const _db = getDb({ dbPath: testDbPath });

  // 2. Test Superuser creation & checks
  const initialHasSuper = await userRepository.hasSuperUser();
  if (initialHasSuper !== false) throw new Error('Expected initial hasSuperUser to be false');
  console.log('  ✓ Initial superuser check returns false');

  const superUser = await userRepository.createSuperUser({
    name: 'Admin Developer',
    email: 'admin@codecraft.dev',
    password: 'Password123!',
  });
  if (!superUser.isSuperuser || superUser.email !== 'admin@codecraft.dev') {
    throw new Error('Superuser creation failed');
  }
  console.log('  ✓ Superuser created successfully');

  const afterHasSuper = await userRepository.hasSuperUser();
  if (afterHasSuper !== true) throw new Error('Expected hasSuperUser to be true');
  console.log('  ✓ Post-creation superuser check returns true');

  // 3. Test Password Verification
  const dbUser = await userRepository.findByEmail('admin@codecraft.dev');
  if (!dbUser) throw new Error('User not found by email');
  const validPass = await userRepository.verifyPassword(dbUser, 'Password123!');
  const invalidPass = await userRepository.verifyPassword(dbUser, 'WrongPassword');
  if (!validPass || invalidPass) throw new Error('Password verification mismatch');
  console.log('  ✓ Password hashing & bcrypt verification passed');

  // 4. Test System Settings & Onboarding
  const initialOnboarding = await systemRepository.isOnboardingCompleted();
  if (initialOnboarding !== false) throw new Error('Expected onboarding to be false');
  await systemRepository.completeOnboarding();
  const completedOnboarding = await systemRepository.isOnboardingCompleted();
  if (completedOnboarding !== true) throw new Error('Expected onboarding to be true');
  console.log('  ✓ System settings & onboarding flag verified');

  // 5. Test Project Repository
  const project = await projectRepository.createProject({
    userId: superUser.id,
    name: 'Test Next.js App',
    path: '/data/projects/test-nextjs-app',
  });
  if (!project.id || project.name !== 'Test Next.js App') throw new Error('Project creation failed');
  const foundProject = await projectRepository.getProjectById(project.id);
  if (!foundProject) throw new Error('Project lookup failed');
  console.log('  ✓ Project CRUD operations verified');

  // 6. Test Conversation & Messages
  const conversation = await conversationRepository.getOrCreateDefaultConversation(project.id);
  const userMsg = await conversationRepository.addMessage({
    conversationId: conversation.id,
    role: 'user',
    content: 'Build a landing page for me',
  });
  const msgs = await conversationRepository.getMessages(conversation.id);
  if (msgs.length !== 1 || !msgs[0] || msgs[0].content !== userMsg.content) {
    throw new Error('Conversation message storage failed');
  }
  console.log('  ✓ Conversation & message tracking verified');

  // 7. Test Agent Runs & Tool Calls
  const run = await agentRepository.createRun({
    projectId: project.id,
    prompt: 'Create navbar component',
  });
  await agentRepository.recordToolCall({
    agentRunId: run.id,
    toolName: 'write_file',
    input: { path: 'src/components/Navbar.tsx', content: 'export const Navbar = () => {}' },
    status: 'success',
  });
  await agentRepository.updateRunStatus(run.id, 'completed', { durationMs: 1200 });
  const runs = await agentRepository.getRunsByProject(project.id);
  const toolCalls = await agentRepository.getToolCallsByRun(run.id);
  if (runs.length !== 1 || toolCalls.length !== 1 || !toolCalls[0] || toolCalls[0].toolName !== 'write_file') {
    throw new Error('Agent run or tool call tracking failed');
  }
  console.log('  ✓ Agent runs & tool execution history verified');

  // 8. Test Provider Configs
  const providerConfig = await providerRepository.saveConfig({
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: 'sk-test-key-mock',
  });
  const activeConfig = await providerRepository.getActiveConfig();
  if (!activeConfig || activeConfig.model !== providerConfig.model) {
    throw new Error('Provider config persistence failed');
  }
  console.log('  ✓ Provider configuration persistence verified');

  closeDb();

  // Cleanup test database file
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('🎉 ALL DATABASE TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Database Test Failed:', err);
  process.exit(1);
});
