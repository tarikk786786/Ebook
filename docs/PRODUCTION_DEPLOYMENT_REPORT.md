# AnonTrove Production Deployment Report

**Date:** 2026-11-11  
**Target:** https://ebook-sandy-chi.vercel.app  
**Vercel:** team `tarik-pro-fitness` / project `ebook`  
**GitHub:** https://github.com/tarikk786786/Ebook  

---

## 1. What was broken / risky

| Issue | Severity | Notes |
|-------|----------|-------|
| Telegram signed URL hardcoded HMAC fallback | High | `lib/storage/adapters/telegram.ts` used a static fallback secret — violates fail-closed crypto rules |
| Sparse Vercel Production env | High | Only `FAMGATEWAY_API_KEY`, `DOWNLOAD_ENCRYPTION_SECRET`, `ADMIN_ACCESS_SECRET`, `NEXT_PUBLIC_SITE_URL` |
| Missing `CRON_SECRET` on Vercel | High | Cron routes could not authenticate in production |
| Local dirty tree (~21k covers) | Ops | Risk of accidental bulk commit — excluded from deploy |
| Community marketplace (PRs #2–#6) | Medium | Not on `main` yet; needs `COMMUNITY_ACCESS_TOKEN_SECRET` before ship |
| Master verification DB absent in clean worktree | Test-only | Empty/missing `enrichment_86k_checkpoint.db` (gitignored) — linked for local tests; not deployed |

---

## 2. What was fixed

| Fix | Detail |
|-----|--------|
| Fail-closed Telegram signing | Require `STORAGE_SIGN_SECRET` or `DOWNLOAD_ENCRYPTION_SECRET` (min 32 chars); throw if missing |
| Production audit docs | `docs/PRODUCTION_AUDIT.md`, `docs/ENVIRONMENT_SETUP.md` |
| Missing-cover refund messaging | Cherry-picked PR #1 onto `main` |
| Vercel Production env sync | Added missing names from local `.env.local` when present (values never logged) |
| Build verified | `npm run build` → success (~348 routes) |

---

## 3. Files changed (this production push)

- `lib/storage/adapters/telegram.ts` — fail-closed signed URLs
- `docs/PRODUCTION_AUDIT.md` — audit
- `docs/ENVIRONMENT_SETUP.md` — env catalog (names only)
- `docs/PRODUCTION_DEPLOYMENT_REPORT.md` — this report
- Storefront messaging (from cherry-pick): `app/page.tsx`, `app/book/[slug]/BookDetailClient.tsx`, `components/BookCard.tsx`, `components/CuratorLetterSection.tsx`, `components/FaqSection.tsx`, `components/TransparencyTrustSection.tsx`

**Not committed:** `public/covers/**`, SQLite binaries, `.env.local`, community WIP, bulk registries.

---

## 4. Commits / SHA

| Commit | Message |
|--------|---------|
| `6f08aa43ae95abb1e4bfc9aca23238b8fdff9807` | `chore: production audit docs and Telegram signed-URL fail-closed` (**HEAD `main`**) |
| `c8c420a…` | `feat: highlight missing covers as genuine with full refund` (cherry-pick of PR #1) |

Pushed to `origin/main` successfully.

---

## 5. Build result

| Check | Result |
|-------|--------|
| `npm install` | OK |
| `npm run build` / `next build` | **PASS** — compiled, typed, ~348 static/SSG routes |
| Node types `node:sqlite` | Present (`types/node-sqlite.d.ts`); no suppressions |

---

## 6. Security verification

| Suite | Result |
|-------|--------|
| `node tests/security_regression_suite.mjs` | **8/8 PASS** |
| FamGateway HMAC path | Intact (`lib/crypto.ts` + `/api/webhooks/famgateway`) |
| AES download tokens | Intact; fail closed without secret |
| Admin / cron gating | Documented; `CRON_SECRET` added to Production |
| No payment bypass | Checkout still server-price authoritative |

---

## 7. Functional / QA checks

| Check | Result |
|-------|--------|
| `node tests/master_system_verification.mjs` | **7/7 PASS** (with local gitignored DB linked) |
| Catalogue pagination/search | Code path via `lib/catalog.ts` + `/api/books` (no 86k browser load) |
| Covers API | `/api/covers/[slug]` present with fallback (not marked verified) |
| Telegram adapter | Present; signed URL fail-closed |
| HTTP homepage | **200** on production URL |
| `GET /api/books?limit=3` | **200** |
| `GET /checkout` | **200** |
| `POST /api/checkout` `{}` | **400** validation (expected; no payment created) |
| Real payments | Not executed (smoke only) |
| Playwright | Not required; not run |

---

## 8. Vercel project confirmation

| Field | Value |
|-------|--------|
| Team | `tarik-pro-fitness` (`team_GaEwKT5Cmso3vxQihwOWeFxc`) |
| Project | `ebook` |
| CLI whoami | Authenticated (`786tarikislam-6234`) |
| Linked `.vercel/project.json` | `projectName=ebook` |
| Wrong project avoided | Did not deploy `anon-trove-ebooks` sibling |

---

## 9. Deploy method & status

| Item | Value |
|------|--------|
| Method | `git push origin main` (triggers Vercel Git integration) |
| Fallback tried | `npx vercel --prod --scope tarik-pro-fitness --yes` |
| Git push | **Succeeded** (`main` @ `6f08aa4`) |
| New Vercel build for this SHA | **Blocked** — Hobby rate limit |
| Error | `Resource is limited - try again in 1 day (more than 100, code: "api-deployments-free-per-day")` |
| GitHub status | `Vercel – ebook`: failure — “Deployment rate limited — retry in 24 hours” |
| Live production | Prior Ready deployment still serving (`ebook-fvbcjln26-…`) |

**Auth fix / next action:** Wait ~24h or upgrade team plan / reduce deploy churn, then redeploy (`git push` empty commit or `npx vercel --prod --scope tarik-pro-fitness`). Env vars already updated on Production will bind on the next successful deploy.

---

## 10. Production URL

- https://ebook-sandy-chi.vercel.app → **HTTP 200** (live; serving last successful production deploy, not yet `6f08aa4`)

---

## 11. Critical APIs (shape)

| API | Status |
|-----|--------|
| `POST /api/checkout` | Present; Zod + server prices; empty body → 400 |
| `POST /api/webhooks/famgateway` | Present; HMAC required |
| `GET/POST /api/poll` | Present |
| `GET /api/download/[token]` | Present; AES token |
| `GET /api/covers/[slug]` | Present |
| `GET /api/books` | Present; HTTP 200 observed |

---

## 12. Remaining blockers

1. **Vercel Hobby daily deployment cap** (`api-deployments-free-per-day` >100) — **blocks shipping `6f08aa4` until reset/upgrade**.
2. **`TELEGRAM_BOT_TOKEN`** — not set locally → Telegram remote vault inactive until BotFather token is configured on Vercel.
3. **Community marketplace (PRs #2–#6)** — not merged; needs `COMMUNITY_ACCESS_TOKEN_SECRET` + careful merge order.
4. **Preview env** — still sparse; mirror Production secrets for PR previews if needed.
5. **New Production env vars** (CRON_SECRET, FamGateway URLs, support/store names, Telegram channel) — set on Vercel but apply fully after next successful deploy.
6. **Supabase / R2** — optional cloud layers still not fully configured.
7. **npm audit** — dependency advisories remain (not suppressed).

---

## Open PRs left open

| # | Topic | Action |
|---|--------|--------|
| 1 | Missing-cover refund messaging | Cherry-picked to main for this deploy |
| 2–6 | Community stack | Leave open until secrets + merge plan ready |
