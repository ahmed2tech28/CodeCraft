# Step 03: AI Provider Abstraction & Model Config

## 1. Objective
Build a flexible, pluggable AI provider abstraction package (`packages/ai`) that standardizes interaction across LLM providers (OpenAI, Anthropic, OpenRouter, and local Ollama) using the Vercel AI SDK (`ai`). Users can configure models via `.env` without touching code.

---

## 2. Files / Modules to Create
- `packages/ai/package.json`
- `packages/ai/src/types.ts` (Provider configs, model capabilities, stream response types)
- `packages/ai/src/provider-factory.ts` (Factory function returning standardized SDK model instances)
- `packages/ai/src/providers/openai.ts`
- `packages/ai/src/providers/anthropic.ts`
- `packages/ai/src/providers/openrouter.ts`
- `packages/ai/src/providers/ollama.ts`
- `packages/ai/src/config-validator.ts` (Validates runtime AI provider environment variables)
- `packages/ai/src/index.ts`

---

## 3. Dependencies
- `ai` (Vercel AI SDK core)
- `@ai-sdk/openai`
- `@ai-sdk/anthropic`
- `@openrouter/ai-sdk-provider` (or custom OpenRouter wrapper)
- `zod`

---

## 4. Commands to Run
```bash
pnpm --filter @loveable/ai test
```

---

## 5. Architecture Decisions
- **SDK Standard**: Use Vercel AI SDK (`ai`) as the unified foundation. It provides out-of-the-box support for streaming, tool calling, structured outputs (`generateObject`, `streamText`), and provider swapability.
- **Dynamic Configuration**: Read environment parameters (`AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, `AI_BASE_URL`) dynamically, defaulting cleanly if unconfigured.

---

## 6. Implementation Order
1. Setup `packages/ai` package structure and install AI SDK packages.
2. Define provider configuration Zod schemas in `config-validator.ts`.
3. Implement `getLanguageModel()` factory function supporting:
   - OpenAI (`gpt-4o`, `gpt-4o-mini`)
   - Anthropic (`claude-3-5-sonnet`, `claude-3-haiku`)
   - OpenRouter (Custom model routing)
   - Ollama / Local OpenAI-compatible API (`qwen2.5-coder`, `deepseek-r1`)
4. Implement wrapper functions for `streamAgentResponse()` and structured outputs.

---

## 7. Acceptance Criteria
- Changing `AI_PROVIDER=anthropic` or `AI_PROVIDER=openai` in `.env` smoothly switches model execution without runtime errors.
- Text and tool call streaming interfaces return standard readable streams.
- Invalid configuration logs clear human-friendly setup instructions.

---

## 8. Testing Strategy
- Create mock test suite in `packages/ai/src/__tests__/provider.test.ts` verifying that `getLanguageModel()` constructs valid language model instances for each provider type.

---

## 9. Common Mistakes to Avoid
- Hardcoding provider API keys into source files.
- Implementing custom REST API wrapper code for OpenAI/Anthropic instead of utilizing the standard `ai` SDK abstractions.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT build agent memory or multi-step tool execution loops here. Keep this package strictly responsible for model connection and streaming interfaces.
