# REMAINING BLOCKERS & DEPENDENCIES

## 1. Upstream Gateway Dependencies
- **Merchant Bank Settlement Webhook**:
  FamGateway operates primarily via checkout polling (`/api/checkout-status.php`). If FamGateway pushes webhooks directly to a callback URL, ensure the webhook URL is registered in the FamGateway merchant portal:
  `https://ebook-sandy-chi.vercel.app/api/webhooks/famgateway`

## 2. Vercel Secrets Sync
- Verify that `ADMIN_ACCESS_SECRET`, `DOWNLOAD_ENCRYPTION_SECRET`, and `FAMGATEWAY_API_KEY` are populated in the live Vercel dashboard environment variables for Production, Preview, and Development.

## 3. Serverless State Persistence
- In high-scale multi-region serverless deployment, in-memory store (`lib/orders/store.ts`) can be backed by Supabase or Redis (`KV`) so that poll requests landing on separate Vercel lambda instances share order state across instances. The Supabase schema is pre-configured in `security/supabase/schema_and_rls.sql`.
