# OSS tool integration audit — AnonTrove cover recovery

Date: 2026-11-10  
Stack: Next.js 14 + SQLite (`node:sqlite`) + Python workers + `public/covers` + Telegram private storage

## Repository fit

| Project | License | Fit | Decision |
|---------|---------|-----|----------|
| [kovidgoyal/calibre](https://github.com/kovidgoyal/calibre) | GPL | `ebook-meta --get-cover` for EPUB/MOBI/AZW | **Use as optional external CLI only** (subprocess). Do not vendor Calibre source. |
| [AirplaneConcept/BookMeta](https://github.com/AirplaneConcept/BookMeta) | (app; inspect before copy) | ISBN scan from EPUB/PDF/MOBI + GB/OL enrichment + SQLite jobs | **Reimplement patterns** (ISBN regex, phased scan). Do not clone/deploy the Flask app. |
| [aloglu/bookshelf](https://github.com/aloglu/bookshelf) | MIT | Go shelf UI + ISBN→OL/GB cover fetch | **Skip deploy**. Borrow ISBN lookup UX ideas for admin only. |
| [kiwilan/php-ebook](https://github.com/kiwilan/php-ebook) | check upstream | PHP ebook metadata | **Skip** — stack is Node/Python, not PHP. |
| [aerkalov/ebooklib](https://github.com/aerkalov/ebooklib) | **AGPL** | EPUB cover + metadata | **Do not import into Next.js**. Prefer stdlib `zipfile`+XML for EPUB covers in workers. Optional: local AGPL worker only (same class as existing PyMuPDF scripts). |
| [pymupdf/PyMuPDF](https://github.com/pymupdf/PyMuPDF) | AGPL | PDF first-page render + text ISBN | **Already in use** (`scripts/render_covers_from_local_pdfs.py`). Keep in offline workers. |
| [vetnet183/book-metadata-mcp](https://github.com/vetnet183/book-metadata-mcp) | MIT | GB/OL scoring + cover selection | **Adapt scoring ideas** into `lib/cover-recovery/matcher.ts` / Python pilot. Do not require MCP runtime for production crawl. |

## Existing AnonTrove surface (reuse)

- DB jobs: `data/covers_86k.sqlite` (86,260 rows)
- Index: `data/catalog/cover_url_index_86k.json`
- API: `app/api/covers/[slug]/route.ts` + `lib/cover-recovery/`
- Admin: `/admin/cover-recovery`
- Local assets: `public/covers`, `public/book-covers`, `private_storage`

## Current coverage snapshot

See `data/reports/cover_recovery_phase1_audit.json` (regenerated).

## Safe integration plan

1. Local-first extract worker (Calibre CLI optional + zipfile EPUB + PyMuPDF PDF + ISBN).
2. External discovery only for misses (Google Books key → IA → OL), confidence gate.
3. Never overwrite `cover_status=manual` / verified high-confidence covers.
4. 100-book pilot → accuracy report → scale.
