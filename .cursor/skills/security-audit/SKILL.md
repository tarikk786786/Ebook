---
name: security-audit
description: Audit admin auth, SSRF on cover downloads, path traversal, and credential exposure for Ebook Intelligence features. Use before shipping admin APIs or remote fetchers.
---

# Security audit

## Checklist

1. Admin routes gated by `ADMIN_ACCESS_SECRET`
2. No secrets in client bundles or exports
3. Remote cover fetch: block private IPs, validate redirects, size/time limits
4. Uploaded images: magic-byte validation
5. Path join never escapes `public/covers` or `private_storage`
6. Webhooks still use timing-safe HMAC
7. Paid files never under `public/`
8. Run `node tests/security_regression_suite.mjs`

## Output

Short security note with pass/fail evidence — never print secret values.
