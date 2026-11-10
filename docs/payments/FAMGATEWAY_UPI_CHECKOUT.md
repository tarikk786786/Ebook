# FamGateway UPI Checkout (production)

Exclusive payment rail for AnonTrove. No Razorpay, Cashfree, PhonePe PG, or WhatsApp payments.

## Official docs

- https://famgateway.in/docs.php
- OpenAPI: https://famgateway.in/openapi.json

## Flow

1. Customer opens `/checkout?bookId=…` (Buy Now / Unlock).
2. Server `POST /api/checkout` prices from catalogue, creates pending `orders_store.json` row, then `POST https://famgateway.in/api/create-order` with `redirect_url` + `webhook_url`.
3. Customer pays via FamGateway **hosted checkout** (`checkout_url`) and/or gateway **generic** `upi_intent` / `qr_url` (OS chooses GPay, PhonePe, Paytm, BHIM, Cred, FamPay, etc.).
4. Return → `/payment/processing` → polls `/api/poll` (display) + server `verify-order.php`.
5. Webhook `POST /api/webhooks/famgateway` verifies `X-FamGateway-Signature` = HMAC-SHA256(raw body, merchant API key) per OpenAPI; unlocks entitlements idempotently.
6. Success only after verification → `/payment/success` with short-lived (15m) download tokens.

## Env

| Variable | Role |
|----------|------|
| `FAMGATEWAY_API_KEY` | Create-order + official webhook HMAC secret |
| `FAMGATEWAY_WEBHOOK_SECRET` | Optional alternate HMAC secret if dashboard provides one |
| `FAMGATEWAY_BASE_URL` | Default `https://famgateway.in` |
| `APP_BASE_URL` / `NEXT_PUBLIC_SITE_URL` | Redirect + webhook base |

## Admin

`/admin/payments` — totals, search, verify against FamGateway, CSV export. Never exposes API keys.
