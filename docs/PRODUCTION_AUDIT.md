# AnonTrove Production Audit

**Date:** 2026-11-11  
**Repo:** https://github.com/tarikk786786/Ebook  
**Workspace:** `projects/anon-trove-ebooks`  
**Target production URL:** https://ebook-sandy-chi.vercel.app  
**Vercel team / project:** `tarik-pro-fitness` / `ebook` (`prj_e2wv2wSvLch2huJsVMKl3O5DBwo7`)

Secrets are never printed in this document — only names and presence.

---

## 1. Stack & package manager

| Item | Value |
|------|--------|
| Framework | Next.js 14 App Router (TypeScript) |
| Package manager | npm (`package.json` / `package-lock.json`) |
| Build | `npm run build` → `next build` |
| Node (local CLI) | Node.js 24.x observed; Vercel project setting shows **26.x** |
| SQLite | `node:sqlite` (`DatabaseSync`) + `types/node-sqlite.d.ts` |
| Payments | FamGateway UPI only (code still accepts legacy `FAMPAY` alias → same rail) |

---

## 2. Vercel linkage

| Check | Result |
|-------|--------|
| `.vercel/project.json` | Present: `projectName=ebook`, `orgId=team_GaEwKT5Cmso3vxQihwOWeFxc` |
| CLI auth | `vercel whoami` → authenticated |
| Scope | `--scope tarik-pro-fitness` required |
| Latest production deploy (at audit) | Ready (`ebook-fvbcjln26-…`) |
| Live smoke | `GET /` → **200**; `GET /api/books?limit=5` → **200** |
| Note | Project “Latest Production URL” in CLI list may show a custom domain (`tb.us.kg`); primary alias for this task remains `ebook-sandy-chi.vercel.app` |

Do **not** deploy to sibling project `anon-trove-ebooks` — wrong project.

---

## 3. Config files

| File | Role |
|------|------|
| `next.config.mjs` | Security headers (CSP/HSTS), `staticPageGenerationTimeout: 180`, image remotePatterns, pdfjs canvas stub |
| `vercel.json` | `framework: nextjs`, crons (`/api/cron/storage-heartbeat`, `/api/cron/discovery`), long-cache covers/static |
| `tsconfig.json` | `target: ES2017`, strict, path `@/*` |
| `.env.example` | Template of env **names** (no live secrets) |
| `.env.local` | Local secrets (gitignored) |

---

## 4. Critical API surface

| Path | Purpose | Auth / integrity |
|------|---------|------------------|
| `POST /api/checkout` | Create FamGateway order; **server-side prices** from catalog | Rate limit; Zod |
| `POST /api/webhooks/famgateway` | Payment webhook | HMAC (`x-famgateway-signature` / `x-fampay-signature`); idempotent |
| `GET/POST /api/poll` | Checkout status poll | Order lookup |
| `GET /api/download/[token]` | Entitled download | AES-256-GCM token; TTL |
| `GET /api/covers/[slug]` | Cover resolve + SVG placeholder fallback | Dynamic; must not mark placeholders as verified |
| `GET /api/books` | Catalogue API (paginated) | Public |
| `/api/admin/*` | Admin | `ADMIN_ACCESS_SECRET` |
| `/api/cron/*` | Cron jobs | `CRON_SECRET` (and/or admin) |
| `/api/community/*` | Community marketplace (PR stack / local WIP) | `COMMUNITY_ACCESS_TOKEN_SECRET` |

---

## 5. Catalogue & covers

- Catalogue: `lib/catalog.ts` loads registries (JSON), not 86k rows into the browser.
- Storefront pages paginate/search via existing catalog helpers.
- Covers: `/api/covers/[slug]` + `public/covers/` + cover URL index; unverified/missing → fallback art, not “verified.”
- Do **not** git-push bulk `public/covers/**` or large SQLite/binaries for deploy.

---

## 6. Payments (FamGateway / FamePay)

Intact paths observed in code:

- Checkout → `lib/payments` + FamGateway create-order
- Webhook → `verifyFamGatewaySignature` (HMAC-SHA256 + `timingSafeEqual` path in `lib/crypto.ts`)
- Poll → `/api/poll`
- Download tokens → `DOWNLOAD_ENCRYPTION_SECRET` (fail closed if missing/short)

