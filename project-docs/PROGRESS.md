# AnonTrove — Implementation Progress Tracker

**Live Production URL:** [https://ebook-sandy-chi.vercel.app/](https://ebook-sandy-chi.vercel.app/)  
**Git Remote:** `https://github.com/tarikk786786/Ebook.git` (`main` branch)  
**Status Last Updated:** 2026-11-08 10:40 IST  

---

## High-Level Phase Overview

| Phase | Description | Status | Verification & Evidence |
| :--- | :--- | :---: | :--- |
| **Phase 1** | Project Audit & Production Restoration | **COMPLETE** | Fixed 404 covers (261 high-res), SSR 500 fixed, live probe 200 OK |
| **Phase 2** | Modular Storage Adapter Interface | **IN PROGRESS** | `lib/storage/types.ts` & local fallback implemented |
| **Phase 3** | Backblaze B2 S3-Compatible Adapter | **IN PROGRESS** | AWS SDK integration, signed URL redirects (307) |
| **Phase 4** | Database & Metadata Schema Extension | **PLANNED** | Supabase migration for storage objects, import logs, audit events |
| **Phase 5** | Autonomous Telegram Importer Worker | **PLANNED** | Python Telethon worker, PyMuPDF, SQLite state tracking |
| **Phase 6** | Admin Storage Management Dashboard | **PLANNED** | `/admin/storage` metrics, manual uploads, file audit table |
| **Phase 7** | Reader & Fulfillment Integrity | **IN PROGRESS** | Direct S3 pre-signed 15m download token verification |
| **Phase 8** | Backup, Recovery & Disaster Resilience | **PLANNED** | Restic / rclone automated snapshots, cold storage replication |
| **Phase 9** | End-to-End System Testing & Hardening | **IN PROGRESS** | FamPay live test passed, CSP hardened, edge rate limiting |

---

## Detailed Task Checklist

### Phase 1: Audit & Live Production Restoration
- [x] Audit all existing frontend, backend API routes, and catalog schema.
- [x] Trace cause of 404 cover images on live Vercel deployment: discovered 211 untracked `.jpg` files.
- [x] Stage and commit all 261 demanded covers with verified HTTP 200 OK on production.
- [x] Fix SSR 500 on dynamic book routes (`/book/[slug]`) by removing `outputFileTracing: false` and guarding tag iterations.
- [x] Enforce FamPay UPI (`famgateway.in`) exclusivity in Content-Security-Policy (CSP) and remove legacy Razorpay/Cashfree endpoints.
- [x] Configure default storefront sort to showcase demanded & bestseller titles with authentic covers first.
- [x] Verified live checkout endpoint `POST /api/checkout` generates valid UPI order ID (`fg_*`), intent string, and QR code.

### Phase 2: Modular Storage Adapter Interface
- [ ] Define `IStorageAdapter` TypeScript interface in `lib/storage/types.ts`:
  - `upload(key, buffer, mimeType, metadata)`
  - `multipartUpload(key, stream, size, mimeType)`
  - `download(key)`
  - `getSignedUrl(key, expiresInSeconds, filename)`
  - `delete(key)`
  - `getMetadata(key)`
  - `getChecksum(key)`
  - `testConnection()`
  - `getStorageUsage()`
- [ ] Implement `LocalStorageAdapter` in `lib/storage/adapters/local.ts` reading from `private_storage/` (zero-cost local fallback).
- [ ] Implement `StorageService` factory with automatic provider fallback and configuration validation.

### Phase 3: Backblaze B2 S3-Compatible Storage Adapter
- [ ] Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
- [ ] Implement `BackblazeB2Adapter` in `lib/storage/adapters/b2.ts`:
  - S3 Endpoint configuration: `s3.<region>.backblazeb2.com`
  - Bucket name: `anontrove-private-vault`
  - Client-side download pre-signing (15 minutes expiry) with `Content-Disposition: attachment; filename="..."`
  - SHA-256 checksum integrity verification.
- [ ] Refactor `app/api/download/[token]/route.ts`:
  - Token decryption & expiry check (24-hour validity)
  - Verify purchase in order store / database
  - Issue HTTP 307 temporary redirect to pre-signed B2 URL
  - Zero serverless memory buffer exhaustion.

### Phase 4: Supabase Database Schema Migration
- [ ] Create `supabase/migrations/20261108_storage_and_archive_schema.sql`:
  - `storage_providers` (B2, local, R2)
  - `storage_objects` (key, bucket, provider, size_bytes, sha256_hash, mime_type, encryption)
  - `ebooks` (enrichment metadata, isbn, page_count, language, description, demand_score)
  - `ebook_files` (relation between ebooks and storage objects, format, compression)
  - `ebook_covers` (high-res covers, thumbnails, hashes)
  - `ebook_rights` (licensing, DMCA status, copyright compliance)
  - `import_sources` (Telegram channels, local folders, webhooks)
  - `import_jobs` & `import_items` (batch ingestion logs, file status, deduplication records)
  - `download_events` (audit trail: user_id, order_id, ip, timestamp, user_agent)
  - `backup_jobs` & `storage_health` (periodic snapshot logs, latency, availability)

### Phase 5: Autonomous Telegram Importer Worker
- [ ] Implement `workers/telegram_importer.py`:
  - Telethon client initialization using credentials from `appinfo11.txt`
  - Whitelist filter for authorized channels
  - Format validation (`.pdf`, `.epub`, `.mobi`, `.cbz`, `.docx`)
  - MIME-type inspection and anti-malware extension verification
  - Cover extraction via PyMuPDF (PDF first page rendering) and EbookLib (EPUB cover item)
  - Deduplication via SHA-256 file hashing
  - Chunked streaming upload directly to Backblaze B2 / local storage
  - SQLite local tracking database for state persistence and resumable downloads
  - Rate-limit backoff handling FloodWait errors gracefully.

### Phase 6: Admin Storage Dashboard
- [ ] Build `/admin/storage` interface:
  - Current storage utilization across 5 TB quota
  - Total books count, formats breakdown, and bandwidth tracking
  - File health inspector and orphan detection
  - Manual upload tool with progress indicator.

---

## Live Production Verification Log

| Endpoint / Asset | Probe Type | Response | Status |
| :--- | :--- | :---: | :---: |
| `https://ebook-sandy-chi.vercel.app/` | GET | HTTP 200 OK | Verified |
| `https://ebook-sandy-chi.vercel.app/book/basics-of-equity-research-by-zebra-learn` | GET | HTTP 200 OK | Verified |
| `https://ebook-sandy-chi.vercel.app/covers/100m-money-models-how-to-make-money.jpg` | GET (image/jpeg) | HTTP 200 OK | Verified |
| `https://ebook-sandy-chi.vercel.app/api/checkout` | POST (FamPay UPI) | HTTP 200 OK (`orderId: fg_*`) | Verified |
