# PAYMENT IMPLEMENTATION ARCHITECTURE

## 1. Overview
The AnonTrove Ebook Store implements a resilient, zero-trust, non-custodial UPI payment architecture backed by **FamGateway** (`https://famgateway.in`).
All payments settle directly to the merchant VPA (`wowtarik@yesfam`) with 0% gateway commission.

## 2. Security Invariants
1. **Server-Authoritative Pricing**: The client cannot dictate product prices. The server fetches the canonical catalog price via `getBookById(bookId)` inside `/api/checkout` and `/api/famgateway/create-order`.
2. **Order-to-Asset Cryptographic Binding**: When an order is created, an order manifest is securely recorded in memory/database via `lib/orders/store.ts`. The order record strictly binds `orderId` to `bookId` and `amount`.
3. **BOLA/IDOR Defense**: When `/api/poll` is invoked, it verifies that the requested `book_id` matches the recorded `orderId`. An attacker cannot use an order paid for a ₹10 item to download a ₹500 item.
4. **Zero-Mock Policy in Production**: All simulated payment bypasses have been eradicated from `PaymentModal.tsx` and API handlers. Tokens are only minted upon verified bank settlement confirmed by the gateway upstream.
5. **Single-Use Encrypted Download Tokens**: Paid orders receive an AES-256-GCM encrypted download token signed with `DOWNLOAD_ENCRYPTION_SECRET`. Tokens expire after 24 hours.

## 3. Checkout & Payment Flow
```
User clicks "Buy eBook"
       │
       ▼
POST /api/checkout { bookId }
       │ (Looks up canonical book price from catalog)
       ▼
Calls FamGateway POST /api/create-order
       │ (Payload: api_key, amount, order_id, redirect_url)
       ▼
Returns { orderId, qrUrl, upiIntent, upiId, amount }
       │
       ▼
Frontend renders dynamic QR + Multi-App Intent Buttons:
   - PhonePe: phonepe://...
   - Google Pay: gpay://upi/pay?...
   - Paytm: paytmmp://...
   - Any UPI: upi://pay?...
       │
       ▼
Client polls GET /api/poll?order_id=...&book_id=... every 2.5s
       │
       ▼
When FamGateway returns { status: "success", utr: "..." }:
   - Order marked COMPLETED in store
   - Encrypted single-use token generated
   - Download button activated in modal
```

## 4. Key Files & Components
- [`lib/payments/famgateway.ts`](file:///c:/Users/tarik/Downloads/EBOOKS%20SELLING/projects/anon-trove-ebooks/lib/payments/famgateway.ts): Low-level HTTP client interfacing with FamGateway API endpoints.
- [`lib/payments/index.ts`](file:///c:/Users/tarik/Downloads/EBOOKS%20SELLING/projects/anon-trove-ebooks/lib/payments/index.ts): Unified payment gateway abstraction layer.
- [`lib/orders/store.ts`](file:///c:/Users/tarik/Downloads/EBOOKS%20SELLING/projects/anon-trove-ebooks/lib/orders/store.ts): Order manifest and authorization store.
- [`app/api/checkout/route.ts`](file:///c:/Users/tarik/Downloads/EBOOKS%20SELLING/projects/anon-trove-ebooks/app/api/checkout/route.ts): Public checkout API route with rate-limiting.
- [`app/api/poll/route.ts`](file:///c:/Users/tarik/Downloads/EBOOKS%20SELLING/projects/anon-trove-ebooks/app/api/poll/route.ts): Authoritative polling endpoint.
- [`components/PaymentModal.tsx`](file:///c:/Users/tarik/Downloads/EBOOKS%20SELLING/projects/anon-trove-ebooks/components/PaymentModal.tsx): Real-time checkout modal with QR code, timer, deep links, and polling.
