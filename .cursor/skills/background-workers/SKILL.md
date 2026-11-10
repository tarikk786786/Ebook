---
name: background-workers
description: Run chunked cover-recovery and hashing workers with SQLite checkpoints, retries, and pause/resume. Use for any 86k-scale batch — never inside a single HTTP request.
---

# Background workers

## Pattern

`scripts/run_cover_recovery_batch.py --pending-from-db` with chunked batches + `PYTHONUNBUFFERED=1`.

## Requirements

- Checkpoint in SQLite after each chunk
- Provider-specific rate limits / backoff
- Idempotent writes (same catalog_num safe to retry)
- Pause / resume / cancel via job status rows
- Dead-letter / failed status with error text
- One failing provider must not stop others

## Do not

- Load all pending rows into one ThreadPool for 60k+ items
- Hold a Next.js route open for full recovery
- Push worker secrets to the client
