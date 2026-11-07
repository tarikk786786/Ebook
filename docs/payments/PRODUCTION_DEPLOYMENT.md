# PRODUCTION DEPLOYMENT & ENVIRONMENT SETUP

## 1. Required Production Environment Variables
Configure the following environment variables in the Vercel Project Settings (`https://vercel.com/`):

| Variable Name | Purpose | Sensitivity | Location |
|---|---|---|---|
| `FAMGATEWAY_API_KEY` | FamGateway merchant API key | High Secret | Vercel Environment Variables |
| `NEXT_PUBLIC_PAYMENT_GATEWAY` | Active gateway selector (`famgateway`) | Public | Vercel Environment Variables |
| `ADMIN_ACCESS_SECRET` | Guard secret for `/admin` routes | High Secret | Vercel Environment Variables |
| `DOWNLOAD_ENCRYPTION_SECRET` | AES-256 key for download tokens | High Secret | Vercel Environment Variables |
| `NEXT_PUBLIC_APP_URL` | Base canonical domain (`https://ebook-sandy-chi.vercel.app`) | Public | Vercel Environment Variables |

## 2. Deployment Steps
1. **Push Changes**:
   ```bash
   git push origin main
   ```
2. **Vercel Build Hook**:
   Vercel automatically triggers deployment on `git push` to `main`.
3. **Post-Deployment Smoke Test**:
   - Visit `https://ebook-sandy-chi.vercel.app`
   - Select an ebook and click "Buy eBook".
   - Confirm dynamic UPI QR renders.
   - Confirm PhonePe, GPay, Paytm, and generic UPI intent links open properly on mobile.
   - Confirm `/admin` returns HTTP 401 unauthorized when accessed without valid session header.
