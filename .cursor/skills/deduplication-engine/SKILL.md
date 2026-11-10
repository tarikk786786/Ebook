---
name: deduplication-engine
description: Detect exact SHA-256 duplicate ebook files and soft-suppress with quarantine. Use for duplicate review; never title-only deletes.
---

# Deduplication engine

## Allowed automatic action

Exact binary duplicates (SHA-256 HIGH) → soft-suppress + quarantine after `--apply` with unique `group_id`.

## Forbidden

- Delete because titles match
- Treat different volumes/editions/formats as duplicates without review
- Hard-delete unique files without admin approval

## Scripts

```bash
python scripts/dedupe_init_db.py
python scripts/dedupe_hash_ebook_files.py
python scripts/dedupe_detect_and_remove.py          # dry-run
python scripts/dedupe_detect_and_remove.py --apply  # soft remove
```

## Catalog integration

Write `duplicate_suppression.json`; filter in `lib/catalog.ts`. Preserve purchases, favourites, downloads via mapping — never break storefront IDs without rollback_data.
