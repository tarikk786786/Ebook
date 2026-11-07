# CHANGELOG — EBOOK ECOMMERCE PLATFORM

All notable changes to this project are documented in this file.

## [Unreleased]
- Initialized permanent `/PROJECT_CONTROL/` governance memory system.
- Staged updated `data/books_registry.json` containing 1,600+ catalog titles.
- Validated production build compilation (95/95 static pages cleanly rendered).
- Verified live production domain `https://ebook-sandy-chi.vercel.app` (HTTP 200, zero PII leak).

## [Commit 947a099] — 2026-11-07
### Added
- Complete premium digital ebook commerce suite.
- Cart Drawer and Cart Context with persistent storage.
- Multi-gateway payment core: Razorpay, Cashfree, and FamGateway.
- Webhook routes with constant-time HMAC validation.
- In-browser PDF.js and EPUB.js readers with watermarking.
- Customer Library and Order management screens (`/library`, `/orders`).
- Marketing automation client adapters (Listmonk, n8n, PostHog).

## [Commit f1a7206] — 2026-11-07
### Added
- Power table view switcher on storefront with instant search and active filter chips.
- Agency-grade design tokens in `tailwind.config.js`.

## [Commit b70b3b6] — 2026-11-07
### Security
- Complete scrub of personal developer details from repository.
- Standardized product metadata to professional ecommerce standard.
