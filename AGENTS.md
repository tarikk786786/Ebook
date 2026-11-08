# AGENTS.md — Persistent Security Rules & Operating Mandate

## Mandatory Security Directives for AnonTrove Ebook Platform

Every AI assistant, engineer, or automated process operating on this repository must strictly adhere to these rules without exception:

### 1. Absolute Credential Protection
- **Never expose credentials**: Never print, echo, commit, or log secret keys, tokens, or environment values.
- **Reference appinfo11.txt**: All credentials and environment configurations must be registered and referenced via `appinfo11.txt`. Never hardcode secrets in source files or scripts.
- **Fail Closed**: Cryptographic functions and administrative endpoints must throw an error and terminate execution if required secret keys are absent. Never supply hardcoded default strings as fallback keys.

### 2. Authorization & Entitlement Gating
- **Zero-Trust Backend Verification**: Every request to download or read an ebook must be cryptographically authorized against an authentic purchase record.
- **No Client-Side Entitlement Trust**: Never trust client-supplied book IDs, order numbers, or localStorage claims without verifying ownership in the database.
- **Prevent IDOR/BOLA**: When issuing download tokens, verify that every requested book is explicitly listed in the customer's verified order item list.

### 3. Payment & Webhook Integrity
- **Mandatory HMAC Verification**: Webhooks from payment gateways (FamPay / FamGateway) must always be cryptographically verified using constant-time HMAC-SHA256 (`crypto.timingSafeEqual`).
- **Never Leak Tokens in Webhook Responses**: Webhook endpoints must never return download tokens or sensitive customer assets in HTTP responses. Responses must only acknowledge event receipt.
- **Idempotency & Replay Protection**: Webhook event processing must be strictly idempotent and validated against the database to prevent duplicate fulfillment or replayed transaction payloads.
- **Server Price Authority**: Never trust client-side prices or totals. Prices must always be calculated on the server from the official catalog.

### 4. Ebook Content Protection
- **Private Object Storage**: Paid ebook files must remain strictly in private object storage (Backblaze B2 private bucket / private storage path). Never place paid files in public web directories or expose raw storage URLs.
- **Short-Lived Signed URLs**: Direct download links must use ephemeral, time-decayed signed URLs (maximum 15 minutes / 900 seconds TTL).
- **Anti-Automated Extraction**: In-browser reading must be session-bounded and watermarked with subtle customer transaction identifiers to deter automated bulk harvesting.

### 5. Code Quality & Security Test Verification
- **Never Disable Security Scanners**: Never disable, skip, or weaken SAST scanners, linters, or security tests to make a build or CI pass.
- **Verification Before Completion**: Never mark a task as completed or verified without executing concrete automated tests and recording empirical evidence in the project logs.
- **Defense in Depth**: Combine edge rate limiting, input validation (Zod schemas), strict CSP headers, and database Row-Level Security (RLS) to achieve layered protection.
