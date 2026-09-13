# AI App Builder — Architecture & Implementation Research Report

## Context

I am building an open-source, self-hostable alternative inspired by products like Lovable.

This is primarily an **AI Engineer portfolio project**, but it should be engineered like a serious open-source product rather than a toy clone.

The goal is:

> A user describes an application in natural language, and an AI coding agent creates, runs, debugs, and iterates on that application inside an isolated Docker container.

The project must be:

- Open source
- Self-hostable
- Easy to install
- Lightweight
- Provider/model configurable
- Docker-based
- Securely sandboxed
- Modular
- Easy to extend
- Suitable for local development
- Suitable for a future production deployment

Do NOT start implementing the application yet.

First produce a detailed architecture/research report and step-by-step implementation plan.

---

# 1. Core Technology Direction

Research and recommend an architecture using:

- Next.js
- TypeScript
- Tailwind CSS
- pnpm
- Turborepo
- SQLite
- Docker
- Docker networking
- An AI Agent SDK
- Configurable AI model providers

The initial system should NOT require:

- PostgreSQL
- Redis
- Kafka
- Kubernetes
- Cloud-specific infrastructure
- External managed databases

The goal is to keep the default self-hosted installation simple.

Ideally:

```bash
pnpm install
pnpm dev
```

should be enough for development.

And a Docker-based installation should eventually be possible with something like:

```bash
docker compose up
```

---

# 2. High-Level Architecture

Design the system as several small modules instead of one huge Next.js application.

At minimum investigate these components:

```text
                    ┌─────────────────────┐
                    │      Next.js UI      │
                    │                     │
                    │ Chat / Files /      │
                    │ Preview / Terminal  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Main Application  │
                    │      Server/API     │
                    │                     │
                    │ Auth                │
                    │ Projects            │
                    │ Conversations       │
                    │ Agent orchestration │
                    │ Jobs                │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          ┌──────────┐   ┌──────────┐   ┌──────────┐
          │ AI/Agent │   │ Database │   │ Sandbox  │
          │ Runtime  │   │ SQLite   │   │ Manager  │
          └──────────┘   └──────────┘   └────┬─────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │ App Runner  │
                                      │ Docker      │
                                      │ Container   │
                                      └─────────────┘
```

Critically evaluate whether this separation is correct.

Recommend improvements.

---

# 3. Main Application

Design the main application/server.

It should be responsible for things such as:

- API
- authentication
- projects
- users
- conversations
- messages
- project metadata
- agent runs
- execution status
- container lifecycle
- logs
- database access
- provider configuration
- project state

Explain which responsibilities belong here and which should NOT belong here.

Avoid turning the main server into a giant monolith.

---

# 4. Next.js Frontend

Design the frontend architecture.

The UI should eventually have:

```text
┌─────────────────────────────────────────────┐
│                    Header                   │
├──────────────┬──────────────────────────────┤
│              │                              │
│   Project    │       Live Preview            │
│   Files      │                              │
│              │                              │
│   Explorer   │                              │
│              ├──────────────────────────────┤
│              │                              │
│              │       AI Chat                │
│              │                              │
│              │  "Add authentication..."     │
│              │                              │
└──────────────┴──────────────────────────────┘
```

Research the best way to implement:

- Streaming AI responses
- File tree
- Code editor
- Diff viewer
- Terminal/log viewer
- Preview iframe
- Agent status
- Tool execution status
- Build status
- Error messages
- Conversation history

Do not over-engineer the frontend initially.

Recommend which libraries are appropriate and why.

---

# 5. AI Agent Architecture

This is the most important part of the project.

Research the chosen Agent SDK and explain how it should be used.

The agent should be capable of:

```text
User Prompt
     ↓
Understand request
     ↓
Plan changes
     ↓
Inspect project
     ↓
Read files
     ↓
Create/edit files
     ↓
Install dependencies
     ↓
Run commands
     ↓
Build application
     ↓
Detect errors
     ↓
Analyze errors
     ↓
Fix errors
     ↓
Build again
     ↓
Run application
     ↓
Return result
```

Investigate:

- Tool calling
- Agent loops
- Planning
- Context management
- Tool permissions
- Model configuration
- Streaming
- Structured outputs
- Error handling
- Cancellation
- Timeouts
- Token/context limits
- Retry strategy
- Long-running agent runs

Explain whether we should use:

- One agent
- Planner + coder
- Planner + coder + debugger
- Supervisor architecture

Start with the simplest architecture that is still technically impressive.

---

