# FAMPAY UPI SECURITY AUDIT & THREAT MATRIX

## 1. Scope & Objective
Security assessment of the exclusive FamPay / FamGateway UPI payment infrastructure on AnonTrove Ebook Platform.

## 2. Threat Vector Analysis & Hardening

| Threat ID | Threat Description | Attack Vector | Implemented Mitigation | Verification Status |
|---|---|---|---|---|
| **THREAT-01** | Price Tampering | Client injects modified `priceInInr` in checkout payload | Server discards all client prices; strictly queries canonical catalog via `getBookById()` | **VERIFIED HARDENED** |
| **THREAT-02** | BOLA / Token Theft | Attacker pays for a ₹10 asset and queries token for a ₹499 asset via `/api/poll` | Cryptographic order manifest binds `orderId` to `bookId`. Poll rejects mismatched `book_id` with HTTP 400/403 | **VERIFIED HARDENED** |
| **THREAT-03** | Webhook Forgery | Attacker posts fake `payment.success` event | Dual validation: HMAC-SHA256 timing-safe comparison (`crypto.timingSafeEqual`) + direct upstream status lookup via `https://famgateway.in/api/checkout-status.php` | **VERIFIED HARDENED** |
| **THREAT-04** | Replay Attacks | Attacker replays valid webhook payload to re-trigger fulfillment | In-memory + persistent idempotency cache (`orderId:UTR`). Duplicate webhook acknowledged with cached tokens without re-processing | **VERIFIED HARDENED** |
| **THREAT-05** | State Inversion | Late webhook failure or expired event overwriting a paid transaction | Strict state transition guard in `updateOrderStatus()`: `SUCCESS` state is immutable against `FAILED`, `EXPIRED`, or `CANCELLED` | **VERIFIED HARDENED** |
| **THREAT-06** | DoS / Memory Abuse | Large payloads submitted to webhook route | 64KB strict request body limit enforced at the top of the route handler | **VERIFIED HARDENED** |
| **THREAT-07** | Client Simulation Bypass | Exploiting frontend mock payment buttons to unlock ebooks | All dev/simulation code eradicated from frontend and API routes | **VERIFIED HARDENED** |
| **THREAT-08** | Credential Leakage | Hardcoded API keys or webhook secrets committed to git | API keys sourced strictly via `process.env`. Zero secrets in git repository or public reports | **VERIFIED HARDENED** |
| **THREAT-09** | Rate Limit Abuse | Flooding checkout and polling endpoints | Edge middleware enforces sliding-window rate limits (10-40 requests/min per IP) | **VERIFIED HARDENED** |

## 3. Residual Risk Assessment
- FamGateway relies on upstream bank webhook delivery or checkout status polling. In cases of severe inter-bank UPI network latency, payments might take 10-30 seconds to settle, during which the customer's modal remains in "Detecting payment..." state. The manual "I have paid — Check Status Now" button mitigates customer friction.
