# AnonTrove — Ebook Intelligence & Cover Recovery Platform

**PRD v1.0 · Status: Gate 1 — Audit & architecture (implementation planning)**

## Product vision

Transform the existing AnonTrove ebook website into a professional catalogue with verified covers, safe duplicate management, background enrichment, and a premium admin experience — **without rebuilding the storefront**.

**Principle:** Accuracy first, automation second, attractive presentation always.

## Catalogue facts (verified 2026-11-10)

| Metric | Value |
|--------|-------|
| CSV rows (`public/all_ebooks_catalog.csv`) | **86,260** |
| Columns | Index, Title, Author, Category, Format, Pages, File Name |
| Distinct titles | **16,501** |
| Rows whose title appears more than once | **~70,758** |
| Distinct titles that repeat | **999** |
| Repeated filenames | **9** |
| Completely identical CSV rows | **0** (none) |

**Critical rule:** Never delete or merge solely because titles match. Different page counts, filenames, volumes, editions, and formats can be legitimate distinct assets.

## Cover job status (live `covers_86k.sqlite`)

| Status | Count |
|--------|------:|
| found | ~24,247 |
| pending | ~61,151 |
| not_found | ~862 |

## Primary objectives

1. Audit all 86,260 records against DB + storage.
2. Extract embedded covers from accessible ebook files.
3. Discover missing covers via authorized providers (Google Books → Open Library → Internet Archive; optional Hardcover/ISBNdb).
4. Match with confidence scores; never attach unrelated covers.
5. Store images in existing `public/covers` + `/api/covers` conventions.
6. Detect exact-file and metadata duplicates with dry-run + admin approval.
7. Soft-merge with backup/rollback; quarantine files (no immediate hard delete).
8. Admin Ebook Intelligence Center with real metrics.
9. Preserve payments, downloads, memberships, and original ebook files.

## Modules (summary)

| ID | Module | Admin route (target) |
|----|--------|----------------------|
| A | Ebook Intelligence Dashboard | `/admin/ebook-intelligence` |
| B | Catalogue Audit Engine | CSV → DB mapping |
| C | Original Cover Extraction | Calibre CLI / zipfile EPUB / PyMuPDF |
| D | Multi-source Cover Discovery | Provider adapters |
| E | Intelligent Matching | ISBN → title+author confidence |
| F | Image Quality & Assets | Validate, hash, optional WebP |
| G | Duplicate Detection | SHA-256 + review UI |
| H | Cover Recovery Control Center | `/admin/ebook-intelligence/covers` |
| I | Background Job Orchestrator | Chunked Python workers + SQLite |
| J | Duplicate Review UI | `/admin/ebook-intelligence/duplicates` |
| K | Provider & Storage Settings | `/admin/ebook-intelligence/settings` |
| L | Reports & Exports | CSV under `data/reports/` |

## Confidence model (initial)

| Signal | Weight |
|--------|-------:|
| ISBN match | 50 |
| Exact title | 20 |
| Author match | 15 |
| Edition/volume | 10 |
| Publisher/year | 5 |

Thresholds (calibrate in 100-book pilot): **95–100** auto HIGH; **80–94** review; **&lt;80** reject auto-assign.

## Out of scope

- Rebuilding the website or replacing payment/auth.
- Title-only deletion.
- Overwriting manually approved covers.
- DRM bypass / retailer scraping.
- Hard-deleting uncertain duplicates without admin approval.

## Execution gates

1. **Audit + architecture** ← current
2. Isolated 100-record pilot (covers + mapping)
3. Verify image accuracy + storage paths
4. Duplicate dry-run
5. Admin approvals + rollback
6. E2E tests
7. Progressive rollout

## Related docs

- `docs/ARCHITECTURE.md` — stack map and module ownership
- `docs/IMPLEMENTATION_CHECKLIST.md` — phased build checklist
- Existing: `docs/MASTER_ARCHITECTURE.md`, `docs/SECURITY_GUIDE.md`
