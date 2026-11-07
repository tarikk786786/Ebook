# FamGateway UPI Provider Specification & Integration Documentation

**Provider Name:** FamGateway (ARYANISPE / MSME UDYAM-BR-28-0050000)  
**Gateway Type:** Non-Custodial Automated Dynamic UPI Infrastructure (0.0% Processing Fee)  
**Official Endpoint:** `https://famgateway.in`  
**Active Merchant VPA:** `wowtarik@yesfam`  
**Verification Standard:** Server-to-Server HMAC-SHA256 & Poll S2S Verification  

---

## 1. Official Endpoints

### 1. Order Creation
- **URL:** `POST https://famgateway.in/api/create-order`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "api_key": "<FAMGATEWAY_API_KEY>",
    "amount": "29.00",
    "customer_name": "Customer Name",
    "customer_email": "reader@example.com",
    "customer_phone": "9876543210",
    "redirect_url": "https://ebook-sandy-chi.vercel.app/success?order_id=ORD_123",
    "webhook_url": "https://ebook-sandy-chi.vercel.app/api/webhooks/famgateway"
  }
  ```
- **Response Format:**
  ```json
  {
    "status": "success",
    "data": {
      "order_id": "fg_RRLZHZRD",
      "gateway": "fampay",
      "qr_url": "https://famgateway.in/api/qr-image.php?order_id=fg_RRLZHZRD",
      "checkout_url": "https://famgateway.in/pay.php?order_id=fg_RRLZHZRD",
      "upi_id": "wowtarik@yesfam",
      "amount": "29",
      "payable_amount": "29",
      "upi_intent": "upi://pay?pa=wowtarik@yesfam&pn=FamPay&tn=fg_RRLZHZRD&am=29.00&cu=INR",
      "created_at_ist": "08-11-2026 00:19:44",
      "expires_at_ist": "08-11-2026 00:29:44"
    }
  }
  ```

---

## 2. Order Status Verification

- **URL:** `GET https://famgateway.in/api/checkout-status.php?order_id={order_id}`
- **Pending Response:**
  ```json
  {
    "status": "pending"
  }
  ```
- **Success Response:**
  ```json
  {
    "status": "success",
    "order_id": "fg_RRLZHZRD",
    "amount": "29.00",
    "utr": "428910293847",
    "transaction_id": "TXN_77812930"
  }
  ```
- **Expired Response:**
  ```json
  {
    "status": "expired"
  }
  ```

---

## 3. Webhook Callback Specification

- **Method:** `POST`
- **Header:** `X-FamGateway-Signature`
- **Algorithm:** `HMAC-SHA256(raw_body, FAMGATEWAY_API_KEY)`
- **Body:**
  ```json
  {
    "event": "payment.success",
    "order_id": "fg_RRLZHZRD",
    "amount": "29.00",
    "utr": "428910293847"
  }
  ```
