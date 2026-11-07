# FAMPAY PAYMENT REPAIR & CONSOLIDATION PLAN

## 1. Objective
Establish **FamPay** as the exclusive, hardened, production-ready payment provider for AnonTrove Ebook Store. Eradicate all residual payment gateways (Razorpay, Cashfree, PayGic, etc.) and implement strict state transitions and double-verified fulfillment.

## 2. Phase-by-Phase Execution Plan

### Phase 1: Eradicate Alternative Gateways
- Remove `lib/payments/razorpay.ts`
- Remove `lib/payments/cashfree.ts`
- Remove `app/api/webhooks/razorpay`
- Remove `app/api/webhooks/cashfree`
- Clean `lib/payments/index.ts` to export FamPay exclusively.
- Clean `lib/payments/types.ts` to remove Razorpay/Cashfree types.
- Audit `app/orders/page.tsx` and any other references.

### Phase 2: Payment State Management Upgrade
- Define full state enum in `lib/orders/store.ts`:
  `CREATED | PENDING | PROCESSING | SUCCESS | FAILED | EXPIRED | CANCELLED | REVIEW_REQUIRED | REFUND_PENDING | REFUNDED`
- Implement immutable SUCCESS protection: once an order is marked `SUCCESS`, late failure or expired webhooks cannot revert it.

### Phase 3: Webhook Hardening & Asset Binding
- Refactor `app/api/webhooks/famgateway/route.ts`:
  - Enforce payload limit (<64KB).
  - Look up order in `getOrderById(order_id)`.
  - Validate that payload amount matches order total.
  - Authenticate via HMAC or secondary upstream status verification call.
  - Atomically update order status to `SUCCESS`.
  - Issue encrypted token for the exact purchased ebook.

### Phase 4: Clean, Minimalist FamPay UPI UI
- Streamline `components/PaymentModal.tsx`:
  - Distinct FamPay branded header.
  - Large dynamic UPI QR code.
  - Prominent "Pay via FamPay / UPI App" deep-link button.
  - Redacted merchant UPI VPA with 1-click copy.
  - 10-minute expiry countdown.
  - Polling with instantaneous manual "Check Status" button.
  - Zero third-party logos or superfluous buttons.

### Phase 5: Verification & Testing
- Integration tests for creation, status polling, price tampering rejection, BOLA defense, and webhook handling.
- Verify Next.js build (`npm run build`).
- Git commit, push, and test on production (`https://ebook-sandy-chi.vercel.app`).
- Generate final reports in `/docs/payments/`.