**Do not** weaken HMAC or token TTL.

---

## 7. Storage / Telegram

- Adapters: `lib/storage` → `local` | `telegram` | `b2`/`r2`
- `TelegramStorageAdapter` present; Bot API download requires `TELEGRAM_BOT_TOKEN`
- Entitlement for customer downloads is via encrypted download tokens / order checks on `/api/download/[token]` — not raw public file URLs
- **Audit finding:** `TelegramStorageAdapter.getSignedUrl` previously allowed a hardcoded HMAC fallback string if secrets missing — must **fail closed** (fix before prod push)

---

## 8. GitHub Actions

| Workflow | Purpose |
|----------|---------|
| `.github/workflows/security.yml` | Gitleaks + Semgrep on push/PR/`main` + daily |
| `.github/workflows/codeql.yml` | CodeQL |
| `.github/workflows/autonomous-qa-continuous.yml` | Continuous QA automation |
| `.github/dependabot.yml` | Dependency updates |

---

## 9. Production env vars on Vercel (names only)

**Production (ebook) at audit:**

- `ADMIN_ACCESS_SECRET` (Secret)
- `DOWNLOAD_ENCRYPTION_SECRET` (Secret)
- `FAMGATEWAY_API_KEY` (Secret)
- `NEXT_PUBLIC_SITE_URL` (Config)

**Preview:** `FAMGATEWAY_API_KEY` only  
**Development:** `FAMGATEWAY_API_KEY` only  

**Gaps vs local `.env.local` / app needs (to sync if values exist locally):**

| Name | Severity | Notes |
|------|----------|-------|
| `CRON_SECRET` | High | Cron routes fail-closed / unauthorized without it |
| `FAMGATEWAY_BASE_URL` | Medium | Code has default `https://famgateway.in` |
| `FAMGATEWAY_POLL_URL` | Medium | Code has default poll URL |
| `PAYMENT_REDIRECT_URL` / `APP_BASE_URL` | Medium | Redirect / absolute URLs |
| `NEXT_PUBLIC_STORE_NAME` / tagline | Low | Branding |
| `SUPPORT_EMAIL` / `NEXT_PUBLIC_SUPPORT_EMAIL` | Medium | Support surfaces |
| `TELEGRAM_BOT_TOKEN` | High if TG storage | Missing locally → telegram remote path inactive |
| `TELEGRAM_STORAGE_CHANNEL_ID` | Medium | Channel id for vault |
| `COMMUNITY_ACCESS_TOKEN_SECRET` | High if community shipped | Magic-link sessions |
| `STORAGE_PROVIDER` | Low | Defaults to local/auto |

---

## 10. Open PRs (community + messaging)

| # | Branch | Topic |
|---|--------|--------|
| 1 | `pr/missing-cover-refund-messaging` | Missing-cover / refund transparency |
| 2 | `pr/community-schema-auth` | Community SQLite + auth |
| 3 | `pr/community-submit-request-ui` | Submit/request UI + APIs |
| 4 | `pr/admin-community-queues` | Admin queues |
| 5 | `pr/community-ledger-payouts` | Ledger / UPI payouts |
| 6 | `pr/community-tests-docs` | Community tests + docs |

Production strategy: keep `main` buildable first; merge or consolidate community only when `node:sqlite` + secrets are ready on Vercel.

---

## 11. Local dirty tree risks

- ~21k `public/covers/**` modifications — **leave unstaged**; never commit for this deploy
- Large data registries / enrichment zips — do not commit
- Untracked community app routes / `lib/community` — keep out of accidental “add all”
- `.env.local` — never commit

---

## 12. Build & test gates before push

```bash
npm install
npm run build
node tests/master_system_verification.mjs
node tests/security_regression_suite.mjs
npm run test:community   # if community code is included
```

Then commit **code + docs only**, push `main`, poll Vercel until Ready, confirm https://ebook-sandy-chi.vercel.app → 200.

See also: `docs/ENVIRONMENT_SETUP.md`, `docs/PRODUCTION_DEPLOYMENT_REPORT.md`.
