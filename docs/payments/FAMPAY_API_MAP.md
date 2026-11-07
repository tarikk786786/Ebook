# FAMPAY / FAMGATEWAY API CONTRACT & PROTOCOL MAP

## 1. Upstream Endpoint Specifications

### A. Order Creation
- **Method**: `POST`
- **URL**: `https://famgateway.in/api/create-order`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "api_key": "[REDACTED_API_KEY]",
    "amount": "149.00",
    "order_id": "ORD_REF_STRING",
    "redirect_url": "https://ebook-sandy-chi.vercel.app/success"
  }
  ```
- **Response Format (Success)**:
  ```json
  {
    "status": "success",
    "data": {
      "order_id": "fg_XXXXXXXX",
      "qr_url": "https://famgateway.in/api/qr-image.php?order_id=fg_XXXXXXXX",
      "checkout_url": "https://famgateway.in/pay.php?order_id=fg_XXXXXXXX",
      "upi_intent": "upi://pay?pa=[REDACTED]@yesfam&pn=FamPay&tn=fg_XXXXXXXX&am=149.00&cu=INR",
      "upi_id": "[REDACTED]@yesfam",
      "amount": "149.00"
    }
  }
  ```

### B. Status Verification Polling
- **Method**: `GET`
- **URL**: `https://famgateway.in/api/checkout-status.php?order_id={gateway_order_id}`
- **Response Format (Pending)**:
  ```json
  {
    "status": "pending"
  }
  ```
- **Response Format (Success)**:
  ```json
  {
    "status": "success",
    "order_id": "fg_XXXXXXXX",
    "amount": "149.00",
    "utr": "UTR_XXXXXXXXXXXX"
  }
  ```
- **Response Format (Expired / Failed)**:
  ```json
  {
    "status": "expired"
  }
  ```

### C. Webhook Notification
- **Method**: `POST`
- **URL**: `https://ebook-sandy-chi.vercel.app/api/webhooks/famgateway`
- **Payload**:
  ```json
  {
    "event": "payment.success",
    "order_id": "fg_XXXXXXXX",
    "amount": "149.00",
    "utr": "UTR_XXXXXXXXXXXX"
  }
  ```
- **Security Validation**:
  - Optional header: `x-famgateway-signature` (HMAC-SHA256).
  - Dual-verification safeguard: If signature header is not supplied, the server invokes `GET /api/checkout-status.php?order_id={order_id}` directly against upstream to authenticate the transaction before fulfilling.

## 2. Parameter Mapping & Conversion Rules
| Field | Internal Schema | FamPay API Schema | Invariant / Validation |
|---|---|---|---|
| Order Reference | `orderNumber` | `order_id` (input) | Alphanumeric, max 64 chars |
| Gateway Order ID | `gatewayOrderId` | `data.order_id` | Starts with `fg_` |
| Product Amount | `totalInr` | `amount` | String format `"149.00"` |
| Merchant VPA | `merchantVpa` | `data.upi_id` | Ends with `@yesfam` |
| Deep-link Scheme | `upiIntent` | `data.upi_intent` | Valid `upi://pay` URI |
| QR Code URL | `qrUrl` | `data.qr_url` | Direct image URL |
