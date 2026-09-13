# Step 10: Production Docker Compose Setup & Self-Hosting Validation

## 1. Objective
Create a complete, single-command self-hosting setup using `docker-compose.yml`, environment validation scripts, and pre-flight startup checks. Enable users to run the complete platform via `docker compose up -d`.

---

## 2. Files / Modules to Create
- `docker-compose.yml` (Production compose configuration linking main server, web app, SQLite storage, and Docker socket)
- `docker/app/Dockerfile` (Multi-stage Dockerfile compiling monorepo apps & packages for production container)
- `apps/server/src/utils/startup-check.ts` (Pre-flight startup validation verifying Docker socket connectivity, write permissions, and AI provider key setup)
- `.env.example` (Production environment template with clear defaults and comments)
- `scripts/healthcheck.sh` (Container health checking script)

---

## 3. Dependencies
- Docker Engine & Docker Compose v2

---

## 4. Commands to Run
```bash
docker compose up -d --build
docker compose logs -f
```

---

## 5. Architecture Decisions
- **Docker Socket Access (`/var/run/docker.sock`)**: To allow the main server container to create and manage sandbox runner containers, the main server mounts the host Docker socket `/var/run/docker.sock`.
- **Persistent Volume Mounts**: Host path `./data` is mounted to `/app/data` inside main app container, ensuring SQLite database and project workspace files persist across container restarts.

---

## 6. Implementation Order
1. Build production multi-stage `docker/app/Dockerfile`:
   - Stage 1 (Builder): Prunes monorepo workspace, installs dependencies, compiles TS & Next.js static builds.
   - Stage 2 (Runner): Production Node.js 20 runtime executing Fastify API server & Next.js application.
2. Draft `docker-compose.yml`:
   ```yaml
   version: '3.8'
   services:
     loveable:
       build:
         context: .
         dockerfile: docker/app/Dockerfile
       ports:
         - "3000:3000"
         - "3001:3001"
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock
         - ./data:/app/data
       environment:
         - NODE_ENV=production
         - AI_PROVIDER=${AI_PROVIDER:-openai}
         - OPENAI_API_KEY=${OPENAI_API_KEY}
       restart: unless-stopped
   ```
3. Implement `startup-check.ts`:
   - Tests `docker.ping()` connection.
   - Validates existence of valid AI model key.
   - Verifies read/write access to `data/` volume directory.

---

## 7. Acceptance Criteria
- Running `docker compose up -d` successfully builds and launches the application container.
- Navigating to `http://localhost:3000` opens the loveable-clone interface ready to receive prompts.
- Pre-flight check detects missing API keys or unmounted Docker sockets and outputs explicit setup instructions in stdout logs.

---

## 8. Testing Strategy
- Clean environment test: Run `docker compose up -d` on clean test VM/environment, execute sample prompt, verify sandbox runner container spawns and completes successfully.

---

## 9. Common Mistakes to Avoid
- Hardcoding host paths inside `docker-compose.yml` instead of relative `./data` paths.
- Omitting volume persistence for `data/db.sqlite`, resulting in database reset when containers restart.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT mandate complex external Kubernetes Helm charts or cloud infrastructure Terraform modules. Keep default installation as simple as `docker compose up`.
