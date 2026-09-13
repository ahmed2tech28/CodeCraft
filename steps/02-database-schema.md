# Step 02: Database & Schema Design

## 1. Objective
Design and implement the SQLite database persistence layer using Drizzle ORM inside `packages/db`. Create tables for users (including superuser admin support), system settings (onboarding status, provider keys), projects, conversations, messages, agent runs, agent tool calls, builds, and provider configurations.

---

## 2. Files / Modules to Create
- `packages/db/package.json`
- `packages/db/drizzle.config.ts` (Drizzle ORM configuration for SQLite)
- `packages/db/src/schema/index.ts` (Schema definitions export barrel)
- `packages/db/src/schema/users.ts` (Users, superuser flag, passwords, sessions)
- `packages/db/src/schema/system-settings.ts` (System configuration, onboarding status, default provider)
- `packages/db/src/schema/projects.ts` (Projects table schema)
- `packages/db/src/schema/conversations.ts` (Conversations & messages schemas)
- `packages/db/src/schema/agent-runs.ts` (Agent runs & tool call history schemas)
- `packages/db/src/schema/provider-configs.ts` (AI provider configurations schema)
- `packages/db/src/client.ts` (SQLite connection pooling & Drizzle client initialization)
- `packages/db/src/repositories/` (Clean data access layer functions for CRUD operations)

---

## 3. Dependencies
- `drizzle-orm`, `better-sqlite3`, `bcryptjs`
- Dev Dependencies: `drizzle-kit`, `@types/better-sqlite3`, `@types/bcryptjs`

---

## 4. Commands to Run
```bash
pnpm --filter @loveable/db generate  # Generate Drizzle migration files
pnpm --filter @loveable/db migrate   # Apply migrations to data/db.sqlite
```

---

## 5. Architecture Decisions
- **Database Choice**: SQLite via `better-sqlite3` for zero-configuration, lightning-fast synchronous local performance, single-file backup (`data/db.sqlite`), and effortless self-hosting.
- **Super User & Auth**: Built-in simple authentication with hashed passwords (`bcryptjs`). First user created automatically receives `is_superuser = true`.
- **System Settings Table**: Stores instance-level configuration (e.g. `onboarding_completed: boolean`, default AI model settings) to detect uninitialized self-hosted setups dynamically.
- **Data Location**: Actual project source code files reside on disk in `data/projects/{projectId}/`, NOT inside SQLite tables. SQLite stores metadata, audit logs, and conversation history.

---

## 6. Implementation Order
1. Setup `packages/db` package with `drizzle-orm` and `better-sqlite3`.
2. Define SQLite tables in `packages/db/src/schema/`:
   - `users`: `id`, `email`, `name`, `password_hash`, `is_superuser` (boolean), `created_at`
   - `sessions`: `id`, `user_id`, `token`, `expires_at`, `created_at`
   - `system_settings`: `id`, `key` (unique), `value` (text/json), `created_at`, `updated_at`
   - `projects`: `id`, `user_id`, `name`, `slug`, `path`, `status`, `created_at`, `updated_at`
   - `conversations`: `id`, `project_id`, `title`, `created_at`
   - `messages`: `id`, `conversation_id`, `role`, `content`, `tokens`, `created_at`
   - `agent_runs`: `id`, `project_id`, `prompt`, `status`, `duration_ms`, `created_at`
   - `agent_tool_calls`: `id`, `agent_run_id`, `tool_name`, `input`, `output`, `status`, `created_at`
   - `provider_configs`: `id`, `provider`, `model`, `api_key_encrypted`, `is_active`, `created_at`
3. Export repository functions:
   - `userRepository`: `hasSuperUser()`, `createSuperUser()`, `findByEmail()`, `verifyPassword()`
   - `systemRepository`: `isOnboardingCompleted()`, `completeOnboarding()`
   - `projectRepository`: `createProject()`, `listProjects()`, `getProjectById()`
   - `agentRepository`: `createRun()`, `recordToolCall()`, `updateRunStatus()`
4. Run Drizzle migrations to generate initial database file in `data/db.sqlite`.

---

## 7. Acceptance Criteria
- Migration runs cleanly and creates `data/db.sqlite`.
- `userRepository.hasSuperUser()` correctly returns `false` on a fresh database and `true` after creating the first admin.
- Unit tests verify CRUD operations for superuser creation, project lifecycle, and agent history tracking.

---

## 8. Testing Strategy
- Write automated repository unit tests in `packages/db/src/__tests__/repository.test.ts` using an in-memory SQLite instance (`:memory:`).

---

## 9. Common Mistakes to Avoid
- Storing plain-text passwords instead of bcrypt hashes.
- Storing large binary or source code strings directly inside database rows instead of on the filesystem.
- Forgetting indexes on `project_id`, `conversation_id`, and `agent_run_id` foreign key columns.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT add complex multi-tenant enterprise SAML/OAuth SSO configurations. Keep the local auth simple, fast, and self-contained for self-hosting.
