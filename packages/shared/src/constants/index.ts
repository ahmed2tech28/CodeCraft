export const DEFAULT_AI_PROVIDER = 'openai';
export const DEFAULT_AI_MODEL = 'gpt-4o-mini';

export interface ModelOption {
  id: string;
  name: string;
  isFree?: boolean;
  contextLength?: number;
  description?: string;
}

export const OPENROUTER_FREE_MODELS: ModelOption[] = [
  {
    id: 'nex-agi/nex-n2.5-pro:free',
    name: 'Nex AGI: Nex-N2.5-Pro (Free)',
    isFree: true,
    contextLength: 262144,
    description: 'Agentic model designed for multi-file coding and visual feedback loop verification',
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere: North Mini Code (Free)',
    isFree: true,
    contextLength: 256000,
    description: 'Cohere agentic coding model optimized for tool use and software development',
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google: Gemma 4 31B Instruct (Free)',
    isFree: true,
    contextLength: 262144,
    description: 'Google DeepMind dense instruction model with reasoning and native tool-calling',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google: Gemma 4 26B A4B (Free)',
    isFree: true,
    contextLength: 262144,
    description: 'Google DeepMind efficient Mixture-of-Experts model with 256k context',
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: 'Poolside: Laguna S 2.1 (Free)',
    isFree: true,
    contextLength: 262144,
    description: '118B MoE coding agent model scoring 70%+ on Terminal-Bench',
  },
  {
    id: 'poolside/laguna-xs-2.1:free',
    name: 'Poolside: Laguna XS 2.1 (Free)',
    isFree: true,
    contextLength: 262144,
    description: 'High-speed coding agent model in the 33B-A3B category',
  },
  {
    id: 'thinkingmachines/inkling:free',
    name: 'Thinking Machines: Inkling (Free)',
    isFree: true,
    contextLength: 1048576,
    description: '1M context window MoE model for agentic coding and general reasoning',
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA: Nemotron 3 Ultra 550B (Free)',
    isFree: true,
    contextLength: 1000000,
    description: 'NVIDIA 550B hybrid Transformer-Mamba MoE model with 1M context',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA: Nemotron 3.5 Lightning (Free)',
    isFree: true,
    contextLength: 1000000,
    description: 'High-throughput open MoE model for agentic workflows',
  },
  {
    id: 'nex-agi/nex-n2.5-mini:free',
    name: 'Nex AGI: Nex-N2.5-Mini (Free)',
    isFree: true,
    contextLength: 262144,
    description: 'Lightweight agentic coding model',
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter: Free Models Auto-Router (Free)',
    isFree: true,
    contextLength: 200000,
    description: 'Automatically routes requests to top available free models on OpenRouter',
  },
];

export const SUPPORTED_MODELS: Record<
  string,
  { label: string; defaultModel: string; models: string[]; modelOptions?: ModelOption[] }
> = {
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
    defaultModel: 'google/gemma-4-31b-it:free',
    models: [
      // Free Models
      'google/gemma-4-31b-it:free',
      'google/gemma-4-26b-a4b-it:free',
      'cohere/north-mini-code:free',
      'nex-agi/nex-n2.5-pro:free',
      'nex-agi/nex-n2.5-mini:free',
      'poolside/laguna-s-2.1:free',
      'poolside/laguna-xs-2.1:free',
      'thinkingmachines/inkling:free',
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'nvidia/nemotron-3.5-lightning:free',
      'openrouter/free',
      // Paid Frontier Models
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-2.0-flash-001',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-r1',
    ],
    modelOptions: [
      ...OPENROUTER_FREE_MODELS,
      { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet' },
      { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o' },
      { id: 'google/gemini-2.0-flash-001', name: 'Google: Gemini 2.0 Flash' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek: Chat V3' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek: R1 Reasoning' },
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
