# FAMPAY UPI PAYMENT INTEGRATION AUDIT

## 1. Executive Summary
- **Target Gateway**: FamPay / FamGateway UPI Rail (`https://famgateway.in`)
- **Integration Type**: Direct UPI merchant dynamic QR & intent settlement.
- **Merchant VPA Protocol**: `[REDACTED]@yesfam`
- **Commission Rate**: 0% platform fee.
- **Status Prior to Fix**:
  - Legacy multi-gateway codebase contained residual Razorpay and Cashfree modules.
  - Webhook handler had a hardcoded default book fallback instead of querying the order manifest.
  - Payment statuses lacked strict state transition guarantees (e.g., late failures could potentially overwrite paid status).
  - Webhook needed secondary authoritative fallback verification if gateway does not transmit HMAC signature headers.

## 2. Inventory of Payment Files Audited
- `lib/payments/famgateway.ts`: FamPay API client handling order creation and polling.
- `lib/payments/index.ts`: Gateway router (contains obsolete Razorpay & Cashfree branches to be purged).
- `lib/payments/razorpay.ts`: Legacy provider to be removed.
- `lib/payments/cashfree.ts`: Legacy provider to be removed.
- `app/api/webhooks/famgateway/route.ts`: Webhook listener.
- `app/api/webhooks/razorpay/route.ts`: Legacy webhook to be deleted.
- `app/api/webhooks/cashfree/route.ts`: Legacy webhook to be deleted.
- `components/PaymentModal.tsx`: Checkout modal UI.
- `app/api/checkout/route.ts`: Server-authoritative checkout route.
- `app/api/poll/route.ts`: Verification polling route.

## 3. Findings & Identified Gaps
1. **Residual Gateway Code**:
   - `lib/payments/razorpay.ts` and `lib/payments/cashfree.ts` are still present in repository.
   - Webhook directories `app/api/webhooks/razorpay` and `app/api/webhooks/cashfree` exist.
   - `lib/payments/index.ts` still has fallback paths for non-FamPay gateways.
2. **Webhook Asset Binding**:
   - `app/api/webhooks/famgateway/route.ts` used `BOOK_CATALOG[0]` when generating fulfillment tokens instead of retrieving the purchased `bookId` from `getOrderById(order_id)`.
3. **State Machine Granularity**:
   - Order store supported only `PENDING | PAID | EXPIRED | FAILED`.
   - Needs full enterprise lifecycle: `CREATED | PENDING | PROCESSING | SUCCESS | FAILED | EXPIRED | CANCELLED | REVIEW_REQUIRED | REFUND_PENDING | REFUNDED`.
4. **Credential Privacy**:
   - Verified that all API keys and secrets are loaded via `process.env.*`. Zero credentials committed to git.
