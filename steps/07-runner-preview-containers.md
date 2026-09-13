# Step 07: Execution Runner & Live Preview Container Manager

## 1. Objective
Implement the distinct container architecture separating temporary **Runner** containers (used for fast command execution, package installation, and builds) from persistent **Preview** containers (used for serving the generated application dev server live via iframe).

---

## 2. Files / Modules to Create
- `docker/preview/Dockerfile` (Base container image configured to run persistent dev server)
- `apps/server/src/services/preview-manager.ts` (Manages preview container creation, dynamic port mapping, and health checking)
- `apps/server/src/routes/preview-proxy.ts` (Reverse proxy route in server forwarding iframe traffic to preview container port)

---

## 3. Dependencies
- `http-proxy` or `@fastify/http-proxy` (For forwarding HTTP/WebSocket preview traffic)
- `@loveable/sandbox`

---

## 4. Commands to Run
```bash
docker build -t loveable-preview:latest -f docker/preview/Dockerfile .
pnpm --filter @loveable/server test
```

---

## 5. Architecture Decisions
- **Runner vs Preview Separation**:
  - **Runner Container**: Created on demand for agent runs. Executes `pnpm install`, `pnpm build`, `pnpm test`, then exits.
  - **Preview Container**: Long-lived container per active project session. Executes `pnpm dev` on port 3000, mounted to `data/projects/{projectId}` so Vite/Next HMR hot updates render instantly in the UI preview iframe.
- **Dynamic Port Proxying**: Instead of opening arbitrary ports directly on host public interface, the main server proxies preview requests through `/preview/{projectId}/` endpoints using internal Docker network DNS or host port allocation.

---

## 6. Implementation Order
1. Build `docker/preview/Dockerfile`:
   - Configured with Node.js 20, pnpm, exposing port 3000.
2. Implement `PreviewManager`:
   - `startPreview(projectId)`: Starts preview container running `pnpm dev --host 0.0.0.0` bound to workspace directory.
   - `stopPreview(projectId)`: Gracefully stops preview server when project session closes.
   - `getPreviewUrl(projectId)`: Returns local proxy preview URL.
3. Configure `preview-proxy.ts` in `apps/server`:
   - Strips `/preview/{projectId}` prefix and proxies requests to preview container host & port.

---

## 7. Acceptance Criteria
- Starting a project preview launches preview container running target app dev server.
- Requesting `http://localhost:3001/preview/{projectId}` renders generated application frontend index page.
- File changes made by agent update preview in real-time via Vite/Next.js HMR.

---

## 8. Testing Strategy
- Start preview server on test project template, execute HTTP GET request against proxy endpoint, verify HTML response contains expected template title.

---

## 9. Common Mistakes to Avoid
- Exposing container ports directly without proxy authorization checks.
- Hardcoding host port numbers causing collisions when multiple project previews run concurrently.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT build cloud domain routing or Kubernetes ingress controllers. Local dynamic port proxying is optimal for V1 self-hosting.
