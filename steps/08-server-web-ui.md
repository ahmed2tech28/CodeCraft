# Step 08: Main Server & Web UI Integration

## 1. Objective
Construct the main application REST/SSE API endpoints in `apps/server` and build the full-featured Next.js IDE interface in `apps/web`. Features include a 3-pane layout (File Tree Explorer, Code Editor/Diff Viewer, Live Preview iframe / Agent Logs / AI Chat interface).

---

## 2. Files / Modules to Create
- **API Server Endpoints (`apps/server/src/routes/`)**:
  - `projects.ts` (GET /api/projects, POST /api/projects, GET /api/projects/:id)
  - `workspace.ts` (GET /api/projects/:id/files, GET /api/projects/:id/file, PUT /api/projects/:id/file)
  - `agent.ts` (POST /api/projects/:id/agent/run, GET /api/projects/:id/agent/stream)
  - `providers.ts` (GET /api/providers, POST /api/providers)
- **Web Frontend (`apps/web/src/`)**:
  - `app/projects/[id]/page.tsx` (Main workspace view page)
  - `components/layout/Header.tsx` (Project title, status indicator, action buttons)
  - `components/workspace/FileTree.tsx` (Directory & file explorer pane)
  - `components/workspace/CodeEditor.tsx` (Monaco / CodeMirror editor component)
  - `components/workspace/DiffViewer.tsx` (Monaco diff editor for proposed agent edits)
  - `components/workspace/LivePreview.tsx` (Iframe preview wrapper with refresh & responsiveness controls)
  - `components/workspace/AIChatPane.tsx` (AI message history, prompt input field, model selector)
  - `components/workspace/AgentLogViewer.tsx` (Live terminal-style tool output log console)

---

## 3. Dependencies
- `@monaco-editor/react` (Or `@uiw/react-codemirror`)
- `lucide-react`
- `@radix-ui/react-slot`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`
- `clsx`, `tailwind-merge`

---

## 4. Commands to Run
```bash
pnpm --filter web dev
pnpm --filter server dev
```

---

## 5. Architecture Decisions
- **Real-Time Agent Streaming**: Use Server-Sent Events (SSE) `/api/projects/:id/agent/stream` to broadcast agent state transitions, tool call parameters, execution logs, and token streams in real-time to the frontend.
- **3-Pane Split Layout**: Resizable left sidebar (File Explorer), center main pane (Code Editor / Diff View / Live Preview tabs), right sidebar (AI Chat & Execution Activity Log).

---

## 6. Implementation Order
1. Build server API routes in `apps/server/src/routes/`.
2. Configure SSE streaming endpoint in `agent.ts` connecting agent runner step emitters directly to client streams.
3. Build UI component hierarchy in `apps/web/src/components/`:
   - Setup `FileTree` component with file expansion & click selection.
   - Setup `CodeEditor` integrated with Monaco Editor.
   - Setup `LivePreview` iframe component listening to preview proxy URL.
   - Setup `AIChatPane` with streaming message cards, status pills, and tool call accordion logs.
4. Wire frontend state with server API hooks.

---

## 7. Acceptance Criteria
- User can select a file from File Tree to open it in Code Editor.
- User typing a prompt triggers agent execution; live tool calls appear in AIChatPane in real-time.
- Live Preview iframe renders generated application and updates automatically on code completion.

---

## 8. Testing Strategy
- Playwright / Cypress E2E smoke test loading project workspace page, asserting FileTree renders template files, and typing test chat message.

---

## 9. Common Mistakes to Avoid
- Stalling UI thread during large file edits (use virtualized trees for deep file structures).
- Losing scroll position in chat view during rapid token streaming.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT build complex collaborative multi-user editing sockets (CRDT/Yjs) in V1. Single-user workspace editing is standard for self-hosted setup.
