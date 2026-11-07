# RECOVERY INSTRUCTIONS — RESTART PROTOCOL

If any session is interrupted or closed, follow this deterministic recovery procedure:

1. **Verify Root Directory**:
   - Primary Workspace: `C:\Users\tarik\Downloads\TG`
   - Primary Application: `C:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks`
   - Master Control System: `/PROJECT_CONTROL/` in both workspace directories.

2. **Load Project Memory**:
   - Read `/PROJECT_CONTROL/PROJECT_STATE.json` for current phase, last commit, and recommended next action.
   - Read `/PROJECT_CONTROL/TASK_QUEUE.md` for prioritized pending work.
   - Read `/PROJECT_CONTROL/BLOCKED_TASKS.md` to avoid halting on known blocked credentials.

3. **Check Git Status**:
   ```bash
   git -C "C:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks" status
   ```

4. **Verify Application Health**:
   ```bash
   npm --prefix "C:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks" run build
   ```

5. **Resume Execution**:
   - Pick the highest priority unblocked task from `TASK_QUEUE.md`.
   - Update `PROJECT_STATE.json` to reflect `IN_PROGRESS`.
   - Complete task, run tests, update `PROJECT_CONTROL`, and record progress in `SESSION_HISTORY.md`.