# 6. Model Provider Abstraction

The application must allow the self-hosted user to configure their own AI provider.

The user should NOT need to modify source code.

For example:

```env
AI_PROVIDER=openai
AI_MODEL=...
OPENAI_API_KEY=...
```

or:

```env
AI_PROVIDER=anthropic
AI_MODEL=...
ANTHROPIC_API_KEY=...
```

or:

```env
AI_PROVIDER=openrouter
AI_MODEL=...
OPENROUTER_API_KEY=...
```

Research whether the chosen Agent SDK already provides a model abstraction.

Prefer using an existing standard abstraction instead of creating unnecessary custom provider code.

Design:

```text
                 AI Provider Interface
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       OpenAI        Anthropic      OpenRouter
```

Explain how adding another provider later should work.

Also investigate whether local models could eventually be supported.

---

# 7. Project Workspace

Every generated application should have its own project workspace.

Do NOT put generated applications directly inside the main source repository.

For example:

```text
/data/projects/

    project-001/
        src/
        package.json
        ...
        
    project-002/
        src/
        package.json
        ...
```

Research how project files should be stored.

Compare:

- Host filesystem
- Docker volumes
- Bind mounts
- Named volumes
- Object storage

Recommend the simplest architecture for self-hosting.

---

# 8. Docker Sandbox Architecture

This is extremely important.

Every generated application should run in an isolated Docker container.

The main application should NEVER execute arbitrary AI-generated commands directly on the host.

Instead:

```text
Main Server
     │
     │ Docker API
     ▼
Sandbox Manager
     │
     ▼
Docker Container
     │
     ├── Node.js
     ├── pnpm
     ├── Generated source
     ├── Dependencies
     └── Development server
```

Research:

- Container isolation
- CPU limits
- Memory limits
- Process limits
- Network restrictions
- Read-only filesystem
- Writable workspace
- Timeouts
- Container cleanup
- Resource quotas
- Container lifecycle
- Container naming
- Logs
- Exit codes

Identify security risks of allowing an AI coding agent to execute arbitrary shell commands.

Recommend practical mitigations.

Do not assume Docker alone makes arbitrary code execution completely safe.

---

# 9. New Container Per Prompt

This is an important architectural requirement.

I want the system to support the following workflow:

```text
User Prompt #1
      ↓
Create execution container
      ↓
Agent modifies project
      ↓
Build/test
      ↓
Container finishes
      ↓
Persist project changes
      ↓
Destroy container


User Prompt #2
      ↓
Create NEW execution container
      ↓
Mount/load SAME project state
      ↓
Agent continues development
      ↓
Build/test
      ↓
Persist changes
      ↓
Destroy container
```

Investigate whether this is the best architecture.

Explain:

- How the project state persists
- How source files are mounted
- Whether node_modules should persist
- Whether dependencies should be cached
- Whether a Docker volume should be reused
- Whether every prompt truly needs a fresh container
- Whether a persistent preview container should exist separately
- How to avoid slow dependency installation
- How to snapshot/restore project state

If you recommend a different design, explain why.

---

# 10. Docker Networking

I want the application containers to communicate through a dedicated Docker network.

Research an architecture such as:

```text
                    ai-builder-network
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
     Main Server      Preview/App       Runner
     Container         Container        Container
```

Determine:

- Which containers actually need network access
- Whether runner containers should have internet access
- How the preview reaches the browser
- How the main server communicates with containers
- Whether containers should communicate with each other
- DNS/service discovery
- Dynamic port allocation
- Reverse proxy requirements
- Security implications

Pay particular attention to the fact that generated applications are untrusted code.

---

# 11. Runner vs Preview

Investigate whether we should have separate concepts:

### Runner

Temporary container used for:

- Installing packages
- Running commands
- Building
- Testing
- Applying migrations
- Running agent-generated scripts

### Preview

Longer-lived container used for:

- Running the generated application
- Serving the application
- Providing the iframe preview

Potential architecture:

```text
                  Project
                     │
          ┌──────────┴──────────┐
          │                     │
       Runner                 Preview
    temporary              longer-lived
          │                     │
    build/test/fix          next dev/server
```

Determine whether this separation is worthwhile for V1.

---

# 12. Build Lifecycle

Design the complete lifecycle.

Example:

