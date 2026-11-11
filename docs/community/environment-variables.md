# Community marketplace — environment variables

Configure these in `.env.local` (production: Vercel project env). **Names only** — generate real values locally; never commit secrets.

## Required for community auth

| Variable | Purpose |
|----------|---------|
| `COMMUNITY_ACCESS_TOKEN_SECRET` | HMAC secret for contributor/requester magic-link session tokens (min 32 characters). Fail closed if missing. |

## Shared with the main storefront

| Variable | Purpose |
|----------|---------|
| `ADMIN_ACCESS_SECRET` | Protects `/admin/*` and `/api/admin/*` (including community admin APIs). |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin for magic-link emails and redirects. |
| `SUPPORT_EMAIL` | Shown in contributor-facing copy; optional outbound mail integration. |

## Payments (unchanged — collect only)

| Variable | Purpose |
|----------|---------|
| `FAMGATEWAY_API_KEY` | Merchant API key; webhook HMAC uses this key. |
| `FAMGATEWAY_BASE_URL` | FamGateway API base (default `https://famgateway.in`). |
| `FAMGATEWAY_POLL_URL` | Checkout status polling endpoint. |
| `DOWNLOAD_ENCRYPTION_SECRET` | AES-256-GCM download tokens after purchase. |

## Not used for community payouts

FamGateway handles **inbound** customer payments only. Contributor withdrawals are recorded manually in the admin payout queue (UPI reference ID)—there is **no** FamGateway payout or split-settlement env var.

## Optional / planned

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Secures cron routes (unchanged from main app). |
| Supabase / R2 keys | Optional mirrors; community SQLite remains the source of truth until migrated. |

See the repo root [`.env.example`](../../.env.example) for a full template including `COMMUNITY_ACCESS_TOKEN_SECRET`.
