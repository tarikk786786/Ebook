# PAYMENT SYSTEM TEST & VERIFICATION REPORT

## 1. Test Overview
Date: November 8, 2026
Target Environment: AnonTrove Next.js Engine & Live FamGateway Rail (`https://famgateway.in`)
Gateway Merchant: `wowtarik@yesfam`

## 2. Test Cases Executed

### Test 1: Live Order Creation via FamGateway API
- **Endpoint**: `POST https://famgateway.in/api/create-order`
- **Request Payload**:
  ```json
  {
    "api_key": "fam_77561f565e477270afe5d44c58dba91bc4fba9e8",
    "amount": "10.00",
    "order_id": "TEST_AUDIT_ORDER_99",
    "redirect_url": "https://ebook-sandy-chi.vercel.app/success"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "order_id": "TEST_AUDIT_ORDER_99",
      "qr_url": "https://famgateway.in/qr-code.php?text=upi%3A%2F%2Fpay%3Fpa%3Dwowtarik%40yesfam%26pn%3DTARIK%26am%3D10.00%26tr%3DTEST_AUDIT_ORDER_99...",
      "checkout_url": "https://famgateway.in/checkout.php?order_id=TEST_AUDIT_ORDER_99",
      "upi_intent": "upi://pay?pa=wowtarik@yesfam&pn=TARIK&am=10.00&tr=TEST_AUDIT_ORDER_99...",
      "upi_id": "wowtarik@yesfam",
      "amount": "10.00"
    }
  }
  ```
- **Result**: PASSED. Live dynamic QR and deep links successfully generated.

### Test 2: Price Tampering Defense (Server-Authoritative Pricing)
- **Attack Scenario**: Client attempts `POST /api/checkout` with `{ "bookId": "the-huma", "priceInInr": 1 }` on a ₹399 book.
- **Verification**: Server disregards client `priceInInr` and queries catalog `getBookById('the-huma')`, passing the authoritative price (₹399) to FamGateway.
- **Result**: PASSED. Price cannot be altered by client manipulation.

### Test 3: BOLA / Cross-Book Token Theft Prevention
- **Attack Scenario**: Attacker pays for Book A (`id: "free-guide"` at ₹10), then calls `GET /api/poll?order_id=ORDER_A&book_id=expensive-guide`.
- **Verification**: `lib/orders/store.ts` validates order ownership. Polling fails with HTTP 403 / status 'forbidden' due to mismatch between recorded `bookId` and requested `book_id`.
- **Result**: PASSED. Tokens are strictly bound to the purchased asset.

### Test 4: Live Polling Verification
- **Endpoint**: `GET https://famgateway.in/api/checkout-status.php?order_id=TEST_AUDIT_ORDER_99`
- **Response**:
  ```json
  {
    "status": "pending"
  }
  ```
- **Result**: PASSED. Pending status correctly detected without fake approvals.

### Test 5: Client-Side Simulation Elimination
- **Check**: Examined `PaymentModal.tsx` for client-only mock buttons or unverified redirects.
- **Result**: PASSED. All dev simulation triggers eradicated.
