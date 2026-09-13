# Step 11: Security Hardening, Observability & Verification

## 1. Objective
Apply core security mitigations, observability logging, token usage tracking, and automated integration testing across the platform to ensure safe, stable, and transparent self-hosted execution.

---

## 2. Files / Modules to Create
- `apps/server/src/utils/secret-sanitizer.ts` (Sanitizes sensitive API keys and environment variables from logs and stored tool call outputs)
- `apps/server/src/middleware/rate-limiter.ts` (Local IP rate limiting middleware preventing prompt spamming)
- `packages/shared/src/logger.ts` (Structured Pino/Winston JSON logger for server & agent operations)
- `e2e/workspace-flow.spec.ts` (End-to-end integration test suite using Playwright)

---

## 3. Dependencies
- `@playwright/test`
- `pino`
- `pino-pretty`

---

## 4. Commands to Run
```bash
pnpm --filter @loveable/server test
pnpm test:e2e
```

---

## 5. Architecture Decisions
- **Log Secret Sanitization**: All stdout/stderr logs and tool call arguments captured during agent runs pass through `secret-sanitizer` to prevent leaking provider API keys (`sk-...`) or secret environment variables to UI streams or database tables.
- **Lightweight Observability**: Structured JSON logging via `pino` with SQLite persistence for tool call execution metrics, token usage, and durations. Eliminates the need for external heavy observability tools (Datadog/Elasticsearch) for V1 self-hosting.

---

## 6. Implementation Order
1. Implement `secret-sanitizer.ts` with regex patterns targeting common secret formats (`sk-`, `ghp_`, `bearer `).
2. Configure `pino` logger in `packages/shared/src/logger.ts`.
3. Wrap tool execution outputs in `AgentRunner` with secret sanitizer before saving to SQLite or emitting SSE streams.
4. Implement E2E test in `e2e/workspace-flow.spec.ts` simulating:
   - Creating a project.
   - Sending prompt to agent.
   - Verifying container sandbox creation.
   - Checking live preview iframe rendering.
   - Verifying checkpoint commit creation.

---

## 7. Acceptance Criteria
- Logs and SQLite records containing API keys are automatically masked as `[REDACTED]`.
- End-to-end Playwright tests pass cleanly against local environment.
- Agent run telemetry records total token consumption, model name, tool invocation breakdown, and runtime duration.

---

## 8. Testing Strategy
- Run `pnpm test:e2e` to execute complete system integration test pipeline.

---

## 9. Common Mistakes to Avoid
- Printing raw user secret strings directly into unhandled error log tracebacks.
- Leaving test projects or lingering Docker containers created during E2E testing uncleaned.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT build complex Enterprise SIEM integrations or SOC2 compliance reporting engines in V1. Lightweight secret masking and structured local logging fulfill self-hosting security standards.
