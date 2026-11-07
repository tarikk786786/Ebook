# TASK QUEUE — EBOOK ECOMMERCE PLATFORM

Current Queue ordered by execution priority:

### Priority P0: Critical Security & Hardening
- [ ] **SEC-001**: Setup GitHub Actions automated security scan workflow (`.github/workflows/security.yml`) covering Semgrep, Gitleaks, and audit checks.
- [ ] **SEC-002**: Implement rate limiting on `/api/checkout` and `/api/download/[token]` to protect against automated scraping or denial-of-service.

### Priority P1: Core E-Commerce & Persistence
- [ ] **ECOMM-001**: Verify and stage latest `data/books_registry.json` and cover assets for clean sync with repository.
- [ ] **ECOMM-002**: Define Supabase PostgreSQL DDL migration script for multi-user accounts, order tracking, and Row-Level Security (RLS) tables.
- [ ] **ECOMM-003**: Create Cloudflare R2 direct stream integration helper for offloading large PDF/EPUB binaries from Vercel deployment payload.

### Priority P2: Ingestion & Reader Enhancements
- [ ] **READ-001**: Verify PDF.js and EPUB.js cross-browser compatibility and offline fallback.
- [ ] **CAT-001**: Automate synchronization pipeline from `TG/TBooksUltimate` into `anon-trove-ebooks/data/books_registry.json`.

### Priority P3: Marketing & Analytics
- [ ] **MKT-001**: Configure automated order event webhook dispatch to n8n workflow endpoint for automated customer email receipts.
- [ ] **MKT-002**: Integrate PostHog event dispatch for `checkout_initiated`, `order_completed`, and `reader_opened`.

### Priority P4: Polish & Performance
- [ ] **PERF-001**: Optimize image delivery with Next.js sharp/image optimization for book covers.
- [ ] **A11Y-001**: Review ARIA labels on reader controls and cart drawer for full WCAG 2.1 compliance.
