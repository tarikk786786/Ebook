# Ebook Intelligence — Implementation Checklist

Maps PRD modules to existing code. Check off only with evidence (script output / test log).

## Gate 1 — Audit & architecture ✅ (docs)

- [x] Verify CSV: 86,260 rows, 7 cols, 16,501 distinct titles, 9 repeated filenames
- [x] Confirm no identical full CSV rows; title-only delete forbidden
- [x] Cover DB snapshot: found / pending / not_found
- [x] Write `docs/PRD.md`
- [x] Write `docs/ARCHITECTURE.md`
- [x] Write this checklist
- [x] Add `.cursor/rules` + core skills (6 rules, 14 skills)
- [x] Write `docs/GATE1_AUDIT_REPORT.md`

## Gate 2 — 100-book pilot

- [x] Local extract pilot (`data/cover_pilot_100.json`) — 96/100 HIGH
- [ ] Re-run pilot with GB key when available; measure precision ≥98%
- [ ] Document false positives in `data/reports/pilot_review.csv`

## Gate 3 — Image accuracy & storage

- [x] `public/covers/{catalogNum}.jpg` + `/api/covers` dark-synthetic reject
- [x] `cover_url_index_86k.json` dual lookup (slug + catalog_num)
- [ ] Never overwrite `source=manual` / approved covers
- [ ] Rights/attribution columns on cover assets (additive migration)

## Gate 4 — Duplicate dry-run

- [x] `dedupe_init_db.py` + `dedupe_hash_ebook_files.py` (~8409 hashed)
- [x] Detect HIGH SHA-256 groups (~3191 hash groups; 643 auto-eligible)
- [x] Fix `group_id` uniqueness → re-run `dedupe_detect_and_remove.py --apply`
- [x] Soft-suppress via `duplicate_suppression.json` (369 suppressed, 505 quarantined)
- [ ] Admin duplicate review UI (no hard delete)

## Gate 5 — Approvals & rollback

- [ ] Cover candidate approve/reject API + audit log
- [ ] Merge mapping + rollback_data for approved dupes
- [ ] Quarantine path only after admin confirm

## Gate 6 — E2E / security

- [ ] `node tests/master_system_verification.mjs`
- [ ] `node tests/security_regression_suite.mjs`
- [ ] Admin auth on all `/admin/ebook-intelligence*` routes
- [ ] SSRF guards on remote cover fetch

## Gate 7 — Progressive rollout

- [ ] Set `GOOGLE_BOOKS_API_KEY` locally + Vercel
- [ ] Chunked `run_cover_recovery_batch.py --pending-from-db`
- [ ] 500 → 5k → remainder with provider rate limits
- [ ] Export `missing_covers.csv` / `successful_cover_recovery.csv`

## Module quick map

| Module | Status | Key path |
|--------|--------|----------|
| A Dashboard | Partial | `app/admin/cover-recovery` |
| B Audit | Partial | `scripts/build_catalog_file_map.py` |
| C Extract | Working | `scripts/lib_local_ebook_covers.py` |
| D Providers | Partial (no GB key) | `lib/cover-recovery/providers/` |
| E Matching | Working | `lib/cover-recovery/matcher.ts` |
| F Assets | Working | `app/api/covers/[slug]/route.ts` |
| G Dedup | Partial | `scripts/dedupe_*.py` |
| H Cover CC | Partial | admin cover-recovery |
| I Workers | Working | `scripts/run_cover_recovery_batch.py` |
| J Dup UI | Not started | — |
| K Settings | Env only | `.env.local` |
| L Reports | Partial | `data/reports/` |
