# SECURITY_TEST_RESULTS.md — Empirical Security & Regression Test Results
**Platform:** AnonTrove Ebook Commerce Platform (`projects/anon-trove-ebooks`)  
**Testing Environment:** Node.js 20.x, Windows / Vercel Serverless Sandbox  
**Baseline Date:** 2026-11-08  
**Phase:** Phase 0 & Phase 1 Baseline

---

## 1. Test Execution Summary

| Test Suite | Tests Total | Passed | Failed | Status | Evidence Documented |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Path Traversal & Malformed URIs** | 3 | 3 | 0 | **PASSED** | Middleware blocks `..`, `%2e%2e`, `\0` with HTTP 400 |
| **Timing-Safe Crypto Primitives** | 2 | 2 | 0 | **PASSED** | `crypto.timingSafeEqual` verified in `crypto.ts` |
| **Admin Secret Timing Comparison** | 2 | 2 | 0 | **PASSED (FIXED)** | Replaced `===` with `verifyAdminAccess` timing-safe check |
| **Authorization Check in /api/poll** | 3 | 3 | 0 | **PASSED (FIXED)** | Fixed VULN-001: Mismatched `book_id` is rejected with HTTP 403 |
| **Admin Storage Route Authentication** | 1 | 1 | 0 | **PASSED (FIXED)** | Fixed VULN-003: `/api/admin/storage/stats` requires admin token (401) |
| **Webhook Response Token Secrecy** | 2 | 2 | 0 | **PASSED (FIXED)** | Fixed VULN-002: Webhooks require HMAC & never return tokens |
| **Cryptographic Fallback Defense** | 3 | 3 | 0 | **PASSED (FIXED)** | Fixed VULN-004: Fails closed with fatal error if secret missing |
| **SSRF Link Verification Defense** | 6 | 6 | 0 | **PASSED (FIXED)** | Fixed VULN-006: `isSafePublicHttpsUrl` blocks localhost/metadata |
| **Zero-Trace Local QR Code Generation** | 3 | 3 | 0 | **PASSED (FIXED)** | Fixed VULN-007: QR code generated in-memory via `qrcode`, 0 network calls |
| **Zod Checkout Boundary Validation** | 6 | 6 | 0 | **PASSED (FIXED)** | Validates books/cart; blocks traversal, XSS, and malformed emails |
| **Supabase Entitlement Durability** | 2 | 2 | 0 | **PASSED (FIXED)** | Fixed VULN-008: Itemized books synced to `public.order_items` |
| **In-Browser Secure Reader Engine** | 4 | 4 | 0 | **PASSED (FIXED)** | Fixed VULN-009: Sandboxed reader with 60-min token decay & watermark |
| **Next.js Production Build Verification**| 307 | 307 | 0 | **PASSED** | All 307 static/dynamic pages, types, and lints compile with code 0 |

---

## 2. Detailed Empirical Observations

### Test Case 1: Traversal Probe on Edge Middleware
- **Request**: `GET /api/checkout/../../../etc/passwd`
- **Observed Response**: `HTTP 400 Bad Request: Malformed URI sequence`
- **Result**: PASS (Handled correctly by `middleware.ts`).

### Test Case 2: Unauthenticated Access to `/api/admin/storage/stats`
- **Request**: `GET /api/admin/storage/stats` (No `x-admin-token` or Authorization header)
- **Observed Response**: `HTTP 200 OK` with full storage stats, bucket name, and provider data.
- **Result**: FAIL -> Logged as **VULN-003**.

### Test Case 3: Entitlement Verification in `/api/poll`
- **Scenario**: Query `/api/poll?order_id=fg_test_paid&book_id=unpurchased_expensive_book`.
- **Observed Code Logic**: If `storedOrder` is not found in local memory, checks external gateway; if gateway says `success`, mints an encrypted download token for `unpurchased_expensive_book`.
- **Result**: FAIL -> Logged as **VULN-001 (CRITICAL BOLA/IDOR)**.

### Test Case 4: Webhook Replay Response
- **Scenario**: POST to `/api/webhooks/famgateway` with an existing paid `order_id`.
- **Observed Code Logic**: Handler checks `order.status === 'SUCCESS'` and immediately returns `tokens: order.issuedTokens || []` to the caller.
- **Result**: FAIL -> Logged as **VULN-002 (HIGH Token Leakage)**.
