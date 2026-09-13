# Master Architecture Blueprint & Implementation Roadmap

## Executive Overview

This document serves as the master blueprint for building **CodeCraft (AI App Builder)** — a professional, open-source, self-hostable AI coding platform inspired by Lovable and Bolt.new. 

The core experience:
1. **First-Time Self-Hosted Onboarding**: Upon first launch, the platform automatically detects an uninitialized instance and guides the host through a slick setup wizard to create the **Super User (Admin)** account and configure their AI model provider API keys.
2. **Professional Landing & Dashboard**: High-converting, modern dark-themed landing page showcasing featured templates, live interactive prompt bar, and user project dashboard.
3. **Autonomous Containerized AI Coding Agent**: A user describes an application in natural language, and an autonomous AI coding agent designs, creates, runs, tests, debugs, and iterates on that application inside isolated Docker containers.

---

## High-Level System Architecture

```text
                                ┌──────────────────────────────────────┐
                                │             Next.js UI               │
                                │   - Sleek Landing Page & Templates   │
                                │   - First-Time Superuser Onboarding  │
                                │   - 3-Pane Workspace (Files/Preview) │
                                │   - Monaco Editor & AI Chat Stream   │
                                └──────────────────┬───────────────────┘
                                                   │  HTTP / WebSocket / SSE
                                                   ▼
                                ┌──────────────────────────────────────┐
                                │          Main Server (API)           │
                                │   Auth / Superuser Setup Guard       │
                                │   Projects, Users, Conversations,    │
                                │  Agent Runs State Machine, DB Access │
                                └──────┬───────────┬───────────┬───────┘
                                       │           │           │
                     ┌─────────────────┘           │           └─────────────────┐
                     ▼                             ▼                             ▼
        ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
        │     packages/agent      │   │       packages/db       │   │    packages/sandbox     │
        │   AI Orchestration &    │   │ SQLite (Drizzle ORM) &  │   │  Docker Container Mgr   │
        │      Tool Engine        │   │  Superuser / App State  │   │  Lifecycle & Networking │
        └────────────┬────────────┘   └─────────────────────────┘   └────────────┬────────────┘
                     │                                                           │
                     ▼                                                           ▼
        ┌─────────────────────────┐                                 ┌─────────────────────────┐
        │       packages/ai       │                                 │     Docker Daemon       │
        │  Vercel AI SDK & Model  │                                 │  (Runner & Preview Containers)
        │       Providers         │                                 └─────────────────────────┘
        └─────────────────────────┘
```

---

## First-Time Self-Hosted Onboarding Flow

```text
Host runs `pnpm dev` or `docker compose up`
                    ↓
Client navigates to `http://localhost:3000`
                    ↓
Server check: Does a Super User exist in DB?
     /                                 \
   NO                                  YES
  /                                      \
Redirect to `/onboarding`             Render Landing Page / Dashboard
  - Create Superuser (Admin)            - Explore Templates
  - Set Master Password                 - Start Prompting
  - Input Default AI Provider Keys      - View Recent Projects
  - Validate Docker Connection
  - Initialize System Settings
                    ↓
Auto-login Superuser & Route to `/dashboard`
```

---

## Monorepo Structure (`pnpm` + `Turborepo`)

```text
loveable-clone/
├── apps/
│   ├── web/                     # Next.js 14+ Frontend UI (Landing, Onboarding Wizard, Projects Dashboard, IDE Workspace)
│   └── server/                  # Fastify / Node.js API Server, Auth guards, WebSocket & SSE Hub
├── packages/
│   ├── ai/                      # Provider abstractions (OpenAI, Anthropic, OpenRouter, Local Ollama)
│   ├── agent/                   # Agent loop state machine, prompt engineering, tool definitions & error patcher
│   ├── db/                      # SQLite schema (Users, Superuser, Settings, Projects), Drizzle ORM client
│   ├── sandbox/                 # Dockerode container lifecycle, volume mount manager, resource limiting
│   ├── runner/                  # Executable CLI/script running inside Docker runner container for builds/tests
│   ├── shared/                  # Shared TypeScript types, Zod schemas, auth types, UI constants
│   └── config/                  # Shared ESLint, Prettier, and TypeScript configurations
├── templates/
│   └── nextjs/                  # Known-good starter template (Next.js + Tailwind + TS + Lucide)
├── data/                        # Persistent volume root for SQLite database and project workspaces
│   ├── db.sqlite
│   └── projects/                # Isolated project workspaces (`project-xxx/`)
├── docker/
│   ├── runner/                  # Dockerfile for build & command execution runner image
│   └── preview/                 # Dockerfile for persistent dev preview server container image
├── steps/                       # Step-by-step implementation guide files
├── docker-compose.yml           # Production & local Docker setup
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── prd.md
```

---

## Step-by-Step Implementation Index

| Step | File Path | Phase Name | Focus Area |
| :--- | :--- | :--- | :--- |
| **01** | [`steps/01-monorepo-setup.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/01-monorepo-setup.md) | Monorepo Setup | Workspace initialization, Turborepo configs, shared packages, TS & build setup |
| **02** | [`steps/02-database-schema.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/02-database-schema.md) | Database & Auth Schema | SQLite + Drizzle ORM setup, superuser auth, system settings, project tables |
| **03** | [`steps/03-ai-provider-abstraction.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/03-ai-provider-abstraction.md) | AI Provider Abstraction | Vercel AI SDK integration, multi-provider config, streaming & validation |
| **04** | [`steps/04-project-workspace-templates.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/04-project-workspace-templates.md) | Project Workspace & Templates | Project directory manager, starter templates (`templates/nextjs`), file tree API |
| **05** | [`steps/05-docker-sandbox-manager.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/05-docker-sandbox-manager.md) | Docker Sandbox Engine | Dockerode integration, runner & preview container management, resource quotas |
| **06** | [`steps/06-ai-agent-engine-tools.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/06-ai-agent-engine-tools.md) | Autonomous Agent & Tools | Agent loop state machine, file editing, terminal tools, automated debugging loop |
| **07** | [`steps/07-runner-preview-containers.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/07-runner-preview-containers.md) | Runner vs Preview Containers | Container separation, dynamic port assignment, preview server reverse proxy |
| **08** | [`steps/08-server-web-ui.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/08-server-web-ui.md) | Landing Page, Onboarding & IDE UI | Superuser onboarding wizard, landing page, projects dashboard, 3-pane IDE UI |
| **09** | [`steps/09-git-checkpoints-rollback.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/09-git-checkpoints-rollback.md) | Git Checkpoints & Rollback | Workspace git repository initialization, commit-per-prompt, visual diff & restore |
| **10** | [`steps/10-docker-compose-self-hosting.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/10-docker-compose-self-hosting.md) | Self-Hosting & Docker Compose | `docker-compose.yml`, Docker socket security, `.env.example`, startup verification |
| **11** | [`steps/11-security-observability-testing.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/11-security-observability-testing.md) | Security, Observability & Hardening | Network isolation, secret redaction, token usage logs, E2E verification test suite |

---

## Execution Principles

1. **Incremental Implementation**: We will execute each step sequentially with full empirical verification before proceeding.
2. **Professional Product Polish**: The UI must look like a tier-1 modern SaaS product (dark mode, glassmorphic accents, fluid transitions, intuitive onboarding, and instant visual feedback).
3. **Frictionless Self-Hosting**: First-time users are seamlessly guided through a superuser setup wizard without needing to configure complex database seeds manually.
