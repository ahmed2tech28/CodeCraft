import { sanitizeSecrets, sanitizeObject } from '@codecraft/shared';

async function runSecurityTests() {
  console.log('🧪 Starting Security & Secret Sanitizer Tests...');

  // Test 1: OpenAI key redaction
  const openAiSample = 'Connecting to OpenAI with key sk-proj-1234567890abcdef1234567890 for prompt processing';
  const sanitizedOpenAi = sanitizeSecrets(openAiSample);
  if (sanitizedOpenAi.includes('sk-proj-1234567890abcdef1234567890') || !sanitizedOpenAi.includes('[REDACTED_API_KEY]')) {
    throw new Error(`OpenAI key was not redacted properly: ${sanitizedOpenAi}`);
  }
  console.log('  ✓ OpenAI API keys masked with [REDACTED_API_KEY]');

  // Test 2: Anthropic key redaction
  const anthropicSample = 'Anthropic token sk-ant-api03-abcdefghijklmnop1234567890-test active';
  const sanitizedAnthropic = sanitizeSecrets(anthropicSample);
  if (sanitizedAnthropic.includes('sk-ant-api03') || !sanitizedAnthropic.includes('[REDACTED_ANTHROPIC_KEY]')) {
    throw new Error(`Anthropic key was not redacted properly: ${sanitizedAnthropic}`);
  }
  console.log('  ✓ Anthropic API keys masked with [REDACTED_ANTHROPIC_KEY]');

  // Test 3: GitHub personal access tokens
  const ghSample = 'git clone https://ghp_1234567890abcdefghijklmnop@github.com/repo.git';
  const sanitizedGh = sanitizeSecrets(ghSample);
  if (sanitizedGh.includes('ghp_1234567890abcdefghijklmnop') || !sanitizedGh.includes('[REDACTED_GITHUB_TOKEN]')) {
    throw new Error(`GitHub token was not redacted properly: ${sanitizedGh}`);
  }
  console.log('  ✓ GitHub personal access tokens masked with [REDACTED_GITHUB_TOKEN]');

  // Test 4: Nested Object Sanitization
  const payload = {
    apiKey: 'sk-12345678901234567890123456',
    config: {
      password: 'super_secret_password',
      normalField: 'hello world',
      tokens: ['Bearer secret_token_12345678901234567890', 'normal string'],
    },
  };

  const sanitizedObj = sanitizeObject(payload);
  if (JSON.stringify(sanitizedObj).includes('super_secret_password')) {
    throw new Error('Password field was not redacted in nested object');
  }
  if (JSON.stringify(sanitizedObj).includes('sk-12345678901234567890123456')) {
    throw new Error('API key was not redacted in nested object');
  }
  console.log('  ✓ Nested metadata and tool call argument objects sanitized recursively');

  console.log('🎉 ALL SECURITY SANITIZATION TESTS PASSED SUCCESSFULLY!\n');
}

runSecurityTests().catch((err) => {
  console.error('❌ Security test failed:', err);
  process.exit(1);
});
