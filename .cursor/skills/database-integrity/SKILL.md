---
name: database-integrity
description: Plan additive SQLite migrations and relationship-safe merges for covers, candidates, jobs, and duplicates. Use before schema changes or merge operations.
---

# Database integrity

## Databases

| DB | Role |
|----|------|
| `enrichment_86k_checkpoint.db` | Catalogue / pricing |
| `covers_86k.sqlite` | Cover job state |
| `dedupe_86k.sqlite` | File hashes / groups |

## Rules

- Additive tables preferred: cover_assets, cover_candidates, cover_jobs, duplicate_groups, merge_mappings, audit_logs, provider_cache.
- Transactions for merges; keep `rollback_data`.
- Indexes on catalog_num, status, sha256, isbn.
- Node access: `DatabaseSync` from `node:sqlite` only.
- Verify row counts before/after any bulk update.
