---
name: repo-audit
description: Audit the existing AnonTrove website stack before Ebook Intelligence changes. Use when starting a new phase, mapping storage/DB/routes, or verifying what already works.
---

# Repo audit

## When to use

Before any schema write, cover migration, or admin rebuild.

## Steps

1. Read `docs/PRD.md` and `docs/ARCHITECTURE.md`.
2. Map routes under `app/`, libs under `lib/`, workers under `scripts/`.
3. Confirm DBs: `data/covers_86k.sqlite`, `data/enrichment_86k_checkpoint.db`, `data/dedupe_86k.sqlite`.
4. Confirm cover path: `app/api/covers/[slug]/route.ts`, `public/covers/`, `cover_url_index_86k.json`.
5. Confirm catalog CSV: `public/all_ebooks_catalog.csv` (expect 86,260 rows).
6. List what must not break: FamGateway, download tokens, `lib/catalog.ts` suppression filter.
7. Output a short findings note — no mock stats; cite real counts from SQLite/CSV.

## Output

- Stack table (frontend/backend/DB/storage/hosting)
- Cover/dedupe job status counts
- Blockers (missing API keys, missing Calibre, local file coverage)
