# AnonTrove — Zero-Trace Privacy-First Ebook & PDF Store

> **Inspired by [Trove](https://github.com/X2-Consult/trove) Architecture**  
> Built with Next.js 14, Tailwind CSS, Vercel Serverless, and **FamGateway** (0.0% Fee Non-Custodial Automated UPI).

---

## 📖 1. Project Overview & Purpose

**AnonTrove** is a production-grade digital assets, eBook, and PDF selling storefront engineered specifically for maximum privacy, zero telemetry, and zero operating overhead using only 100% free cloud services (**GitHub** + **Vercel** + **FamGateway**).

### Key Architectural Pillars:
1. **0.0% Transaction Fees (FamGateway UPI)**: Non-custodial peer-to-peer automated payment settlement directly into merchant bank accounts without custodial intermediaries, rolling reserves, or gateway commissions.
2. **Zero GST & Current Account Exemption**: Fully compliant with Section 22 of the CGST Act, 2017 (turnover exemption under ₹20 Lakhs/year for indie creators and developers).
3. **Zero-Trace Privacy Engine**:
   - No customer databases or user registration required.
   - Zero logging of IP addresses, cookies, or browser fingerprints.
   - No Google Analytics, Meta Pixel, or telemetry trackers.
4. **Encrypted Webhook Verification**: All FamGateway webhook callbacks are cryptographically verified using timing-safe HMAC-SHA256 signatures (`crypto.timingSafeEqual`).
5. **Single-Use Ephemeral Stream Tokens**: Download URLs are encrypted with AES-256-GCM and decay automatically after 24 hours. Files are streamed from a secured server storage path (`private_storage/`), never exposing underlying bucket or file system URLs.

---

## 📂 2. Architecture & Directory Layout

```
projects/anon-trove-ebooks/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts             # Initiates FamGateway dynamic UPI session (Server-side)
│   │   ├── poll/
│   │   │   └── route.ts             # Public-safe client polling & token generator
│   │   ├── webhooks/
│   │   │   └── famgateway/
│   │   │       └── route.ts         # Timing-safe HMAC-SHA256 webhook handler
│   │   └── download/
│   │       └── [token]/
│   │           └── route.ts         # AES-256-GCM decrypted streaming delivery
│   ├── success/
│   │   └── page.tsx                 # Post-payment verified download screen
│   ├── globals.css                  # Custom styling & subtle ambient glow effects
│   ├── layout.tsx                   # Anti-telemetry layout with strict referrer policy
│   └── page.tsx                     # Trove-inspired minimal book showcase & shelf
├── components/
│   ├── Navbar.tsx                   # Header with live gateway status indicators
│   ├── BookCard.tsx                 # Trove aesthetic product card with preview & buy
│   ├── PreviewModal.tsx             # Table of Contents & sample chapter reader
│   ├── PaymentModal.tsx             # Dynamic QR, UPI intent deep-links & polling
│   └── FaqSection.tsx               # Privacy, legal, and payment FAQ
├── lib/
│   ├── catalog.ts                   # E-book catalog, prices (INR), excerpts, files
│   ├── crypto.ts                    # AES-256-GCM token cipher & timing-safe HMAC
│   └── famgateway.ts                # FamGateway client & public status checker
├── private_storage/                 # Private folder holding actual PDF & eBook files
│   ├── the-zero-trace-engineer.pdf
│   ├── high-volume-upi-protocols.pdf
│   ├── zero-to-prod-the-solo-architect.pdf
│   └── the-resilient-microservices-handbook.pdf
├── appinfo11.txt                    # Centralized credentials & API registry
├── .env.example                     # Environment template
├── .env.local                       # Local environment variables
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔐 3. Environment Variables & Credentials (`appinfo11.txt`)

All keys, tokens, and configuration parameters are documented in [`appinfo11.txt`](./appinfo11.txt):

| Variable Name | Purpose | Example / Default |
|---|---|---|
| `FAMGATEWAY_API_KEY` | FamGateway Merchant API Key for creating orders & signing webhooks | `fam_live_placeholder_key` |
| `FAMGATEWAY_BASE_URL` | FamGateway production endpoint | `https://famgateway.in` |
| `FAMGATEWAY_POLL_URL` | Public-safe client polling endpoint | `https://famgateway.in/api/checkout-status.php` |
| `DOWNLOAD_ENCRYPTION_SECRET` | 32-byte / 64-hex key used to encrypt AES-256-GCM tokens | `e7b4c91a82f3d64e9a1c5b8e2f0d4c7a9b1...` |
| `NEXT_PUBLIC_SITE_URL` | Hostname used for redirect callbacks | `http://localhost:3000` (Local) / Vercel domain |
| `PAYMENT_REDIRECT_URL` | Hosted checkout return URL | `http://localhost:3000/success` |

---

## 🚀 4. Setup, Installation & Local Testing

### Prerequisites
- Node.js 18.x or 20.x+
- npm or pnpm

### Step 1: Install Dependencies
```bash
cd projects/anon-trove-ebooks
npm install
```

### Step 2: Configure Environment
Ensure `.env.local` contains your active FamGateway API key and encryption secret:
```bash
cp .env.example .env.local
```

### Step 3: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Testing Payments
1. Click **"Buy with UPI"** on any eBook.
2. The modal instantly generates a live dynamic UPI QR code from FamGateway.
3. On mobile, tap **"Pay via PhonePe / GPay / Paytm / FamPay"** to trigger UPI deep-linking intent.
4. **Development Simulation Mode**: In local dev without scanning a live QR code, you can click **"🧪 Simulate Payment Confirmed (Testing Mode)"** at the bottom of the modal. It will instantly issue an authenticated AES-256-GCM download token and reveal the **"Download eBook (PDF)"** stream button.

---

## 🚢 5. 1-Click Free Deployment to Vercel & GitHub

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release of AnonTrove with FamGateway UPI"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

2. **Deploy on Vercel (100% Free Tier)**:
   - Go to [vercel.com](https://vercel.com) and import your GitHub repository.
   - Set the **Root Directory** to `projects/anon-trove-ebooks`.
   - In **Environment Variables**, add the variables from `appinfo11.txt`:
     - `FAMGATEWAY_API_KEY`
     - `DOWNLOAD_ENCRYPTION_SECRET`
     - `NEXT_PUBLIC_SITE_URL` (set to your Vercel deployment URL, e.g., `https://your-store.vercel.app`)
     - `PAYMENT_REDIRECT_URL` (`https://your-store.vercel.app/success`)
   - Click **Deploy**.

3. **Configure FamGateway Webhook URL**:
   - Log into your [FamGateway Merchant Dashboard](https://famgateway.in/dashboard).
   - Set your account Webhook URL to:
     `https://your-store.vercel.app/api/webhooks/famgateway`
   - FamGateway will now automatically dispatch signed HMAC-SHA256 postbacks on all incoming UPI payments.

---

## 🛡️ 6. DPDP Act 2023 & Security Compliance
- **Stateless Architecture**: No sensitive payment credentials, cards, or bank passwords ever pass through or reside on the application.
- **Timing-Safe HMAC Verification**: Protects against side-channel and timing attacks during signature verification.
- **Anti-Scraping / Anti-Hotlinking**: Files inside `private_storage` cannot be accessed via direct HTTP URL.
- **Cache-Control Defense**: Download responses enforce `no-store, no-cache, must-revalidate` to prevent intermediary caching or proxy data retention.

---

## 📄 License
MIT License. Free for personal, commercial, and indie developer usage.
