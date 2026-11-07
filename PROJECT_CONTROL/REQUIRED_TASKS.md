# REQUIRED TASKS FOR FULL PRODUCTION COMPLETION

The following mandatory tasks must be fulfilled to reach the project completion criteria defined in Section 13 of the Master Directive:

1. **Catalog Integrity & Asset Synchronization (MODULE B)**
   - Stage, commit, and push updated `data/books_registry.json` and cover artwork to repository.
   - Run duplicate detection and metadata verification across all catalog entries.

2. **Database Persistence & User Authentication (MODULE C & MODULE G)**
   - Create Supabase SQL schema migrations (`schema.sql`) for:
     - `users` (auth-linked profile)
     - `books` (synced catalog)
     - `orders` (purchased items, gateway, status, amount)
     - `user_library` (user access grants, reading progress, bookmarks)
   - Define Row-Level Security (RLS) policies ensuring users can only read their own purchased books.

3. **Storage Offloading & Streaming Adapter (MODULE G & MODULE H)**
   - Implement Cloudflare R2 bucket integration in `lib/storage/r2.ts` for large PDF/EPUB binaries.
   - Ensure `app/api/download/[token]/route.ts` can stream both from local storage and Cloudflare R2 pre-signed URLs transparently.

4. **Security CI/CD Workflows (MODULE G & MODULE H)**
   - Create `.github/workflows/security.yml` with automated Semgrep, Gitleaks, and dependency audit checks.
   - Ensure automated branch protection and secret leak prevention.

5. **Rate Limiting & Anti-Abuse (MODULE G)**
   - Implement IP-based sliding-window rate limiting on `/api/checkout` and download token retrieval.
