# AnonTrove Payment Vulnerabilities & Bug Remediation Matrix

| Bug ID | Component | Issue Description | Security Risk | Remediation Implemented | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **PB-01** | `PaymentModal.tsx` | "Simulate Payment Confirmed" button allowed manual bypass of bank settlement | Critical: Unauthorized download token generation | Removed mock simulation entirely. Only real gateway verification triggers success state. | **RESOLVED** |
| **PB-02** | `app/success/page.tsx` | Unverified fallback token generation if polling returned pending | Critical: Free book access on browser redirect | Removed premature fallback token. Requires explicit verified status from `/api/poll`. | **RESOLVED** |
| **PB-03** | `PaymentModal.tsx` | Missing app-specific UPI intent deep-links for PhonePe, GPay, Paytm | High: Degraded mobile payment UX | Built native deep-link parser generating PhonePe, GPay, Paytm, and generic UPI intents. | **RESOLVED** |
| **PB-04** | `app/api/checkout` | Client-provided `priceInInr` accepted in multi-item cart | Critical: Insecure Direct Object / Price Tampering | Forced authoritative server catalog price lookup (`getBookById`). Discarded all client-supplied prices. | **RESOLVED** |
| **PB-05** | `app/api/poll` | Token issuance accepted arbitrary `book_id` without checking order | Critical: BOLA / IDOR library scraping | Bound orders to exact purchased `bookId`s in `orders_store.json`. Rejects unassociated books. | **RESOLVED** |
| **PB-06** | `lib/famgateway.ts` | Hardcoded fallback API key in source code | High: Secret leakage | Removed hardcoded fallback. Enforced environment variable reading only. | **RESOLVED** |