```text
PROMPT RECEIVED
       ↓
Create Agent Run
       ↓
Load project state
       ↓
Create sandbox container
       ↓
Initialize workspace
       ↓
Agent starts
       ↓
Tool calls
       ↓
Code changes
       ↓
Install dependencies
       ↓
Build
       ↓
Build fails?
     /       \
   YES        NO
    │          │
Analyze       Continue
error           │
    │           │
Patch           │
    └─────┬─────┘
          ↓
      Build again
          ↓
       Success
          ↓
Persist changes
          ↓
Update preview
          ↓
Destroy runner
          ↓
Complete
```

Define states such as:

```text
queued
starting
planning
coding
installing
building
debugging
testing
completed
failed
cancelled
```

---

# 13. Database

Use SQLite initially.

Research the best ORM/query layer.

Candidates:

- Drizzle
- Prisma
- SQLite directly

Prefer the option that gives the best balance of:

- simplicity
- TypeScript
- migrations
- self-hosting
- performance
- developer experience

Propose a schema for at least:

```text
users
projects
project_files / project_metadata
conversations
messages
agent_runs
agent_tool_calls
builds
containers
provider_configs
```

Explain whether actual file contents should live in SQLite or on the filesystem.

Prefer not putting large source files into SQLite unless there is a strong reason.

---

# 14. Monorepo Architecture

Use Turborepo + pnpm.

Propose something similar to:

```text
apps/
    web/
    server/

packages/
    ai/
    agent/
    db/
    sandbox/
    runner/
    shared/
    config/
```

Evaluate whether each package is actually necessary.

Do not create packages simply for the sake of having many packages.

Explain the dependency graph.

For example:

```text
web
 │
 └── server API

server
 ├── agent
 ├── sandbox
 ├── db
 ├── ai
 └── shared

agent
 ├── ai
 └── shared

sandbox
 └── shared

runner
 └── shared

db
 └── shared
```

---

# 15. Docker Architecture for Self Hosting

Design a production-oriented Docker Compose architecture.

Potentially:

```text
docker-compose.yml

services:

  app:
    Next.js / main application

  runner-manager:
    sandbox/container management

  ...
```

Determine whether the web and server should be:

- One container
- Separate containers

Also determine how the Docker daemon should be accessed.

Investigate:

- Docker socket
- Docker-outside-of-Docker
- Docker-in-Docker

Explain the security implications of:

```text
/var/run/docker.sock
```

and recommend the safest practical architecture for a self-hosted open-source project.

---

# 16. Installation Experience

The final project should eventually support:

### Development

```bash
pnpm install
pnpm dev
```

### Production

```bash
pnpm build
pnpm start
```

### Docker

```bash
docker compose up -d
```

A new user should be able to configure:

```env
AI_PROVIDER=
AI_MODEL=
AI_API_KEY=
```

without touching application code.

Research how `.env.example`, validation, defaults, and startup checks should work.

---

# 17. Security

Give this section serious attention.

The AI can generate arbitrary code.

Analyze threats including:

- malicious generated code
- shell commands
- filesystem escape
- Docker socket abuse
- container escape
- SSRF
- network scanning
- credential theft
- environment-variable leakage
- prompt injection through project files
- dependency attacks
- malicious npm packages
- infinite processes
- fork bombs
- excessive CPU
- excessive memory
- disk exhaustion
- outbound network abuse

Provide practical V1 mitigations and clearly separate:

```text
V1 security
V2 hardening
Production-grade future security
```

Do not claim the V1 sandbox is perfectly secure.

---

# 18. Observability

Design basic observability.

We should be able to see:

- Agent run
- Current state
- Tool calls
- Tool arguments
- Tool results
- Container logs
- Build logs
- Errors
- Duration
- Token usage if available
- Model/provider used

Recommend a simple implementation for V1 without requiring a large observability stack.

---

# 19. Git / Checkpoints

Research how project versions should work.

Potential approach:

```text
Prompt 1
   ↓
Checkpoint 1

Prompt 2
   ↓
Checkpoint 2

Prompt 3
   ↓
Checkpoint 3
```

Investigate whether each project should have a Git repository internally.

Git would potentially allow:

- diffs
- rollback
- checkpoints
- history
- restore
- debugging

Determine whether Git should be installed inside runner containers or managed by the main server.

---

# 20. AI Context / RAG

Do NOT automatically introduce a vector database.

Research whether V1 actually needs RAG.

The project needs to provide the agent with relevant context from:

- project files
- package.json
- configuration
- previous changes
- previous conversation
- errors
- project structure

Compare:

### Approach A

Full project files in context

### Approach B

File tree + selective file retrieval

### Approach C

Code search

### Approach D

Embeddings/vector search

