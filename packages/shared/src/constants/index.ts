export const DEFAULT_AI_PROVIDER = 'openai';
export const DEFAULT_AI_MODEL = 'gpt-4o-mini';

export const SUPPORTED_MODELS: Record<string, { label: string; defaultModel: string; models: string[] }> = {
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o1-mini', 'o3-mini'],
  },
  anthropic: {
    label: 'Anthropic',
    defaultModel: 'claude-3-5-sonnet-latest',
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-001',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-r1',
    ],
  },
  ollama: {
    label: 'Local Ollama',
    defaultModel: 'qwen2.5-coder:latest',
    models: ['qwen2.5-coder:latest', 'deepseek-r1:latest', 'llama3.1:latest', 'mistral:latest'],
  },
};

export const IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  '.cache',
  'coverage',
];

export const SANDBOX_DEFAULTS = {
  CPU_LIMIT: 2000000000, // 2 CPUs in NanoCPUs
  MEMORY_LIMIT: 1073741824, // 1 GB
  PIDS_LIMIT: 256,
  EXEC_TIMEOUT_MS: 180000, // 3 minutes
  DEV_SERVER_PORT: 3000,
};
