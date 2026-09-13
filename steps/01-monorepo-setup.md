# Step 01: Monorepo & Core Infrastructure Setup

## 1. Objective
Establish a clean, robust monorepo architecture using `pnpm` workspaces and `Turborepo`. Configure standard TypeScript, ESLint, and package linkage across apps (`apps/web`, `apps/server`) and core packages (`packages/shared`, `packages/config`, `packages/ai`, `packages/db`, `packages/sandbox`, `packages/agent`).

---

## 2. Files / Modules to Create
- `package.json` (Root dependencies & workspace scripts)
- `pnpm-workspace.yaml` (Workspace package definitions)
- `turbo.json` (Turborepo task pipeline configuration)
- `packages/shared/package.json`, `packages/shared/src/index.ts` (Shared types, constants, schemas)
- `packages/config/package.json` (Shared tsconfig and eslint configurations)
- `apps/server/package.json`, `apps/server/src/index.ts` (Main API Node.js/Fastify server skeleton)
- `apps/web/package.json` (Next.js frontend setup)
- `.env.example` (Root environment template)

---

## 3. Dependencies
- Root: `turbo`, `typescript`, `prettier`, `eslint`
- `packages/shared`: `zod`
- `apps/server`: `fastify` (or `express`), `dotenv`, `@codecraft/shared`
- `apps/web`: `next`, `react`, `react-dom`, `tailwindcss`, `@codecraft/shared`

---

## 4. Commands to Run
```bash
pnpm install
pnpm build
pnpm dev
```

---

## 5. Architecture Decisions
- **Monorepo Tooling**: pnpm workspaces + Turborepo for fast caching, clean boundaries, and zero-hoisting issues.
- **Shared Schemas**: All data structures and API contracts will be defined using Zod inside `packages/shared` so both server and web frontend share identical strict types.
- **App Separation**: `apps/server` handles heavy orchestration, DB access, and Docker operations, while `apps/web` provides the Next.js UI layer.

---

## 6. Implementation Order
1. Configure root `pnpm-workspace.yaml` and `turbo.json`.
2. Set up `packages/config` with base `tsconfig.json`.
3. Set up `packages/shared` with base TypeScript exports & Zod schemas.
4. Set up placeholder packages: `packages/db`, `packages/ai`, `packages/sandbox`, `packages/agent`.
5. Initialize `apps/server` with Fastify server boilerplate.
6. Initialize `apps/web` with Next.js 14+ setup.
7. Verify cross-package imports and Turborepo build pipeline.

---

## 7. Acceptance Criteria
- `pnpm install` resolves dependencies without warnings or errors.
- `pnpm build` successfully compiles all packages and applications via Turborepo.
- `apps/server` can import types from `@codecraft/shared`.
- `apps/web` can build and launch on `localhost:3000`.

---

## 8. Testing Strategy
- Run `pnpm build` to confirm TypeScript type-checking across all monorepo packages.
- Run `pnpm dev` to check simultaneous hot-reloading of `apps/server` and `apps/web`.

---

## 9. Common Mistakes to Avoid
- Creating circular dependencies between `apps` and `packages`.
- Hoisting conflicting TypeScript versions in package dependencies.
- Writing raw inline types in components instead of importing shared Zod schemas.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT implement actual database connections, AI model calls, or Docker container runners in this step. Keep all modules as clean interfaces or stubs.
