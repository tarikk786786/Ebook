# TASK REGISTRY — EBOOK ECOMMERCE PLATFORM

| Task ID | Module | Title | Priority | Status | Verification Evidence |
|---|---|---|---|---|---|
| TASK-001 | B (Catalog) | Forensic audit & catalog extraction from Telegram & local sources | P2 | COMPLETED_VERIFIED | `library-audit-final-report.md`, `books_registry.json` (1,697 items) |
| TASK-002 | G (Security) | Zero-trace privacy & personal information redaction | P0 | COMPLETED_VERIFIED | Git history scrubbed, `sanitize_privacy.py`, zero telemetry by default |
| TASK-003 | A (Storefront) | Trove-inspired minimal aesthetic UI with power table view switcher | P2 | COMPLETED_VERIFIED | Commit `f1a7206`, agency-grade design tokens in `tailwind.config.js` |
| TASK-004 | E (Payments) | Multi-gateway payment router (Razorpay, Cashfree, FamGateway) | P1 | COMPLETED_VERIFIED | Commit `947a099`, `lib/payments/` suite with unified factory |
| TASK-005 | E (Payments) | Timing-safe HMAC-SHA256 signature webhook handlers | P0 | COMPLETED_VERIFIED | `app/api/webhooks/razorpay/route.ts`, `app/api/webhooks/cashfree/route.ts` |
| TASK-006 | D (Readers) | In-browser PDF reader with watermarking & zoom controls | P2 | COMPLETED_VERIFIED | `components/reader/PdfReader.tsx`, PDF.js integration |
| TASK-007 | D (Readers) | In-browser EPUB reader with themes, bookmarks & progress | P2 | COMPLETED_VERIFIED | `components/reader/EpubReader.tsx`, EPUB.js integration |
| TASK-008 | C (Customer) | Client-side persistent cart and checkout drawer | P1 | COMPLETED_VERIFIED | `context/CartContext.tsx`, `components/CartDrawer.tsx` |
| TASK-009 | C (Customer) | Customer library and order fulfillment view | P1 | COMPLETED_VERIFIED | `app/library/page.tsx`, `app/orders/page.tsx` |
| TASK-010 | F (Marketing) | Multi-channel marketing automation (n8n, Listmonk, PostHog) | P3 | COMPLETED_VERIFIED | `lib/marketing/`, `lib/analytics/` |
| TASK-011 | B (Catalog) | Stage, commit & sync updated 1,600+ books registry and cover art | P2 | IN_PROGRESS | `data/books_registry.json` updated with 35k lines, covers in `public/covers/` |
| TASK-012 | G (Security) | Supabase PostgreSQL schema with RLS policies for multi-user accounts | P1 | REQUIRED | Schema definition & migration script needed |
| TASK-013 | G (Storage) | Cloudflare R2 object storage integration for large ebooks | P1 | REQUIRED | `lib/storage/r2.ts` adapter configured |
| TASK-014 | H (CI/CD) | Automated security scanner workflow (Gitleaks, Semgrep, CodeQL) | P0 | REQUIRED | `.github/workflows/security.yml` needed |
| TASK-015 | H (Deploy) | Production Vercel deployment with verified DNS & webhook bindings | P1 | PENDING | Vercel production deployment trigger |
| TASK-016 | E (Payments) | Razorpay & Cashfree live credential configuration | P0 | BLOCKED | Awaiting user's live production API keys |
| TASK-017 | F (Marketing) | Listmonk & n8n live production endpoint webhook binding | P3 | BLOCKED | Awaiting external self-hosted / cloud instance URLs |