Recommend the simplest architecture that scales reasonably.

---

# 21. MCP

Investigate whether MCP should be included in the architecture.

Potential future tools:

```text
GitHub MCP
Database MCP
Documentation MCP
Browser MCP
Custom MCP servers
```

Do not make MCP mandatory for V1.

Explain where it belongs architecturally.

---

# 22. Generated Application Stack

The initial generated applications can target:

- Next.js
- React
- TypeScript
- Tailwind CSS

Research whether the generated application should have a predefined template/starter.

For example:

```text
templates/
    nextjs/
```

The AI modifies a known-good starter instead of generating every project from zero.

Explain the advantages and disadvantages.

---

# 23. Performance

Analyze:

- Container startup time
- Dependency installation
- pnpm caching
- Docker image caching
- Build time
- Agent latency
- Streaming
- SQLite performance
- Concurrent agent runs

Recommend optimizations that don't unnecessarily complicate V1.

---

# 24. Repository Structure

Provide the final recommended repository tree.

Example:

```text
ai-app-builder/
│
├── apps/
│   ├── web/
│   └── server/
│
├── packages/
│   ├── agent/
│   ├── ai/
│   ├── db/
│   ├── sandbox/
│   ├── runner/
│   ├── shared/
│   └── config/
│
├── templates/
│   └── nextjs/
│
├── docker/
│   ├── runner/
│   └── preview/
│
├── data/
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── .env.example
└── README.md
```

Modify this if your research indicates a better structure.

---

# 25. Step-by-Step Implementation Plan

After completing the architecture research, create a concrete implementation roadmap.

Break it into phases.

For example:

## Phase 1 — Monorepo

- Turborepo
- pnpm
- Next.js
- Server
- Shared packages
- TypeScript

## Phase 2 — Database

- SQLite
- ORM
- migrations
- project schema

## Phase 3 — AI

- Agent SDK
- provider abstraction
- model configuration
- first coding agent

## Phase 4 — Project Workspace

- project creation
- filesystem
- file tree
- project state

## Phase 5 — Sandbox

- Docker
- runner
- container lifecycle
- limits
- networking

## Phase 6 — Agent Execution

- tools
- file editing
- terminal
- build
- error recovery

## Phase 7 — Preview

- generated application
- preview container
- dynamic ports
- iframe

## Phase 8 — UI

- chat
- files
- editor
- preview
- logs
- agent status

## Phase 9 — Checkpoints

- Git
- diffs
- rollback

## Phase 10 — Self Hosting

- Docker Compose
- environment configuration
- startup validation
- documentation

## Phase 11 — Security Hardening

- resource limits
- network restrictions
- secrets isolation
- sandbox hardening

---

# 26. Each Phase Must Include

For every phase provide:

1. Objective
2. Files/modules to create
3. Dependencies
4. Commands
5. Architecture decisions
6. Implementation order
7. Acceptance criteria
8. Testing strategy
9. Common mistakes
10. What should NOT be implemented yet

---

# 27. Important Engineering Rules

Follow these rules throughout the report:

- Do not over-engineer.
- Prefer boring, reliable infrastructure.
- Avoid unnecessary microservices.
- Keep self-hosting simple.
- Avoid external services unless optional.
- Never execute AI-generated commands directly on the host.
- Treat generated code as untrusted.
- Keep AI provider configuration separate from business logic.
- Keep generated projects separate from the builder source repository.
- Prefer existing standards/libraries over custom implementations.
- Do not add Redis/Kafka/Postgres unless there is a demonstrated requirement.
- Design for future scalability without implementing distributed infrastructure prematurely.
- Every architectural decision must have a reason.
- Clearly distinguish V1 from future architecture.

---

# 28. Final Deliverables

The report must finish with:

### A. Final architecture diagram

Use a clear ASCII diagram.

### B. Final repository tree

### C. Package dependency graph

### D. Docker/container architecture

### E. Network architecture

### F. Agent execution lifecycle

### G. Database schema

### H. Environment configuration

### I. Security model

### J. Complete implementation roadmap

### K. V1 feature boundary

Clearly state:

> "Build this in V1"

and:

> "Do NOT build this in V1"

### L. Recommended technology choices

For every major technology, provide:

```text
Technology:
Why:
Alternative:
Why not alternative:
```

### M. Architecture questions requiring decisions

At the very end, list any decisions that still require my approval before implementation.

Do NOT start coding.

The purpose of this task is to produce a technically rigorous architecture and implementation report that we can use as the master blueprint for building the project step by step.