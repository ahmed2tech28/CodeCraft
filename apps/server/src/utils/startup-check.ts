import fs from 'fs-extra';
import path from 'node:path';
import { isDockerAvailable } from '@codecraft/sandbox';

export interface StartupCheckResult {
  dockerConnected: boolean;
  dockerError?: string;
  dataDirWritable: boolean;
  dataDirError?: string;
  aiConfigured: boolean;
  configuredProvider?: string;
}

export async function runStartupChecks(): Promise<StartupCheckResult> {
  const result: StartupCheckResult = {
    dockerConnected: false,
    dataDirWritable: false,
    aiConfigured: false,
  };

  console.log('\n========================================');
  console.log('  🛠️  CodeCraft Pre-Flight Startup Checks');
  console.log('========================================\n');

  // 1. Check Data Directory Permissions
  const dataDir = path.resolve(process.cwd(), 'data');
  try {
    await fs.ensureDir(dataDir);
    const testFile = path.join(dataDir, `.write-test-${Date.now()}`);
    await fs.writeFile(testFile, 'ok');
    await fs.remove(testFile);
    result.dataDirWritable = true;
    console.log('  [PASS] Data storage volume directory is writable (/data)');
  } catch (err) {
    result.dataDirWritable = false;
    result.dataDirError = (err as Error).message;
    console.error(`  [FAIL] Data directory is NOT writable: ${result.dataDirError}`);
  }

  // 2. Check Docker Daemon Connectivity
  try {
    const isAvailable = await isDockerAvailable();
    result.dockerConnected = isAvailable;
    if (isAvailable) {
      console.log('  [PASS] Docker daemon connection verified (/var/run/docker.sock)');
    } else {
      console.warn('  [WARN] Docker daemon unreachable. Sandbox runner containers will require active Docker daemon.');
    }
  } catch (err) {
    result.dockerConnected = false;
    result.dockerError = (err as Error).message;
    console.warn(`  [WARN] Docker daemon unreachable (${result.dockerError}). Sandbox runner containers will require active Docker daemon.`);
  }

  // 3. Check AI Provider Key Setup
  const aiProvider = process.env.AI_PROVIDER || 'openai';
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);
  const hasOllama = Boolean(process.env.OLLAMA_BASE_URL || aiProvider === 'ollama');

  if (hasOpenAI || hasAnthropic || hasOpenRouter || hasOllama) {
    result.aiConfigured = true;
    result.configuredProvider = aiProvider;
    console.log(`  [PASS] AI provider environment configuration found (Provider: ${aiProvider})`);
  } else {
    result.aiConfigured = false;
    console.log('  [INFO] No default AI API keys configured in environment. Keys can be configured in UI settings or onboarding.');
  }

  console.log('\n========================================\n');
  return result;
}
