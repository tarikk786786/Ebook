# Ebook Cover Recovery — Live Status

Updated: 2026-11-10

## Honest coverage (no inflated claims)

| Metric | Value |
|--------|------:|
| Catalog rows | 86,260 |
| Found + linked (verified) | ~11.4k+ (rising with batch) |
| Pending | ~74k |
| Not found (attempted miss) | ~0.8k |
| Local ebook files mapped | ~3.5k of 86k |
| Google Books API key | **MISSING** (required for best remote recall) |

Do **not** claim 100% recovery. Many catalog titles are custom courses, Telegram extracts, bundles, and editions without public cover art.

## What is implemented

1. **CSV → DB identity map** — `catalog Index` + `File Name` (never title alone) via `scripts/build_catalog_file_map.py`
2. **Local extract** — EPUB OPF/zipfile, PyMuPDF PDF, optional Calibre CLI (`scripts/lib_local_ebook_covers.py`)
3. **Providers** — Google Books (when key set), Open Library Search API, Internet Archive
4. **Confidence** — HIGH (ISBN/local), MEDIUM (title/author remote), LOW (rejected / miss)
5. **Storage** — `public/covers/{catalog_num}.jpg` + `data/covers_86k.sqlite` + `cover_url_index_86k.json`
6. **Queue controls** — `scripts/cover_worker_control.py` + admin API `/api/admin/cover-recovery/control`
7. **Admin UI** — `/admin/cover-recovery` (Ebook Image Scraping Center)
8. **Reports** under `data/reports/`:
   - `ebook_cover_results.csv`
   - `missing_covers.csv`
   - `failed_image_downloads.csv`
   - `manual_review.csv`
   - `duplicate_cover_images.csv`
   - `cover_source_statistics.csv`

## Critical blocker

Set in `.env.local` and Vercel:

```env
GOOGLE_BOOKS_API_KEY=your_key_here
```

Create the key at https://console.cloud.google.com/apis/credentials (Books API only).

## Safe worker commands

```bash
# Controlled batch (preferred)
python scripts/run_cover_recovery_batch.py --pending-from-db --limit 400 --workers 2

# Full remote identity resolve + download thumbs
python scripts/fetch_all_86k_covers.py --always-download --workers 4 --export-every 100

# Reports
python scripts/generate_cover_reports.py
python scripts/export_cover_index.py

# Pause / resume
python scripts/cover_worker_control.py pause
python scripts/cover_worker_control.py resume
```

## Matching safety

- Never overwrite `manual` / admin-approved covers.
- Never attach covers from ambiguous slug filename collisions.
- Only auto-save sufficiently verified images; MEDIUM confidence stays reviewable.
- Original ebook files and download links are never altered.
