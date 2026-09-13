# Step 08: Main Server & Web UI Integration (Landing, Onboarding & IDE)

## 1. Objective
Construct the main application REST/SSE API endpoints in `apps/server` and build a sleek, tier-1 SaaS frontend in `apps/web`. 

Includes:
- **First-Time Superuser Onboarding Wizard (`/onboarding`)**: Guides new self-hosters to create the admin account and configure default AI model keys.
- **High-Converting Landing Page (`/`)**: Dark-mode-first aesthetic with hero prompt box, interactive template cards, feature breakdowns, and GitHub stats.
- **Projects Dashboard (`/dashboard`)**: Project cards grid, search, template picker modal, and quick launch.
- **Full 3-Pane Workspace IDE (`/projects/[id]`)**: File tree explorer, Monaco code editor & diff viewer, live iframe preview with viewport controls, and real-time AI chat stream console.

---

## 2. Files / Modules to Create
- **API Server Endpoints (`apps/server/src/routes/`)**:
  - `auth.ts` (POST /api/auth/onboarding, POST /api/auth/login, GET /api/auth/status, GET /api/auth/me)
  - `projects.ts` (GET /api/projects, POST /api/projects, GET /api/projects/:id, DELETE /api/projects/:id)
  - `workspace.ts` (GET /api/projects/:id/files, GET /api/projects/:id/file, PUT /api/projects/:id/file)
  - `agent.ts` (POST /api/projects/:id/agent/run, GET /api/projects/:id/agent/stream)
  - `system.ts` (GET /api/system/health, GET /api/system/onboarding-status)
- **Web Frontend Pages & Components (`apps/web/src/`)**:
  - `app/page.tsx` (Professional Landing Page with hero prompt, template gallery, interactive preview showcase)
  - `app/onboarding/page.tsx` (3-step wizard: Superuser Creation -> AI Provider Setup -> Finish)
  - `app/dashboard/page.tsx` (User project list, search, metrics, new project dialog)
  - `app/projects/[id]/page.tsx` (Main 3-pane IDE workspace)
  - `components/landing/HeroPrompt.tsx` (Glowing interactive prompt input box with suggestion pills)
  - `components/landing/TemplateGallery.tsx` (Cards with preview thumbnails and one-click clone)
  - `components/onboarding/SuperUserForm.tsx` (Admin setup form)
  - `components/onboarding/ProviderKeySetup.tsx` (AI provider key configuration & test connection)
  - `components/workspace/Header.tsx` (Project breadcrumbs, branch/checkpoint badge, preview URL, share button)
  - `components/workspace/FileTree.tsx` (Directory & file explorer with file-type icons)
  - `components/workspace/CodeEditor.tsx` (Monaco editor with syntax highlighting & auto-save)
  - `components/workspace/DiffViewer.tsx` (Side-by-side Monaco diff comparison for agent changes)
  - `components/workspace/LivePreview.tsx` (Iframe wrapper with responsive viewport toggle & reload button)
  - `components/workspace/AIChatPane.tsx` (AI message history, prompt input field, model selector dropdown)
  - `components/workspace/AgentLogViewer.tsx` (Live terminal-style tool output log console)

---

## 3. Dependencies
- `@monaco-editor/react`
- `lucide-react`
- `framer-motion` (Fluid animations for landing page & modal transitions)
- `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`
- `clsx`, `tailwind-merge`

---

## 4. Commands to Run
```bash
pnpm --filter web dev
pnpm --filter server dev
```

---

## 5. Architecture Decisions
- **First-Time Detection Middleware**: The frontend root layout checks `/api/system/onboarding-status`. If `onboarding_completed: false`, any unauthenticated user is seamlessly redirected to `/onboarding`.
- **Tier-1 Dark Theme Design System**: Sleek aesthetic inspired by Lovable, Linear, and Vercel:
  - Deep slate/zinc dark backgrounds (`#09090b`, `#18181b`)
  - Subtle violet/indigo neon gradient borders and glow effects
  - Clean typography (`Inter` / `Geist Sans` + `Geist Mono` for code)
- **Real-Time Agent Streaming**: Server-Sent Events (SSE) `/api/projects/:id/agent/stream` delivering instant token streaming, tool call execution indicators, and status updates.

---

## 6. Implementation Order
1. Build Auth & System status API routes in `apps/server/src/routes/`:
   - Verify if superuser exists; provide setup endpoint for onboarding.
2. Build the First-Time Onboarding Wizard (`/onboarding`):
   - Step 1: Admin Account Creation (Name, Email, Password).
   - Step 2: AI Provider Key Selection & Connection Ping (OpenAI / Anthropic / OpenRouter / Ollama).
   - Step 3: Success splash & automatic login redirection to `/dashboard`.
3. Build the Landing Page (`/`):
   - Hero section with quick-action prompt box.
   - Starter template showcase (Dashboard, E-commerce, Portfolio, SaaS).
   - Feature cards highlighting isolated Docker execution, git checkpoints, and zero lock-in.
4. Build the Projects Dashboard (`/dashboard`):
   - Grid listing existing user applications with status badges and live preview links.
5. Build the 3-Pane Workspace IDE (`/projects/[id]`):
   - FileTree + Monaco Editor + Live Preview + Streaming AI Chat & Terminal Logs.

---

## 7. Acceptance Criteria
- Fresh install directs user straight to `/onboarding`.
- Completing the onboarding wizard sets up the super user and stores initial AI provider keys.
- Landing page renders with modern dark theme, glowing animations, and responsive layout.
- Prompting from landing page or workspace triggers real-time agent execution with live preview updates.

---

## 8. Testing Strategy
- E2E flow test:
  1. Initialize clean DB -> load `/` -> assert redirect to `/onboarding`.
  2. Fill admin credentials & provider key -> submit -> assert redirect to `/dashboard`.
  3. Click "New Project" -> select template -> assert workspace loads with FileTree, Editor, and Preview.

---

## 9. Common Mistakes to Avoid
- Allowing public access to `/dashboard` or workspace without completing the initial superuser setup.
- Blocking the UI thread when Monaco editor loads large source files.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT build external Stripe billing or credit meters in V1. Keep self-hosted usage free and unlimited for the instance owner.
