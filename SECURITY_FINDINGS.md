# SECURITY_FINDINGS.md — Vulnerability Register & Threat Inventory
**Platform:** AnonTrove Ebook Commerce Platform (`projects/anon-trove-ebooks`)  
**Standard:** OWASP ASVS 5.0.0 (Level 2), OWASP Top 10 (2021/2025), CWE  
**Register Version:** 1.0.0  
**Status:** Baseline Established (Phase 1)

---

## Findings Summary

| Finding ID | Severity | Category | Vulnerability Type | ASVS 5.0 Ref | Status |
| :--- | :---: | :---: | :--- | :--- | :---: |
| **VULN-001** | **CRITICAL** | Authorization | Broken Object Level Authorization (BOLA/IDOR) in `/api/poll` | V4.1.1, V4.1.3 | **RESOLVED & VERIFIED** |
| **VULN-002** | **HIGH** | Payment/Info Leak | Sensitive Token Leakage & Idempotency Bypass in Webhook Route | V3.2.1, V8.3.1 | **RESOLVED & VERIFIED** |
| **VULN-003** | **HIGH** | Authentication | Unauthenticated Admin Diagnostic Endpoint (`/api/admin/storage/stats`) | V1.1.2, V4.1.1 | **RESOLVED & VERIFIED** |
| **VULN-004** | **HIGH** | Cryptography | Hardcoded Fallback Cryptographic & Storage Secrets | V6.2.1, V6.2.2 | **RESOLVED & VERIFIED** |
| **VULN-005** | **HIGH** | Auth/Storage | Plaintext Secret in `sessionStorage` & Non-Constant Time Admin Check | V2.1.2, V6.2.8 | **RESOLVED & VERIFIED** |
| **VULN-006** | **MEDIUM** | Network/API | Potential Server-Side Request Forgery (SSRF) in `/api/admin/tools` | V5.5.3, V13.2.1 | **RESOLVED & VERIFIED** |
| **VULN-007** | **MEDIUM** | Frontend | Permissive CSP (`unsafe-eval`) & External QR Code Data Leak | V14.4.1, V14.4.3 | **RESOLVED & VERIFIED** |
| **VULN-008** | **MEDIUM** | Data Integrity | Incomplete Entitlement Persistence in Supabase (Ephemeral Cache Drift) | V8.1.1, V8.2.1 | **RESOLVED & VERIFIED** |
| **VULN-009** | **MEDIUM** | Content Protection | Absence of In-Browser Secure PDF/EPUB Reader (Direct File Download Only) | V11.1.1, V11.2.1 | **RESOLVED & VERIFIED** |
| **VULN-010** | **LOW** | Supply Chain | Unpinned GitHub Actions (`@master`) & Missing CI Security Linters | V10.3.1, V10.3.3 | **RESOLVED & VERIFIED** |

---

## Detailed Vulnerability Profiles

### VULN-001: Broken Object Level Authorization (BOLA/IDOR) in `/api/poll`
- **Severity**: CRITICAL (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N - 7.5)
- **CWE**: CWE-639: Authorization Bypass Through User-Controlled Key
- **Affected File**: `projects/anon-trove-ebooks/app/api/poll/route.ts` (Lines 22-36, 70-87)
- **Description**:
  When a client polls `/api/poll?order_id=ORD_123&book_id=EXPENSIVE_BOOK`, the server checks whether `storedOrder` is in the local memory/disk store. However, because Vercel serverless functions are ephemeral, if the order is not found locally, the code falls back to checking upstream status via `checkOrderStatus(orderId)`. If that external order was marked successful (or if the attacker used any valid paid order ID), the code executes:
  ```typescript
  let targetBookId = requestedBookId;
  const book = targetBookId ? getBookById(targetBookId) : null;
  const fileName = book ? book.fileName : ...;
  const primaryToken = generateDownloadToken({ orderId, bookId: targetBookId, fileName, ... });
  ```
- **Exploit Scenario**:
  An attacker purchases a ₹19 book or discovers any completed order ID. The attacker then requests `/api/poll?order_id=<id>&book_id=expensive-masterclass-pdf`. The server accepts the paid status of the order without verifying that `expensive-masterclass-pdf` was part of the purchased bundle, minting a valid 24h AES-256-GCM download token.
- **Remediation**:
  1. Authoritatively fetch the persistent order record from Supabase PostgreSQL (or durable store).
  2. If the order is not found in the durable database, reject the request with HTTP 404/403.
  3. Never trust `requestedBookId` without matching it against the verified item list inside the retrieved order record.

---

