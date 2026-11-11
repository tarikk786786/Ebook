# Ebook Cover Recovery — Live Status

Updated: 2026-11-11

## Honest coverage (no inflated claims)

| Metric | Value |
|--------|------:|
| Catalog rows | 86,260 |
| Found + linked | ~7,000+ real (after placeholder purge) |
| Pending | ~78k |
| Not found | ~0.9k |
| Local ebook files mapped | ~3,576 of 86k |
| Quarantined duplicate placeholders | **5,525** identical fake JPEGs removed |
| Google Books API key | **MISSING** (required for best remote recall) |

Do **not** claim near-complete recovery. Most of the catalogue has no local file and no GB key for remote lookup.

## What was wrong (2026-11-11)

Thousands of books shared the **same binary JPEG** (8 placeholder hashes, 50–1794 copies each). The storefront looked “covered” but images were identical dark/synthetic templates — not real book covers.

### Fix applied

1. Quarantined mass-duplicate placeholders → `data/quarantine/placeholder_covers/`
2. Reset those DB rows to `pending`
3. Cover API now rejects known placeholder SHA-256 prefixes
4. Fixed `--require-local` so pending-from-db actually filters to mapped files
5. Re-extracted **294** covers from local ebook files
6. Client cache bust `?v=10`

## Critical blocker

```env
GOOGLE_BOOKS_API_KEY=your_key_here
```

Without this key, remote recovery for the remaining ~78k pending titles will stay near-zero.

## Safe worker commands

```bash
python scripts/quarantine_duplicate_placeholder_covers.py
python scripts/run_cover_recovery_batch.py --pending-from-db --require-local --limit 0 --workers 4 --no-remote
python scripts/backfill_covers_free_apis.py --limit 300 --workers 3
python scripts/run_cover_recovery_batch.py --pending-from-db --limit 400 --workers 2
```
