# ARCHITECTURAL SPECIFICATION

## System Architecture Overview

AnonTrove is a modern, modular digital commerce application optimized for maximum privacy, zero telemetry leakage, ultra-low operating overhead, and high security.

### 1. Ingestion Subsystem (`TG/TBooksUltimate`)
- **Sources**: Telegram channels, local storage, external downloads.
- **Engines**: PyMuPDF (`fitz`), Pillow, SQLite.
- **Outputs**:
  - Extracted Page 1 covers saved to `public/covers/`.
  - Structured metadata records indexed in `data/books_registry.json`.
  - Duplication hashing and size normalization.

### 2. Next.js Web Storefront (`projects/anon-trove-ebooks`)
- **Next.js 14 App Router**:
  - Incremental Static Regeneration (ISR) and SSG for 80+ featured book detail routes.
  - Client-side reactive Cart Drawer with real-time total calculations in INR.
  - Multi-view catalog (Power Grid and Structured Table with instant filtering).
- **Security & Privacy Core**:
  - Ephemeral AES-256-GCM download tokens with 24-hour expiration.
  - Private file streaming proxy preventing file system traversal or storage path exposure.
  - Strict Content-Security-Policy headers and referrer policy `no-referrer`.
- **Payment Processing**:
  - Unified payment gateway interface supporting Razorpay, Cashfree, and FamGateway UPI.
  - Timing-safe HMAC webhook signature validation (`crypto.timingSafeEqual`).
- **Readers**:
  - PDF.js canvas-based viewer with watermarking and zoom.
  - EPUB.js pagination engine with theme support (Light, Sepia, Dark).