### VULN-002: Sensitive Token Leakage in FamGateway Webhook Route
- **Severity**: HIGH (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N - 7.5)
- **CWE**: CWE-200: Exposure of Sensitive Information to an Unauthorized Actor
- **Affected File**: `projects/anon-trove-ebooks/app/api/webhooks/famgateway/route.ts` (Lines 51-68, 78-85)
- **Description**:
  The webhook endpoint implements a fallback: if the webhook signature header is absent or invalid, it queries the upstream `checkOrderStatus(orderId)`. If the order is paid, it sets `isAuthentic = true`. Then, in the deduplication block:
  ```typescript
  if (processedWebhooks.has(eventKey) || order.status === 'SUCCESS' || order.status === 'PAID') {
    return NextResponse.json({
      status: 'success',
      message: 'Idempotent: Order already fulfilled previously',
      order_id: orderId,
      tokens: order.issuedTokens || [],
    }, { status: 200 });
  }
  ```
  It returns the unredacted `issuedTokens` array directly to whoever made the HTTP POST request!
- **Exploit Scenario**:
  An unauthenticated adversary knowing an order number sends a simple POST to `/api/webhooks/famgateway` with `{"order_id": "ORD-123"}` without any signature. The server queries FamGateway, finds the order is paid, and replies with HTTP 200 containing all the private download tokens for that order.
- **Remediation**:
  1. Webhook endpoints must never return download tokens in HTTP responses. Webhooks should return `{ "status": "acknowledged" }` or `{ "status": "received" }`.
  2. Strictly require valid HMAC-SHA256 signature on all webhook requests; do not bypass signature verification.

---

### VULN-003: Unauthenticated Admin Diagnostic Endpoint (`/api/admin/storage/stats`)
- **Severity**: HIGH (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:M/I:N/A:N - 5.3)
- **CWE**: CWE-306: Missing Authentication for Critical Function
- **Affected File**: `projects/anon-trove-ebooks/app/api/admin/storage/stats/route.ts` (Lines 6-47)
- **Description**:
  Unlike `/api/admin/books` and `/api/admin/stats`, the `/api/admin/storage/stats` route completely omits `verifyAdminAccess(req)`.
- **Impact**:
  Any unauthorized external visitor can view storage backend metrics, bucket names, total storage bytes, object count, and environment configuration flags (`hasB2Keys`, `b2Endpoint`, `b2Bucket`).
- **Remediation**:
  Add `if (!verifyAdminAccess(req)) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }` at the beginning of the handler.

---

### VULN-004: Hardcoded Fallback Secrets in Cryptography & Storage Adapters
- **Severity**: HIGH (CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N - 7.4)
- **CWE**: CWE-798: Use of Hard-coded Credentials
- **Affected Files**:
  - `projects/anon-trove-ebooks/lib/crypto.ts` (Line 7)
  - `projects/anon-trove-ebooks/lib/storage/adapters/local.ts` (Line 14)
  - `projects/anon-trove-ebooks/app/api/admin/tools/route.ts` (Line 14)
- **Description**:
  Code contains fallback strings if environment variables are not set:
  - `process.env.DOWNLOAD_ENCRYPTION_SECRET || 'fallback-super-secret-key-at-least-32-chars-long'`
  - `process.env.STORAGE_SIGN_SECRET || 'anontrove-local-storage-secret-key-32'`
  - `process.env.ADMIN_ACCESS_SECRET || 'anontrove_sec_9942a78f0b1e4c62d5a3b79e180d4f6a9c1e2b4d6f8a0e2'`
- **Impact**:
  If the application is deployed in any environment where an environment variable is omitted or misspelled, the system quietly defaults to a known publicly documented string, allowing trivial signature forgery and unauthorized admin access.
- **Remediation**:
  Fail closed! Throw an explicit error on startup / invocation if required secrets are not present or shorter than 32 characters. Never use default fallback secrets in cryptographic operations.

---

### VULN-005: Plaintext Secret in `sessionStorage` & Non-Constant Time Comparison
- **Severity**: HIGH (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N - 8.2)
- **CWE**: CWE-312: Cleartext Storage of Sensitive Information, CWE-208: Observable Timing Discrepancy
- **Affected Files**:
  - `projects/anon-trove-ebooks/app/admin/page.tsx` (Lines 99, 128)
  - `projects/anon-trove-ebooks/app/api/admin/tools/route.ts` (Line 15: `token === secret`)
- **Description**:
  The admin UI stores the master `ADMIN_ACCESS_SECRET` in `sessionStorage` in plaintext and sends it via an HTTP header. Any XSS flaw or malicious browser extension can immediately exfiltrate the master secret. Furthermore, `/api/admin/tools/route.ts` uses naive JavaScript string equality (`token === secret`), which is vulnerable to side-channel timing analysis.
