# SECURITY_CONFIGURATION.md — Platform Security Architecture & Environment Specifications
**Platform:** AnonTrove Ebook Commerce Platform (`projects/anon-trove-ebooks`)  
**Production URL:** [https://ebook-sandy-chi.vercel.app/](https://ebook-sandy-chi.vercel.app/)  
**Document Version:** 1.0.0  
**Updated:** 2026-11-08

---

## 1. Environment Variable Inventory & Scope

All secrets and operational parameters must be documented in `appinfo11.txt`. Secret values must never be checked into version control.

| Variable Name | Required | Scope | Purpose | Minimum Complexity |
| :--- | :---: | :---: | :--- | :--- |
| `ADMIN_ACCESS_SECRET` | YES | Server | Authenticates administrator requests to `/admin` and `/api/admin/*` | Min 32 chars (64 hex recommended) |
| `DOWNLOAD_ENCRYPTION_SECRET` | YES | Server | Symmetric key for AES-256-GCM download token encryption | Exact 32 bytes (64 hex chars) |
| `FAMGATEWAY_API_KEY` | YES | Server | FamPay UPI merchant key for order creation & HMAC verification | Provided by FamGateway dashboard |
| `FAMGATEWAY_BASE_URL` | YES | Server | Upstream gateway endpoint | `https://famgateway.in` |
| `FAMGATEWAY_POLL_URL` | YES | Client/Server | Public-safe status check endpoint | `https://famgateway.in/api/checkout-status.php` |
| `STORAGE_PROVIDER` | YES | Server | Active storage backend selector | `b2` or `local` |
| `B2_KEY_ID` | OPTIONAL | Server | Backblaze B2 application key ID | Backblaze Application Key ID |
| `B2_APPLICATION_KEY` | OPTIONAL | Server | Backblaze B2 secret application key | Backblaze Application Key Secret |
| `B2_BUCKET_NAME` | OPTIONAL | Server | Private S3 bucket name | `anontrove-private-vault` |
| `B2_ENDPOINT` | OPTIONAL | Server | Regional S3 endpoint | `https://s3.us-east-005.backblazeb2.com` |
| `NEXT_PUBLIC_SITE_URL` | YES | Client/Server | Canonical origin for callbacks and redirects | `https://ebook-sandy-chi.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | OPTIONAL | Client/Server | Supabase PostgreSQL REST URL | `https://*.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | OPTIONAL | Server | Privileged server-side key for database mutations | Secret Supabase JWT |

---

## 2. HTTP Security Headers

Configured in `next.config.mjs` for all routes (`/:path*`):

```javascript
{
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://famgateway.in https://images.unsplash.com; connect-src 'self' https://famgateway.in https://*.supabase.co; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; frame-src 'self'"
}
```

---

## 3. Storage Security Architecture

1. **Backblaze B2 Private Vault**:
   - Bucket `anontrove-private-vault` is configured with `allPrivate` ACL.
   - Public access to files without S3 SigV4 pre-signed signature returns HTTP 401/403.
   - Pre-signed download URLs expire in 900 seconds (15 minutes).
2. **Local Storage Adapter Fallback**:
   - Files are stored in `private_storage/` outside public web roots.
   - Path resolution enforces strict boundary checking (`path.resolve`) to reject traversal attempts (`..`, `%2e%2e`).

---

## 4. Rate Limiting Rules (Middleware)

Configured in `middleware.ts`:
- `/api/checkout`: 10 requests / minute per client IP.
- `/api/poll`: 40 requests / minute per client IP.
- `/api/admin/*`: 30 requests / minute per client IP.
- Malformed URIs containing `..` or `%2e%2e` or `\0` are blocked at edge with HTTP 400.
