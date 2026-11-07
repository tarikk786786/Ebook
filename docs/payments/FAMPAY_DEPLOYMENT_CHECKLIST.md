# FAMPAY DEPLOYMENT CHECKLIST & ENVIRONMENT VERIFICATION

## 1. Environment Variables Verification
Ensure the following variables are configured in the Vercel Dashboard (`Settings -> Environment Variables`):

- `FAMGATEWAY_API_KEY`: Secret merchant key (configured server-side only).
- `ADMIN_ACCESS_SECRET`: Constant-time session token for `/admin` routes.
- `DOWNLOAD_ENCRYPTION_SECRET`: AES-256 secret key for signing download tokens.
- `NEXT_PUBLIC_APP_URL`: Canonical site domain (`https://ebook-sandy-chi.vercel.app`).
- `MERCHANT_UPI_VPA`: Merchant UPI handle (`[REDACTED]@yesfam`).

## 2. Pre-Deployment Integrity Checks
- [x] All legacy gateways (Razorpay, Cashfree, PayGic) purged from codebase.
- [x] All dev simulation triggers and mock payment buttons eradicated.
- [x] Server-authoritative pricing enforced across checkout routes.
- [x] Anti-BOLA/IDOR order-asset binding verified.
- [x] Strict payment lifecycle implemented (`CREATED` -> `PENDING` -> `SUCCESS` -> immutable).
- [x] Dual-verification webhook receiver configured with upstream fallback.
- [x] Client UI streamlined for exclusive FamPay UPI experience.
- [x] Full production build compiled with 0 errors.

## 3. Post-Deployment Smoke Test
1. Visit `https://ebook-sandy-chi.vercel.app/`.
2. Open any ebook product page and click "Buy eBook".
3. Verify that FamPay UPI QR renders clearly.
4. Verify that "Pay via FamPay / UPI App" deep link points to `upi://pay?pa=...`.
5. Verify that "I have paid — Check Status Now" button triggers bank verification without error.
