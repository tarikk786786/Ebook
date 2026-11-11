# AnonTrove Environment Setup

Never commit real secrets. Never paste secret values into docs, commits, or chat logs.  
Set values in **Vercel → Project `ebook` → Settings → Environment Variables** and/or local `.env.local`.

**Team:** `tarik-pro-fitness`  
**Project:** `ebook`  
**Production URL:** https://ebook-sandy-chi.vercel.app

---

## How to set

| Where | How |
|-------|-----|
| Local | Copy `.env.example` → `.env.local`, fill values |
| Vercel CLI | `npx vercel env add <NAME> --scope tarik-pro-fitness` (choose Production / Preview / Development) |
| Vercel Dashboard | Project → Settings → Environment Variables |
| Pull to laptop | `npx vercel env pull .env.local --scope tarik-pro-fitness` (overwrites; review first) |

Environments: **Production** (live), **Preview** (PR/branch), **Development** (optional CLI/dev).

---

## Required for production checkout + downloads

| Name | Purpose | Required | Set on |
|------|---------|----------|--------|
| `FAMGATEWAY_API_KEY` | Create-order + webhook HMAC (official) | **Required** | Production (+ Preview recommended) |
| `DOWNLOAD_ENCRYPTION_SECRET` | AES-256-GCM download tokens (min 32 chars); fail closed if missing | **Required** | Production |
| `ADMIN_ACCESS_SECRET` | Gates `/admin` and `/api/admin/*` | **Required** | Production |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL / absolute links | **Required** | Production |

---

## Strongly recommended production

| Name | Purpose | Required | Set on |
|------|---------|----------|--------|
| `CRON_SECRET` | Authorizes `/api/cron/*` | Required for crons | Production |
| `FAMGATEWAY_BASE_URL` | API base (default `https://famgateway.in`) | Optional if default OK | Production |
| `FAMGATEWAY_POLL_URL` | Checkout status poll URL | Optional if default OK | Production |
| `FAMGATEWAY_WEBHOOK_SECRET` | Alternate HMAC secret if dashboard provides one | Optional | Production |
| `PAYMENT_REDIRECT_URL` | Post-payment redirect target | Recommended | Production |
| `APP_BASE_URL` | Absolute base for payment redirects | Optional (falls back to site URL) | Production |
| `SUPPORT_EMAIL` | Support contact (server) | Recommended | Production |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support contact (client) | Recommended | Production |
| `NEXT_PUBLIC_STORE_NAME` | Storefront brand | Recommended | Production |
| `NEXT_PUBLIC_STORE_TAGLINE` | Storefront tagline | Optional | Production |

---

## Storage / Telegram

| Name | Purpose | Required | Set on |
|------|---------|----------|--------|
| `STORAGE_PROVIDER` | `local` \| `telegram` \| `b2` / `r2` | Optional (auto-detect) | Production |
| `TELEGRAM_BOT_TOKEN` | Bot API for Telegram vault | Required if provider=telegram | Production |
| `TELEGRAM_STORAGE_CHANNEL_ID` | Private storage channel | Recommended | Production |
| `STORAGE_SIGN_SECRET` | HMAC for storage signed URLs; else `DOWNLOAD_ENCRYPTION_SECRET` (no hardcoded fallback) | Required if using signed storage URLs | Production |
| `CLOUDFLARE_R2_*` / `B2_*` | Object storage credentials | Optional until R2/B2 live | Production |

Paid ebook bytes must stay private — never under `public/`.

---

## Community marketplace (when shipped)

| Name | Purpose | Required | Set on |
|------|---------|----------|--------|
| `COMMUNITY_ACCESS_TOKEN_SECRET` | Magic-link session HMAC (min 32 chars); fail closed | **Required** if community routes live | Production |
| `SMTP_HOST` / `RESEND_API_KEY` | Email delivery for magic links | Recommended in prod | Production |

See `docs/community/environment-variables.md`.

---

## Optional / future

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Cloud DB / webhook audit |
| `GOOGLE_BOOKS_API_KEY` | Cover recovery |
| `AI_GATEWAY_API_KEY` / `BOOK_*_MODEL` | AI book intelligence |
| `NYT_BOOKS_API_KEY`, `SERPAPI_API_KEY`, `ISBNDB_API_KEY`, `DATAFORSEO_*` | Enrichment / research |
| `N8N_WEBHOOK_URL` | Automation hooks |

---

## Security rules

1. Never put secrets in `NEXT_PUBLIC_*` except intentionally public values (site URL, store name, support email).
2. FamGateway webhooks: HMAC-SHA256 with constant-time compare; no payment bypass.
3. Download tokens: max ~15 minutes TTL; AES-256-GCM; fail closed without `DOWNLOAD_ENCRYPTION_SECRET`.
4. Cron / admin: validate secrets server-side first.
5. Do not commit `.env.local`, `appinfo11.txt`, or session files.

---

## Quick verification (no secret output)

```bash
# Names only on Vercel
npx vercel env ls --scope tarik-pro-fitness --environment production

# Local names present (PowerShell example — prints SET/MISSING only)
# (do not echo values)
```

After changing Production env vars, redeploy so the new values bind to the running deployment.
