# AnonTrove Security & Secret Management Guide

## Core Security Invariants
1. **Absolute Credential Protection**: All keys are referenced via `appinfo11.txt`. Never hardcode secrets in code, sitemaps, or structured data.
2. **Timing-Safe Admin Authentication**: Admin routes (`/admin`, `/admin/seo`, `/api/admin/seo`) verify secrets with `crypto.timingSafeEqual` via `lib/auth/admin.ts`.
3. **Short-Lived Download Tokens**: Ebook download links expire after 900 seconds.
4. **Private Storage Isolation**: Original digital ebook files remain in private storage paths, never exposed publicly.
5. **Fail-Closed Auditing**: If an audit or test detects secret leakage or malformed structured data, the CI/CD pipeline immediately terminates with an error code.
