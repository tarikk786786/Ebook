# AnonTrove Ebook Intelligence — Architecture (Gate 1)

**Date:** 2026-11-10  
**Rule:** Integrate into existing Next.js app; do not rebuild.

## 1. Existing stack (authoritative)

| Layer | Reality |
|-------|---------|
| Web | Next.js 14 App Router + TypeScript + Tailwind |
| Catalog | `lib/catalog.ts` + JSON registries + optional `master_86k_*.json` |
| Cover display | `/api/covers/[slug]` + `public/covers/` + `?v=` cache bust |
| Cover discovery lib | `lib/cover-recovery/` (Google Books–first matcher) |
| Cover job DB | `data/covers_86k.sqlite` (86,260 rows, resumable) |
| Enrichment DB | `data/enrichment_86k_checkpoint.db` (pricing/marketplace) |
| Dedupe DB | `data/dedupe_86k.sqlite` (file hashes, groups, quarantine) |
| CSV master | `public/all_ebooks_catalog.csv` (86,260) |
| File map | `data/catalog/catalog_file_map.json` (Index ↔ local paths) |
| Local storage | `private_storage/`, Telegram bot `storage/`, TG extract dir |
| Cloud storage | Supabase / R2 **not configured** — do not invent migration |
| Payments | FamGateway (do not touch) |
| Hosting | Vercel Hobby — **do not git-push tens of thousands of cover binaries** |
| Admin auth | `lib/auth/admin.ts` + `ADMIN_ACCESS_SECRET` |

## 2. Identity model (critical)

Never use title alone.

```
catalog_num  = CSV Index (covers_86k.catalog_num)
file_key     = normalized File Name
slug         = slugify(title) [display only]
sha256       = streaming hash of accessible file
ebook_id     = existing site id (book-{slug} / registry id)
```

Mapping pipeline:

`all_ebooks_catalog.csv` → `build_catalog_file_map.py` → `catalog_file_map.json`  
→ join `covers_86k` + optional enrichment `books.manifest_id`

## 3. Module → code ownership

| PRD module | Existing / planned ownership |
|------------|------------------------------|
| A Dashboard | **Extend** `/admin/cover-recovery` → `/admin/ebook-intelligence` |
| B Catalogue audit | `scripts/build_catalog_file_map.py` + `scripts/audit_cover_recovery_phase1.py` |
| C Local extraction | `scripts/lib_local_ebook_covers.py` (Calibre optional CLI, EPUB zipfile, PyMuPDF) |
| D Providers | `lib/cover-recovery/providers/google-books.ts` + Python batch remotes |
| E Matching | `lib/cover-recovery/matcher.ts` |
| F Assets | `public/covers/{catalogNum}.jpg` + API dark-synthetic reject |
| G Dedup | `scripts/dedupe_*.py` + `duplicate_suppression.json` filter in `lib/catalog.ts` |
| H Cover control | `/admin/cover-recovery` (expand) |
| I Workers | `scripts/run_cover_recovery_batch.py` (chunked, SQLite checkpoints) |
| J Dup review UI | **To build** `/admin/ebook-intelligence/duplicates` |
| K Settings | Env: `GOOGLE_BOOKS_API_KEY` (+ optional providers) |
| L Reports | `data/reports/*.csv` |

## 4. Data flow

```
CSV / local files
    │
    ├─► catalog_file_map.json
    │
    ├─► Local extract (HIGH if embedded cover valid)
    │         │
    │         ▼
    ├─► covers_86k.sqlite  status=found|pending|not_found|review
    │         │
    │         ├─► public/covers/{id}.jpg
    │         └─► cover_url_index_86k.json ──► /api/covers
    │
    └─► External providers (only if key + rate limits allow)
              Google Books → IA → OL
              confidence HIGH/MEDIUM/LOW
```

Duplicate path (separate):

```
Accessible files → SHA-256 (streaming) → HIGH groups
    → dry-run CSVs → admin approve → soft suppress + quarantine
    → lib/catalog.ts filters suppressed IDs
```

## 5. License / compliance notes

| Tool | Use in AnonTrove |
|------|------------------|
| Calibre (GPL) | **External CLI only** (`ebook-meta --get-cover`) |
| EbookLib (AGPL) | **Do not import into Next.js**; EPUB via stdlib zipfile/XML |
| PyMuPDF (AGPL) | Offline Python workers only (already used) |
| Open Library | Rate-limit; prefer dumps for bulk; no Covers API hammering |
| Google Books | Requires `GOOGLE_BOOKS_API_KEY` (anonymous → 429) |

## 6. Hosting constraints

- Vercel serverless ≠ long 86k jobs → keep heavy work in local/CI Python workers.
- Serve covers via `/api/covers` + remote CDN URLs in index; sync only selected JPEGs to git/deploy.
- Fail closed on missing secrets (`ADMIN_ACCESS_SECRET`, download encryption, FamGateway HMAC).

## 7. What already works (do not break)

- FamGateway checkout + webhook + AES download tokens
- Storefront BookCard / book detail cover pipeline
- Cover API local → index → remote → light SVG fallback
- Admin cover recovery stats API (`/api/admin/cover-recovery`)
- 100-book local pilot: **96/100 recovered** from accessible files

## 8. Immediate blockers

1. **`GOOGLE_BOOKS_API_KEY` empty** — pending remote recovery near-zero hit rate.
2. **Calibre not installed** — MOBI/AZW extraction optional until `winget install calibre.calibre`.
3. **Only ~3.5k CSV rows map to local files** — most of 86k need external covers or remain placeholders.
4. Dedupe `--apply` needs re-run after group_id uniqueness fix.
