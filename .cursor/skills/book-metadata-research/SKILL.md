---
name: book-metadata-research
description: Search authorized book metadata providers (Google Books, Open Library, Internet Archive) for cover candidates. Use when local extraction fails or enrichment needs ISBN/title/author matches.
---

# Book metadata research

## Order

1. Local extract (if file present)
2. Google Books with `GOOGLE_BOOKS_API_KEY`
3. Open Library Search + Covers
4. Internet Archive texts search
5. Wikimedia Commons (book cover files)
6. Library of Congress books JSON (when image fields exist)

## Code

- TS: `lib/cover-recovery/providers/`
- Python: `scripts/lib_free_cover_providers.py` + `scripts/run_cover_recovery_batch.py`
- Extra adapters: `scripts/cover_discovery/providers/` (Wikimedia, Crossref, IA, OL, GB)

## Rules

- Cache responses; backoff on 429.
- Isolate provider failures.
- Return source id, URL, attribution, rate-limit hints.
- Optional Hardcover/ISBNdb adapters must not be required.
- Never scrape Amazon/other retailer HTML for covers.
