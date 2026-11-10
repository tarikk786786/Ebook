---
name: catalogue-profiler
description: Profile the 86k all_ebooks_catalog.csv for integrity, repeated titles, and filename collisions. Use before import, audit dashboards, or duplicate detection.
---

# Catalogue profiler

## Inputs

- `public/all_ebooks_catalog.csv`
- Optional: `data/catalog/catalog_file_map.json`

## Rules

- Detect encoding (UTF-8 / BOM) and delimiter.
- Validate columns: Index, Title, Author, Category, Format, Pages, File Name.
- Report distinct titles, repeated-title row counts, repeated filenames.
- **Never recommend title-only deletion** — different pages/filenames can be legitimate.
- Map CSV Index → existing DB IDs without creating duplicate records.

## Commands

```bash
python scripts/build_catalog_file_map.py
# or a one-off profiler writing data/reports/catalogue_audit.csv
```

## Output

`data/reports/catalogue_audit.csv` plus summary metrics matching Gate 1 facts.
