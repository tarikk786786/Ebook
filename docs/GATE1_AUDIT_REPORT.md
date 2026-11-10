# Gate 1 — Repository & Catalogue Audit Report

**Date:** 2026-11-10  
**Scope:** Read-only audit + planning artifacts. No 86k migration performed in this gate.

## Catalogue CSV (`public/all_ebooks_catalog.csv`)

| Check | Result |
|-------|--------|
| Row count | 86,260 |
| Columns | Index, Title, Author, Category, Format, Pages, File Name |
| Distinct titles | 16,501 |
| Rows in repeated-title sets | ~70,758 |
| Distinct titles that repeat | 999 |
| Repeated filenames | 9 |
| Completely identical rows | 0 |

**Integrity warning:** Title collision is common; automatic title-based deletion would destroy legitimate editions/volumes/formats.

## Cover recovery state (`covers_86k.sqlite`)

| Status | Approx. count |
|--------|---------------|
| found | 24,247 |
| pending | 61,151 |
| not_found | 862 |

Local pilot (100 books with accessible files): **96/100** HIGH via embedded extract.

Local file map coverage: ~3.5k CSV rows match accessible disk paths — most pending covers need providers or remain placeholders.

## Stack confirmed

- Next.js 14 App Router storefront + FamGateway payments (do not rebuild)
- Cover API + `public/covers` + URL index
- Python workers for batch recovery and SHA-256 dedupe
- Vercel Hobby — unsuitable for in-request 86k jobs; avoid bulk binary git pushes

## Blockers for Gate 2+

1. `GOOGLE_BOOKS_API_KEY` not set → remote discovery ineffective
2. Calibre optional for MOBI/AZW
3. Dedupe soft-apply pending after `group_id` uniqueness fix
4. Admin duplicate review UI not built yet

## Deliverables produced this gate

| Artifact | Path |
|----------|------|
| PRD | `docs/PRD.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Checklist | `docs/IMPLEMENTATION_CHECKLIST.md` |
| This audit | `docs/GATE1_AUDIT_REPORT.md` |
| Cursor rules | `.cursor/rules/*.mdc` (6) |
| Cursor skills | `.cursor/skills/*/SKILL.md` (14) |

## Recommended next gate

Gate 2: 100-book pilot with GB key (when available) + finish dedupe `--apply` dry-run review → soft suppress. Do **not** start full 61k remote crawl until pilot precision is recorded.
