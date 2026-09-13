# Step 06: AI Coding Agent Engine & Tool Execution

## 1. Objective
Build the core autonomous coding agent loop in `packages/agent`. Equipping the LLM with structured tools (`read_file`, `write_file`, `edit_file`, `list_files`, `run_command`, `build_project`) to inspect, plan, write code, run builds, analyze errors, and self-correct inside the Docker sandbox.

---

## 2. Files / Modules to Create
- `packages/agent/package.json`
- `packages/agent/src/system-prompt.ts` (System instructions framing agent behavior, code style, and error recovery rules)
- `packages/agent/src/tools/index.ts` (Registry of tool definitions for Vercel AI SDK)
- `packages/agent/src/tools/read-file.ts`
- `packages/agent/src/tools/write-file.ts`
- `packages/agent/src/tools/edit-file.ts`
- `packages/agent/src/tools/list-files.ts`
- `packages/agent/src/tools/run-command.ts`
- `packages/agent/src/agent-runner.ts` (Main agent loop execution manager with multi-turn step tracking)
- `packages/agent/src/state-machine.ts` (Agent state manager: `queued`, `planning`, `coding`, `building`, `debugging`, `completed`, `failed`)

---

## 3. Dependencies
- `@loveable/ai`
- `@loveable/sandbox`
- `@loveable/db`
- `@loveable/shared`
- `ai` (Vercel AI SDK `generateText` / `streamText` tool calls)
- `zod`

---

## 4. Commands to Run
```bash
pnpm --filter @loveable/agent test
```

---

## 5. Architecture Decisions
- **Single Agent with Multi-Step Loop**: Rather than introducing complex multi-agent network overhead for V1, use a unified, highly focused agent equipped with clear system prompts and iterative tool-use loop capabilities.
- **Automated Repair Loop**: When `build_project` or `run_command` returns errors (non-zero exit code or TypeScript errors), the agent loop feeds failure output back to the model to enter `debugging` mode and patch offending files automatically.

---

## 6. Implementation Order
1. Craft strict `system-prompt.ts` enforcing concise code generation, precise file path usage, and verification guidelines.
2. Implement tools in `packages/agent/src/tools/`:
   - `read_file`: Reads target file from project workspace.
   - `write_file`: Overwrites/creates target file in project workspace.
   - `edit_file`: Performs targeted string replacement or snippet replacement.
   - `list_files`: Returns workspace file tree.
   - `run_command`: Executes bash command inside target project Docker sandbox container.
   - `build_project`: Executes `pnpm build` or `pnpm check` in container and reports build results.
3. Build `AgentRunner`:
   - Orchestrates multi-step tool calls up to `maxSteps` (e.g. 15 steps).
   - Emits real-time SSE events for every step, tool call, argument, and output log.
   - Records tool execution details into SQLite `agent_runs` and `agent_tool_calls` tables.

---

## 7. Acceptance Criteria
- Agent receives user prompt (e.g. "Create a dark mode toggle button component"), reads project files, writes new component file, imports it into App component, runs build verification, and reports success.
- Tool arguments pass Zod schema validation.
- Build failures trigger automated self-correction turns.

---

## 8. Testing Strategy
- Mock tests in `packages/agent/src/__tests__/agent.test.ts` running agent runner against mock workspace files to verify tool invocation flow and step persistence.

---

## 9. Common Mistakes to Avoid
- Allowing infinite tool loops (always enforce `maxSteps` budget cap).
- Swallowing tool errors cleanly without presenting diagnostic tracebacks to model.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT build external web browser scraping or vector database RAG features in V1. Selective directory listing + file reading provides ample context for standard web apps.
