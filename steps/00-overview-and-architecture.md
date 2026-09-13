# Master Architecture Blueprint & Implementation Roadmap

## Executive Overview

This document serves as the master blueprint for building **Loveable Clone (AI App Builder)** — an open-source, self-hostable AI coding platform inspired by Lovable and Bolt.new. The core concept: A user describes an application in natural language, and an autonomous AI coding agent designs, creates, runs, tests, debugs, and iterates on that application inside isolated Docker containers.

---

## High-Level System Architecture

```text
                                ┌──────────────────────────────────────┐
                                │             Next.js UI               │
                                │   (File Tree, Code Editor/Diff,      │
                                │   Live Preview, AI Chat & Logs)      │
                                └──────────────────┬───────────────────┘
                                                   │  HTTP / WebSocket / SSE
                                                   ▼
                                ┌──────────────────────────────────────┐
                                │          Main Server (API)           │
                                │   Projects, Users, Conversations,    │
                                │  Agent Runs State Machine, DB Access │
                                └──────┬───────────┬───────────┬───────┘
                                       │           │           │
                     ┌─────────────────┘           │           └─────────────────┐
                     ▼                             ▼                             ▼
        ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
        │     packages/agent      │   │       packages/db       │   │    packages/sandbox     │
        │   AI Orchestration &    │   │ SQLite (Drizzle ORM) &  │   │  Docker Container Mgr   │
        │      Tool Engine        │   │       Repositories      │   │  Lifecycle & Networking │
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

## Monorepo Structure (`pnpm` + `Turborepo`)

```text
loveable-clone/
├── apps/
│   ├── web/                     # Next.js 14+ Frontend UI (Chat, Workspace, File Explorer, Editor, Preview Iframe)
│   └── server/                  # Fastify / Express / Node.js API Server & WebSocket Hub
├── packages/
│   ├── ai/                      # Provider abstractions (OpenAI, Anthropic, OpenRouter, Local Ollama)
│   ├── agent/                   # Agent loop state machine, prompt engineering, tool definitions & error patcher
│   ├── db/                      # SQLite database schema, migrations, Drizzle ORM client, project repositories
│   ├── sandbox/                 # Dockerode container lifecycle, volume mount manager, resource limiting
│   ├── runner/                  # Executable CLI/script running inside Docker runner container for builds/tests
│   ├── shared/                  # Shared TypeScript types, schemas (Zod), constants, utility functions
│   └── config/                  # Shared ESLint, Prettier, and TypeScript configurations
├── templates/
│   └── nextjs/                  # Known-good starter template (Next.js + Tailwind + TS + Vite/App Router)
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
| **02** | [`steps/02-database-schema.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/02-database-schema.md) | Database & Schema | SQLite + Drizzle ORM setup, entity schemas, migrations, repositories |
| **03** | [`steps/03-ai-provider-abstraction.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/03-ai-provider-abstraction.md) | AI Provider Abstraction | Vercel AI SDK integration, multi-provider config, streaming & validation |
| **04** | [`steps/04-project-workspace-templates.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/04-project-workspace-templates.md) | Project Workspace & Templates | Project directory manager, starter templates (`templates/nextjs`), file tree API |
| **05** | [`steps/05-docker-sandbox-manager.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/05-docker-sandbox-manager.md) | Docker Sandbox Engine | Dockerode integration, runner & preview container management, resource quotas |
| **06** | [`steps/06-ai-agent-engine-tools.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/06-ai-agent-engine-tools.md) | Autonomous Agent & Tools | Agent loop state machine, file editing, terminal tools, automated debugging loop |
| **07** | [`steps/07-runner-preview-containers.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/07-runner-preview-containers.md) | Runner vs Preview Containers | Container separation, dynamic port assignment, preview server reverse proxy |
| **08** | [`steps/08-server-web-ui.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/08-server-web-ui.md) | Main Server & Web UI | Next.js 3-pane IDE layout, SSE/WebSocket agent stream, real-time file editor & preview |
| **09** | [`steps/09-git-checkpoints-rollback.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/09-git-checkpoints-rollback.md) | Git Checkpoints & Rollback | Workspace git repository initialization, commit-per-prompt, visual diff & restore |
| **10** | [`steps/10-docker-compose-self-hosting.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/10-docker-compose-self-hosting.md) | Self-Hosting & Docker Compose | `docker-compose.yml`, Docker socket security, `.env.example`, startup verification |
| **11** | [`steps/11-security-observability-testing.md`](file:///Users/macbookpro/Developer/startup/loveable-clone/steps/11-security-observability-testing.md) | Security, Observability & Hardening | Network isolation, secret redaction, token usage logs, E2E verification test suite |

---

## Execution Principles

1. **Incremental Implementation**: We will execute each step sequentially. After finishing a step, we gather empirical proof (build checks, tests, running commands) before declaring completion.
2. **No Arbitrary Host Code Execution**: Code generated by AI or requested commands MUST run inside Docker containers.
3. **V1 Simplicity**: Avoid over-engineering. Rely on SQLite, Docker API, standard AI SDKs, and local file storage.
