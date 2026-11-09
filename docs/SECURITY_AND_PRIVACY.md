# SECURITY_AND_PRIVACY.md — SEO Security, Secret Hygiene & Privacy Boundaries
**Platform:** AnonTrove (`https://ebook-sandy-chi.vercel.app/`)  
**Compliance:** OWASP ASVS 5.0 (Level 2), OWASP Top 10  

---

## 1. Zero-Exposure Policy for Credentials & Secrets

Under no circumstances may the SEO or crawler infrastructure expose private credentials:
- **Payment Gateways:** FamPay/FamGateway API keys, secret hashes, and webhook signatures remain strictly on server-side runtime (`process.env.FAMGATEWAY_API_KEY`).
- **Cryptographic Keys:** AES-256-GCM download encryption secrets (`DOWNLOAD_ENCRYPTION_SECRET`) and Admin authentication tokens (`ADMIN_ACCESS_SECRET`) are never injected into client bundles, public HTML, or meta tags.
- **Client Bundles:** Next.js environment variable scoping ensures only `NEXT_PUBLIC_*` variables reach the browser.

---

## 2. Crawler Protection for Sensitive Endpoints

1. **Private Ebook Delivery Paths:**
   - `/api/download/[token]` and `/reader/[token]` are strictly disallowed in `app/robots.ts` and omitted from `app/sitemap.ts`.
   - Reader session routes enforce `X-Robots-Tag: noindex, nofollow` to prevent search engines from caching protected digital assets.
2. **SSRF Defense on Link Checking:**
   - Any internal link verification scripts enforce `isSafePublicHttpsUrl` checks, blocking loopback (`127.0.0.1`), metadata services (`169.254.169.254`), and private subnets (`10.0.0.0/8`, `192.168.0.0/16`).
3. **Customer Privacy:**
   - Referrer policy is set to `strict-origin-when-cross-origin`, preventing search engines or external analytics from harvesting order IDs or query tokens passed in URL paths.
