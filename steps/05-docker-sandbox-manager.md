# Step 05: Docker Sandbox Architecture & Container Lifecycle Manager

## 1. Objective
Design and implement the Docker container sandbox management engine in `packages/sandbox`. Provide secure execution environments for untrusted AI-generated code with strict CPU, memory, process limits, bind mounts, and networking rules.

---

## 2. Files / Modules to Create
- `docker/runner/Dockerfile` (Base container image with Node.js 20, pnpm, git, build essentials)
- `packages/sandbox/package.json`
- `packages/sandbox/src/types.ts` (Container options, resource quota limits, execution logs)
- `packages/sandbox/src/docker-client.ts` (Dockerode wrapper and socket connection manager)
- `packages/sandbox/src/container-manager.ts` (Container creation, start, stop, kill, and removal logic)
- `packages/sandbox/src/executor.ts` (Command execution inside running container via `docker exec`)
- `packages/sandbox/src/index.ts`

---

## 3. Dependencies
- `dockerode`
- Dev Dependencies: `@types/dockerode`

---

## 4. Commands to Run
```bash
docker build -t codecraft-runner:latest -f docker/runner/Dockerfile .
pnpm --filter @codecraft/sandbox test
```

---

## 5. Architecture Decisions
- **Docker API Driver**: Use `dockerode` to interact directly with the local Docker daemon (`/var/run/docker.sock` or TCP socket).
- **Isolation Quotas**:
  - CPU Limit: Maximum 2 CPU cores (`NanoCPUs: 2000000000`)
  - RAM Limit: Maximum 1 GB RAM (`Memory: 1073741824`)
  - Process Limit: Maximum 256 PIDs (`PidsLimit: 256`)
- **Bind Mount Storage**: Mount host path `data/projects/{projectId}` to `/app` inside container. Source changes persist on host filesystem automatically.

---

## 6. Implementation Order
1. Write `docker/runner/Dockerfile`:
   - Use official `node:20-alpine` image.
   - Install `pnpm`, `git`, `python3`, `make`, `g++`.
   - Set working directory `/app`.
2. Build runner Docker image `loveable-runner:latest`.
3. Implement `ContainerManager` in `packages/sandbox`:
   - `createContainer(projectId, options)` -> Spawns container with custom limits & bind mount.
   - `execCommand(containerId, command, timeoutMs)` -> Runs shell command (e.g. `pnpm install`, `pnpm build`), streams stdout/stderr, handles timeout termination.
   - `removeContainer(containerId)` -> Gracefully stops and removes container instance.

---

## 7. Acceptance Criteria
- `execCommand` runs `pnpm --version` inside container and captures stdout.
- Resource limits prevent container memory/CPU abuse.
- If a command exceeds `timeoutMs` (e.g. infinite loop), container execution is cancelled safely without hanging host process.

---

## 8. Testing Strategy
- Integration test in `packages/sandbox/src/__tests__/container.test.ts` creating a container, running `echo "hello sandbox"`, verifying output, and cleaning up container.

---

## 9. Common Mistakes to Avoid
- Leaving orphaned containers running in background when process errors or exits.
- Allowing container root process to access arbitrary host directories (always scope bind mount strictly to project directory).

---

## 10. What Should NOT Be Implemented Yet
- Do NOT expose container execution directly to web users via unauthenticated HTTP endpoints. Keep all execution calls wrapped within server control loops.
