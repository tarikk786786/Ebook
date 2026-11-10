---
name: book-metadata-research
description: Search authorized book metadata providers (Google Books, Open Library, Internet Archive) for cover candidates. Use when local extraction fails or enrichment needs ISBN/title/author matches.
---

# Book metadata research

## Order

1. Local extract (if file present)
2. Google Books with `GOOGLE_BOOKS_API_KEY`
3. Internet Archive
4. Open Library (rate-limited; no Covers API bulk crawl)

## Code

- TS: `lib/cover-recovery/providers/`
- Python batch remotes in cover recovery scripts

## Rules

- Cache responses; backoff on 429.
- Isolate provider failures.
- Return source id, URL, attribution, rate-limit hints.
- Optional Hardcover/ISBNdb adapters must not be required.
- Never scrape Amazon/other retailer HTML for covers.
