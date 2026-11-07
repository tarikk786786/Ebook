# MASTER PROJECT SPECIFICATION & CONTINUOUS EXECUTION DIRECTIVE

## 1. Project Identification
- **Project Name**: AnonTrove — Premium Ebook & PDF Ecommerce Platform
- **Repository**: `https://github.com/tarikk786786/Ebook.git`
- **Local Application Root**: `C:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks`
- **Telegram Downloader & Ingestion Subsystems**: `C:\Users\tarik\Downloads\TG\TBooksUltimate`
- **Master Credential & Registry File**: `appinfo11.txt`
- **Active Git Branch**: `main`
- **Latest Commit**: `947a099dc1c2939d754246192edf2b79fcdc5ed7`

## 2. Core Business Purpose
To build, deploy, operate, and maintain an independent, premium, privacy-first digital ebook and document ecommerce store with:
- PDF and EPUB format support
- Multi-gateway checkout (Razorpay, Cashfree, and FamGateway 0% fee non-custodial UPI)
- Dynamic in-browser secure reader (PDF.js, EPUB.js) with reading progress, bookmarks, and watermarking
- Single-use AES-256-GCM ephemeral download streaming tokens (no direct bucket URL exposure)
- Customer Library & Order Management (Supabase PostgreSQL + local client persistence)
- Full catalogue ingestion (1,600+ verified titles, bundles, and instant search)
- Marketing automation (PostHog, Listmonk, n8n, social marketing)
- Full enterprise security hardening (Cloudflare WAF, timing-safe HMAC verification, zero-trace telemetry options, and automated CI scans)

## 3. Technology Stack & Architectural Matrix
| Component | Technology | Role |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | High-performance serverless web application |
| **Language** | TypeScript / Modern ES2023 | Type-safe business and API logic |
| **Styling** | Tailwind CSS & PostCSS | Dark aesthetic, agency-grade design tokens |
| **Hosting & CDN** | Vercel Serverless + Edge Network | Global edge CDN, automated deployment |
| **Database** | Supabase (PostgreSQL 15) | Orders, licenses, bundles, customers |
| **Storage** | Cloudflare R2 + Local Private Storage | Zero-egress private asset streaming |
| **Payments** | Razorpay, Cashfree & FamGateway | INR/International UPI, Cards, NetBanking |
| **Readers** | PDF.js & EPUB.js | Watermarked, in-browser instant reading |
| **Automation** | n8n, Listmonk & PostHog | Webhook workflows, notifications, analytics |
| **Security** | AES-256-GCM, HMAC-SHA256, WAF | Cryptographic tokens, timing attack mitigation |

## 4. Master Completion Criteria
The platform reaches production completion when:
1. All catalog items load with high-resolution covers and metadata.
2. In-browser PDF & EPUB readers function smoothly without exposing source file paths.
3. Cart and checkout process seamlessly across Razorpay, Cashfree, and UPI.
4. Webhooks process idempotently with timing-safe signature validation.
5. Customer orders populate library with active read/download grants.
6. Supabase schema migrations and RLS policies are applied.
7. Vercel deployment is verified live with zero runtime errors.
8. Automated tests and security audits pass without critical findings.