- **Remediation**:
  1. Implement server-side admin session authentication using secure, `HttpOnly`, `SameSite=Strict`, `Secure` session cookies with ephemeral session tokens instead of exposing the master secret to the browser.
  2. Use `crypto.timingSafeEqual` consistently across all admin authorization checks.

---

### VULN-006: Potential Server-Side Request Forgery (SSRF) in `/api/admin/tools`
- **Severity**: MEDIUM (CVSS:3.1/AV:A/AC:L/PR:H/UI:N/S:C/C:L/I:N/A:N - 4.1)
- **CWE**: CWE-918: Server-Side Request Forgery (SSRF)
- **Affected File**: `projects/anon-trove-ebooks/app/api/admin/tools/route.ts` (Line 68)
- **Description**:
  The `verify_links` action iterates over download URLs in `tools_registry.json` and issues arbitrary HTTP `fetch` requests with follow-redirects enabled:
  ```typescript
  const resp = await fetch(dl.downloadUrl, { method: 'HEAD', redirect: 'follow' });
  ```
  If an attacker can manipulate or inject a tool download URL (or if an admin is tricked into adding a local URL), the serverless function can be used to scan internal network endpoints or cloud metadata services (`http://169.254.169.254`).
- **Remediation**:
  Validate URL protocol strictly (`https:` only), restrict to whitelisted domains (e.g., `github.com`), and reject internal/private IP addresses (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).

---

### VULN-007: Permissive CSP & External QR Code Data Leak
- **Severity**: MEDIUM (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N - 5.3)
- **CWE**: CWE-1021: Improper Restriction of Rendered UI Layers or Frames
- **Affected Files**:
  - `projects/anon-trove-ebooks/next.config.mjs` (Line 31)
  - `projects/anon-trove-ebooks/lib/payments/index.ts` (Line 59)
- **Description**:
  `next.config.mjs` defines `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. The inclusion of `'unsafe-eval'` disables standard browser protections against code execution vulnerabilities. Additionally, `lib/payments/index.ts` constructs QR codes via `https://api.qrserver.com/v1/create-qr-code/?...data=${encodeURIComponent(dynamicUpiIntent)}`, sending sensitive customer order numbers and merchant VPA to an external unvetted third-party service on every checkout.
- **Remediation**:
  1. Remove `'unsafe-eval'` from Content-Security-Policy.
  2. Generate dynamic UPI QR codes locally (client-side or server-side via inline SVG data URIs) with zero external network requests.

---

### VULN-008: Incomplete Entitlement Persistence in Supabase
- **Severity**: MEDIUM (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:M/A:L - 5.3)
- **CWE**: CWE-440: Expected Behavioral Violation
- **Affected File**: `projects/anon-trove-ebooks/lib/supabase.ts` (Lines 28-61)
- **Description**:
  `syncOrderToSupabase` writes to `public.orders`, but does not write to `public.order_items`. If the local serverless filesystem resets (`data/orders_store.json` is purged), Supabase has a record of the payment amount, but zero record of which books were actually purchased in that transaction.
- **Remediation**:
  Expand `syncOrderToSupabase` to insert records into `public.order_items` for every book in `order.items`, ensuring complete entitlement durability in PostgreSQL.

---

### VULN-009: Missing In-Browser Protected Reader
- **Severity**: MEDIUM (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N - 5.3)
- **CWE**: CWE-284: Improper Access Control
- **Description**:
  Currently, upon purchase, the platform only provides direct file download links (`/api/download/[token]`). There is no in-browser secure reader interface to render protected PDF or EPUB content with session expiration, granular chapter streaming, or dynamic personalization.
- **Remediation**:
  Implement a dedicated, sandboxed in-browser reader (`/reader/[token]`) with iframe sandboxing, anti-extraction controls, and responsive controls.

---

### VULN-010: Unpinned GitHub Actions & Missing CI Security Linters
- **Severity**: LOW (CVSS:3.1/AV:N/AC:H/PR:H/UI:N/S:U/C:L/I:L/A:N - 3.3)
- **CWE**: CWE-829: Inclusion of Functionality from Untrusted Control Sphere
- **Affected File**: `projects/anon-trove-ebooks/.github/workflows/security.yml` (Line 60)
- **Description**:
  `.github/workflows/security.yml` specifies `uses: aquasecurity/trivy-action@master`. Branch references like `@master` or `@v4` can be mutated upstream if an action maintainer account is compromised. In addition, `actionlint` and `scorecard` are not executed to verify workflow security posture.
- **Remediation**:
  Pin all third-party actions to full 40-character SHA commits with inline version comments, and integrate `actionlint` into pull request checks.
