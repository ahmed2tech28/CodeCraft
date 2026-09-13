# Step 09: Git Checkpointing & Version Rollback

## 1. Objective
Implement local Git version control for every generated application inside `data/projects/{projectId}`. Automatically commit project state after every agent run, enable visual side-by-side diffing, and support one-click rollback to previous checkpoints.

---

## 2. Files / Modules to Create
- `apps/server/src/services/git.service.ts` (Simple-git or node-simple-git wrapper service)
- `apps/server/src/routes/checkpoints.ts` (GET /api/projects/:id/checkpoints, POST /api/projects/:id/rollback)
- `apps/web/src/components/workspace/CheckpointTimeline.tsx` (Timeline UI component displaying prompt history & revert buttons)
- `apps/web/src/components/workspace/DiffModal.tsx` (Side-by-side visual diff viewer between checkpoints)

---

## 3. Dependencies
- `simple-git`
- Dev Dependencies: `@types/simple-git`

---

## 4. Commands to Run
```bash
pnpm --filter @loveable/server test
```

---

## 5. Architecture Decisions
- **Local Git Repository Per Project**: Initialize a lightweight `.git` repository in `data/projects/{projectId}/` upon project creation.
- **Commit Per Prompt / Run**: Automatically execute a Git commit with message `[Checkpoint] <User Prompt>` immediately after an agent completes modifications.
- **Server-Managed Git**: Git commands run strictly on the host server (or within container) via controlled service wrappers, never exposing raw git parameters to user inputs.

---

## 6. Implementation Order
1. Implement `GitService` in `apps/server/src/services/git.service.ts`:
   - `initRepository(projectPath)`: Initializes git repo, creates `.gitignore` (ignoring `node_modules`, `.next`, `dist`).
   - `createCheckpoint(projectPath, commitMessage)`: Stages changes (`git add .`) and commits.
   - `getHistory(projectPath)`: Returns array of commit hashes, timestamps, messages, and file stats.
   - `getDiff(projectPath, commitHash)`: Returns git diff text / file patches between commits.
   - `rollbackToCheckpoint(projectPath, commitHash)`: Executes `git reset --hard <commitHash>` and cleans untracked files.
2. Hook `createCheckpoint()` directly into `AgentRunner` upon run completion.
3. Build `CheckpointTimeline` component in frontend UI allowing user to view revision history and trigger rollback.

---

## 7. Acceptance Criteria
- Initializing a project automatically runs `git init` and initial commit.
- Every successful agent run creates a clean Git commit checkpoint.
- Triggering rollback successfully reverts workspace source files to target commit state.

---

## 8. Testing Strategy
- Integration test creating test git repository, making file edit, committing checkpoint, reverting hard to initial commit, and asserting file contents matched original state.

---

## 9. Common Mistakes to Avoid
- Committing heavy build artifacts (`node_modules/`, `.next/`) into git repository history.
- Failing to verify workspace working directory cleanliness before performing checkout operations.

---

## 10. What Should NOT Be Implemented Yet
- Do NOT mandate external GitHub/GitLab authentication or cloud remote pushing for V1. Keep checkpoints local and zero-dependency.
