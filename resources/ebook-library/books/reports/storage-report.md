# TBOOKS Storage Architecture & Inventory Report

**Project Reference ID:** `39cff687-937b-45ce-ae7e-7faf92fe844f`

---

## 1. Storage Distribution

* **Local Private Vault (`private_storage/`):**
  * Total files: 1,697 files
  * Total storage size: ~12.8 GB
  * Security model: Direct disk access blocked; served via tokenized route `/api/download/[token]` with AES-256-GCM tokens.
* **Public Covers Directory (`public/covers/`):**
  * Total images: 1,772 high-resolution JPG files
  * Average cover size: 28 KB
  * Total covers disk space: ~48 MB
  * Served via Next.js static asset pipeline with edge cache headers.
* **Telegram Cloud Storage:**
  * Persistent storage across 5 private/channel peers.
  * Message IDs mapped directly to book records in `books_registry.json`.
