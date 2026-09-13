import {
  resolveAndValidateConfig,
  getLanguageModel,
  testProviderConnection,
} from '../index.js';
import { DEFAULT_AI_PROVIDER, DEFAULT_AI_MODEL } from '@codecraft/shared';

async function runAiTests() {
  console.log('🧪 Starting AI Provider Layer Tests...');

  // 1. Test Config Validator with defaults
  const defaultConfig = resolveAndValidateConfig();
  if (defaultConfig.provider !== DEFAULT_AI_PROVIDER || defaultConfig.model !== DEFAULT_AI_MODEL) {
    throw new Error(`Default config resolution failed: got ${defaultConfig.provider}/${defaultConfig.model}`);
  }
  console.log(`  ✓ Default configuration resolved correctly (${DEFAULT_AI_PROVIDER} / ${DEFAULT_AI_MODEL})`);

  // 2. Test Custom Config Overrides
  const anthropicConfig = resolveAndValidateConfig({
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-latest',
    apiKey: 'sk-ant-test-key',
  });
  if (
    anthropicConfig.provider !== 'anthropic' ||
    anthropicConfig.model !== 'claude-3-5-sonnet-latest' ||
    anthropicConfig.apiKey !== 'sk-ant-test-key'
  ) {
    throw new Error('Anthropic config override failed');
  }
  console.log('  ✓ Custom provider config overrides validated');

  // 3. Test Ollama default Base URL resolution
  const ollamaConfig = resolveAndValidateConfig({
    provider: 'ollama',
    model: 'qwen2.5-coder:latest',
  });
  if (ollamaConfig.provider !== 'ollama' || !ollamaConfig.baseUrl) {
    throw new Error('Ollama default baseUrl resolution failed');
  }
  console.log('  ✓ Ollama baseURL auto-configuration verified');

  // 4. Test OpenRouter Free Model Config
  const openrouterFreeConfig = resolveAndValidateConfig({
    provider: 'openrouter',
    model: 'google/gemma-4-31b-it:free',
    apiKey: 'sk-or-v1-mock',
  });
  if (openrouterFreeConfig.provider !== 'openrouter' || openrouterFreeConfig.model !== 'google/gemma-4-31b-it:free') {
    throw new Error('OpenRouter free model config resolution failed');
  }
  console.log('  ✓ OpenRouter free model (google/gemma-4-31b-it:free) configured');

  // 5. Test Model Factory instantiation for all providers
  const openaiInstance = getLanguageModel({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'mock' });
  if (!openaiInstance.model || openaiInstance.model.provider !== 'openai.chat') {
    throw new Error('OpenAI model creation failed');
  }
  console.log('  ✓ OpenAI language model instance instantiated');

  const anthropicInstance = getLanguageModel({
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-latest',
    apiKey: 'mock',
  });
  if (!anthropicInstance.model || anthropicInstance.model.provider !== 'anthropic.messages') {
    throw new Error('Anthropic language model creation failed');
  }
  console.log('  ✓ Anthropic language model instance instantiated');

  const openrouterInstance = getLanguageModel({
    provider: 'openrouter',
    model: 'google/gemma-4-31b-it:free',
    apiKey: 'mock',
  });
  if (!openrouterInstance.model) {
    throw new Error('OpenRouter free model instance creation failed');
  }
  console.log('  ✓ OpenRouter free language model instance instantiated');

  const ollamaInstance = getLanguageModel({
    provider: 'ollama',
    model: 'qwen2.5-coder:latest',
    baseUrl: 'http://localhost:11434/v1',
  });
  if (!ollamaInstance.model) {
    throw new Error('Ollama model creation failed');
  }
  console.log('  ✓ Ollama language model instance instantiated');

  // 6. Test testProviderConnection handles offline/invalid mock keys gracefully
  const testResult = await testProviderConnection({
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: 'invalid-mock-key-for-test',
  });
  if (testResult.success !== false || !testResult.error) {
    throw new Error('Expected invalid connection test to return structured error');
  }
  console.log('  ✓ testProviderConnection gracefully reports connection errors');

  console.log('🎉 ALL AI PROVIDER TESTS PASSED SUCCESSFULLY!\n');
}

runAiTests().catch((err) => {
  console.error('❌ AI Provider Test Failed:', err);
  process.exit(1);
});
