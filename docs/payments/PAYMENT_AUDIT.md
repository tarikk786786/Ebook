# AnonTrove UPI Payment Integration — Comprehensive Audit Report

**Date:** 2026-11-08  
**Website:** [https://ebook-sandy-chi.vercel.app](https://ebook-sandy-chi.vercel.app)  
**Gateway Provider:** FamGateway (Non-Custodial 0% Fee Automated UPI Infrastructure)  
**Contract Specification:** Extracted & Standardized from `upi-gateway-spec.zip`  

---

## 1. Executive Summary

A comprehensive architectural and code audit of the payment subsystem in `projects/anon-trove-ebooks` was conducted to evaluate server-side payment creation, UPI intent dispatch, QR rendering, polling verification, webhook signature processing, and digital fulfillment.

The platform's active and functioning UPI provider is **FamGateway**, which provides server-to-server dynamic UPI session creation, automated bank settlement directly into the merchant's VPA (`wowtarik@yesfam`), and zero gateway processing commissions.

---

## 2. Inventory of Payment Components

| Component | Path | Responsibility | Audit Verdict |
| :--- | :--- | :--- | :--- |
| **API Checkout** | `app/api/checkout/route.ts` | Server-side cart validation and order creation | Hardened: server-side authoritative catalog pricing |
| **Gateway Adapter** | `lib/famgateway.ts` | Server-to-server HTTP calls to `famgateway.in` | Validated: `/api/create-order` & `/api/checkout-status.php` functional |
| **Order Store** | `lib/orders/store.ts` | Durable order state persistence (`data/orders_store.json`) | Validated: state machine with idempotent markOrderPaid |
| **Poll & Delivery** | `app/api/poll/route.ts` | Public status polling & AES-256-GCM token generator | BOLA/IDOR fixed: strictly verifies order contains book |
| **Webhook Handler**| `app/api/webhooks/famgateway/route.ts` | Timing-safe HMAC verification & event fulfillment | Validated: `crypto.timingSafeEqual`, replay protection |
| **Client UI Modal** | `components/PaymentModal.tsx` | Dynamic QR, Countdown, UPI Deep-links, Polling | Needs Cleanup: remove "Simulate Payment" mock button |
| **Success Page** | `app/success/page.tsx` | Post-payment verified download screen | Needs Hardening: remove unverified token fallback |

---

## 3. Discovered Vulnerabilities & Payment Bugs

1. **Bug PB-01: Client-Side Simulation Bypass in UI Modal (`PaymentModal.tsx`)**
   - *Issue:* `handleSimulatePayment` allowed visitors to bypass bank payment and directly trigger token generation in dev/staging.
   - *Remediation:* Remove mock payment simulation; require authoritative server verification only.
2. **Bug PB-02: Premature Fallback Token on `/success` (`app/success/page.tsx`)**
   - *Issue:* If `/api/poll` returned pending or failed, the success page defaulted to `/api/download/verified-order-token`.
   - *Remediation:* Enforce explicit waiting state; only show download button when server status is authoritatively `success`.
3. **Bug PB-03: Multi-App UPI Deep-Link Gaps**
   - *Issue:* UI modal previously provided only a single generic UPI button instead of dedicated launching links for Google Pay, PhonePe, Paytm, and BHIM.
   - *Remediation:* Generate protocol-specific deep-link handlers from the authoritative `upi_intent`.
