# Step 02: Database & Schema Design

## 1. Objective
Design and implement the SQLite database persistence layer using Drizzle ORM inside `packages/db`. Create tables for users, projects, conversations, messages, agent runs, agent tool calls, builds, and provider configurations.

---

## 2. Files / Modules to Create
- `packages/db/package.json`
- `packages/db/drizzle.config.ts` (Drizzle ORM configuration for SQLite)
- `packages/db/src/schema/index.ts` (Schema definitions for all tables)
- `packages/db/src/schema/projects.ts` (Projects table schema)
- `packages/db/src/schema/conversations.ts` (Conversations & messages schemas)
- `packages/db/src/schema/agent-runs.ts` (Agent runs & tool call history schemas)
- `packages/db/src/schema/provider-configs.ts` (AI provider configurations schema)
- `packages/db/src/client.ts` (SQLite connection pooling & Drizzle client initialization)
- `packages/db/src/repositories/` (Clean data access layer functions for CRUD operations)

---

## 3. Dependencies
- `drizzle-orm`, `better-sqlite3`
- Dev Dependencies: `drizzle-kit`, `@types/better-sqlite3`

---

## 4. Commands to Run
```bash
pnpm --filter @loveable/db generate  # Generate Drizzle migration files
pnpm --filter @loveable/db migrate   # Apply migrations to data/db.sqlite
```

---

## 5. Architecture Decisions
- **Database Choice**: SQLite via `better-sqlite3` for zero-configuration, lightning-fast synchronous local performance, single-file backup (`data/db.sqlite`), and effortless self-hosting.
- **ORM Choice**: Drizzle ORM for lightweight footprint, strict TypeScript safety, zero codegen overhead, and simple SQL migration files.
- **Data Location**: Actual project source code files reside on disk in `data/projects/project-id/`, NOT inside SQLite tables. SQLite stores project metadata, file paths, conversation history, and agent log events.

---

## 6. Implementation Order
1. Setup `packages/db` package with `drizzle-orm` and `better-sqlite3`.
2. Define SQLite tables in `packages/db/src/schema/`:
   - `users`: `id`, `email`, `created_at`
   - `projects`: `id`, `name`, `slug`, `path`, `status`, `created_at`, `updated_at`
   - `conversations`: `id`, `project_id`, `title`, `created_at`
   - `messages`: `id`, `conversation_id`, `role`, `content`, `tokens`, `created_at`
   - `agent_runs`: `id`, `project_id`, `prompt`, `status`, `duration_ms`, `created_at`
   - `agent_tool_calls`: `id`, `agent_run_id`, `tool_name`, `input`, `output`, `status`, `created_at`
   - `provider_configs`: `id`, `provider`, `model`, `is_active`, `created_at`
3. Export repository functions for projects, messages, and agent runs.
4. Run Drizzle migrations to generate initial database file in `data/db.sqlite`.

---

## 7. Acceptance Criteria
- Migration runs cleanly and creates `data/db.sqlite`.
- TypeScript auto-completion works seamlessly for all Drizzle schema entities.
- Unit tests verify CRUD operations for creating a project, appending messages, and recording agent tool calls.

---

## 8. Testing Strategy
- Write automated repository unit tests in `packages/db/src/__tests__/repository.test.ts` using an in-memory SQLite instance (`:memory:`).

---

## 9. Common Mistakes to Avoid
- Storing large binary or source code strings directly inside database rows instead of on the filesystem.
- Forgetting indexes on `project_id`, `conversation_id`, and `agent_run_id` foreign key columns.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT add complex multi-tenant cloud authentication or external PostgreSQL drivers. Keep the DB layer pure SQLite.
