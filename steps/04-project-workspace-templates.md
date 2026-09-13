# Step 04: Project Workspace Management & Starter Templates

## 1. Objective
Build the workspace filesystem manager that initializes, reads, updates, and structures isolated generated applications inside `data/projects/project-id/`. Create a clean starter Next.js + Tailwind CSS + TypeScript template under `templates/nextjs/`.

---

## 2. Files / Modules to Create
- `templates/nextjs/` (Pre-configured Vite/Next.js starter app with Tailwind, Lucide icons, TS config)
- `packages/shared/src/workspace-types.ts` (File node tree interfaces, read/write payload schemas)
- `apps/server/src/services/workspace.service.ts` (Workspace CRUD, file reading, file editing, directory traversal)
- `apps/server/src/services/template.service.ts` (Template copying service from `templates/nextjs` to target project directory)

---

## 3. Dependencies
- `fs-extra` (Node.js file system utilities)
- `globby` or `fast-glob` (Efficient file tree indexing)

---

## 4. Commands to Run
```bash
pnpm --filter @loveable/server test
```

---

## 5. Architecture Decisions
- **Template-Based Scaffolding**: Instead of generating projects from absolute scratch (which is slow and error-prone), the platform copies a battle-tested, pre-configured Next.js/React standard starter template (`templates/nextjs/`).
- **File System Isolation**: Each generated project lives strictly within `data/projects/{projectId}`. The application enforces path traversal safeguards (`path.resolve` verification against target root).

---

## 6. Implementation Order
1. Construct standard starter template in `templates/nextjs/`:
   - `package.json` with React, Tailwind CSS, Lucide icons, TypeScript, Vite/Next.js setup.
   - Core `src/App.tsx` or `src/app/page.tsx` base entry.
   - Clean, minimal component directory.
2. Implement `TemplateService` to clone `templates/nextjs/` into `data/projects/{projectId}/`.
3. Implement `WorkspaceService`:
   - `getFileTree(projectId)` -> Returns JSON tree structure of workspace files (ignoring `node_modules`, `.git`, `.next`).
   - `readFile(projectId, filePath)` -> Returns string content of requested file.
   - `writeFile(projectId, filePath, content)` -> Creates/overwrites target file safely.
   - `deleteFile(projectId, filePath)` -> Removes file/directory safely.

---

## 7. Acceptance Criteria
- Creating a project successfully provisions `data/projects/{projectId}/` populated with starter files.
- `getFileTree()` generates a nested JSON object reflecting exact workspace layout.
- Path traversal attacks like `readFile(id, "../../../etc/passwd")` are detected and blocked.

---

## 8. Testing Strategy
- Unit test `WorkspaceService` path isolation rules to ensure attempts to read outside project root throw explicit path security exceptions.

---

## 9. Common Mistakes to Avoid
- Including `node_modules` in file tree scanning, causing high CPU/memory overhead.
- Mutating host application files when editing user project files.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT invoke Docker containers or package installation scripts inside this step. Focus purely on host filesystem workspace management.
