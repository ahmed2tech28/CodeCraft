import { createAgentTools, CODECRAFT_SYSTEM_PROMPT, AgentContext, AgentStepEvent } from '../index.js';
import fs from 'fs-extra';
import path from 'node:path';

async function runAgentTests() {
  console.log('🧪 Starting AI Agent Engine & Tools Tests...');

  // 1. Verify System Prompt
  if (!CODECRAFT_SYSTEM_PROMPT.includes('CodeCraft') || !CODECRAFT_SYSTEM_PROMPT.includes('Tailwind')) {
    throw new Error('System prompt missing core directives');
  }
  console.log('  ✓ System prompt format & directives verified');

  // 2. Setup mock workspace for tool testing
  const testDir = path.resolve(process.cwd(), 'data/test-agent-workspace');
  await fs.ensureDir(testDir);
  await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test-app' }));
  await fs.ensureDir(path.join(testDir, 'src'));
  await fs.writeFile(
    path.join(testDir, 'src/App.tsx'),
    'export const App = () => <div>Hello World</div>;'
  );

  const events: AgentStepEvent[] = [];
  const mockContext: AgentContext = {
    projectId: 'test-proj-id',
    workspacePath: testDir,
    runId: 'test-run-id',
    emitEvent: (e) => events.push(e),
  };

  const tools = createAgentTools(mockContext);

  try {
    // 3. Test list_files tool
    const listResult = (await (tools.list_files.execute as unknown as (args: { subDirectory?: string }) => Promise<{ files: string[] }>)({})) as { files: string[] };
    if (!listResult.files || !listResult.files.includes('package.json')) {
      throw new Error('list_files tool failed to list workspace files');
    }
    console.log('  ✓ list_files tool verified');

    // 4. Test read_file tool
    const readResult = (await (tools.read_file.execute as unknown as (args: { path: string }) => Promise<{ content: string }>)(
      { path: 'src/App.tsx' }
    )) as { content: string };
    if (!readResult.content.includes('Hello World')) {
      throw new Error('read_file tool returned incorrect content');
    }
    console.log('  ✓ read_file tool verified');

    // 5. Test write_file tool
    const writeResult = (await (tools.write_file.execute as unknown as (args: { path: string; content: string }) => Promise<{ success: boolean }>)(
      {
        path: 'src/components/Card.tsx',
        content: 'export const Card = () => <div className="card">Card</div>;',
      }
    )) as { success: boolean };
    if (!writeResult.success) {
      throw new Error('write_file tool failed');
    }
    const cardExists = await fs.pathExists(path.join(testDir, 'src/components/Card.tsx'));
    if (!cardExists) {
      throw new Error('write_file did not create target file on disk');
    }
    console.log('  ✓ write_file tool verified');

    // 6. Test edit_file tool
    const editResult = (await (tools.edit_file.execute as unknown as (args: { path: string; targetSnippet: string; replacementSnippet: string }) => Promise<{ success: boolean }>)(
      {
        path: 'src/components/Card.tsx',
        targetSnippet: 'Card</div>',
        replacementSnippet: 'Updated Card</div>',
      }
    )) as { success: boolean };
    if (!editResult.success) {
      throw new Error('edit_file tool failed');
    }
    const updatedCardContent = await fs.readFile(
      path.join(testDir, 'src/components/Card.tsx'),
      'utf-8'
    );
    if (!updatedCardContent.includes('Updated Card')) {
      throw new Error('edit_file did not apply replacement correctly');
    }
    console.log('  ✓ edit_file snippet replacement tool verified');

    // 7. Verify file change events were emitted
    const fileChangeEvents = events.filter((e) => e.type === 'file_change');
    if (fileChangeEvents.length < 2) {
      throw new Error('File change events were not properly emitted');
    }
    console.log('  ✓ Real-time file change event emissions verified');

    console.log('🎉 ALL AGENT ENGINE & TOOLS TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  }
}

runAgentTests().catch((err) => {
  console.error('❌ Agent Test Failed:', err);
  process.exit(1);
});
