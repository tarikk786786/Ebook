# AnonTrove — Storage Architecture & Setup Guide (5 TB Target)

## 1. Storage Overview & Cost Analysis

AnonTrove requires scalable, private, cost-effective object storage to host over 5 TB of high-resolution digital books, audiobooks, and course material.

### Provider Cost Comparison (5 TB Capacity)

| Provider | Monthly Storage (5 TB) | Egress Bandwidth Cost | Monthly Total (Estimate) | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Backblaze B2 (Selected)** | **$30.00** ($0.006/GB) | **$0.00** (via Cloudflare Bandwidth Alliance) / $0.01/GB direct | **~$30.00 / month** | **Recommended.** Lowest cost S3-compatible enterprise storage. |
| **Cloudflare R2** | $75.00 ($0.015/GB) | $0.00 (Zero egress) | ~$75.00 / month | Alternative high-performance option. |
| **Wasabi Hot Cloud** | $34.95 ($0.0069/GB) | $0.00 (Included, with retention minimums) | ~$34.95 / month | 90-day minimum retention policy. |
| **AWS S3 Standard** | $115.00 ($0.023/GB) | ~$450.00 ($0.09/GB) | ~$565.00 / month | Cost-prohibitive for large media archives. |

> [!IMPORTANT]
> **Production Recommendation:** Backblaze B2 provides the exact balance of reliability, S3 API compatibility, and low cost ($30/month for 5 TB). The storage adapter architecture in `lib/storage` is completely modular, allowing seamless migration to Cloudflare R2 or AWS S3 without rewriting business logic.

---

## 2. Backblaze B2 Setup Instructions

### Step 1: Create Backblaze B2 Account & Private Bucket
1. Sign in to [Backblaze B2 Cloud Storage](https://www.backblaze.com/b2/cloud-storage.html).
2. Navigate to **Buckets** -> **Create a Bucket**.
3. Bucket settings:
   - **Bucket Unique Name:** `anontrove-private-vault` (or similar regionally unique name)
   - **Files in Bucket are:** **Private** (Crucial: never set to Public)
   - **Default Encryption:** Enabled (SSE-B2 / AES-256)
   - **Object Lock:** Disabled (unless strict WORM compliance is needed)
   - **Lifecycle Settings:** Keep only the last version of files (to avoid storage bloat on edits).

### Step 2: Generate Application Keys
1. Navigate to **App Keys** -> **Add a New Application Key**.
2. Key settings:
   - **Name of Key:** `anontrove-storage-worker`
   - **Allow access to Bucket(s):** `anontrove-private-vault`
   - **Type of Access:** Read and Write
   - **Allow List All Bucket Names:** No
3. Copy the **keyID** and **applicationKey** immediately.

### Step 3: Configure Environment Variables
Record credentials into `appinfo11.txt` and `.env.local`:

```env
# ==========================================
# Backblaze B2 Storage Configuration (S3-Compatible)
# ==========================================
STORAGE_PROVIDER=b2
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_REGION=us-east-005
B2_BUCKET_NAME=anontrove-private-vault
B2_KEY_ID=<your-keyID-from-b2>
B2_APPLICATION_KEY=<your-applicationKey-from-b2>
STORAGE_SIGN_EXPIRY_SECONDS=900
```

---

## 3. Storage Hierarchy & Object Key Conventions

To ensure fast indexing, deduplication, and easy backup management, objects in the bucket follow a strict deterministic naming pattern:

```text
anontrove-private-vault/
├── books/
│   ├── pdf/
│   │   └── {sha256_hash}.pdf
│   ├── epub/
│   │   └── {sha256_hash}.epub
│   └── mobi/
│       └── {sha256_hash}.mobi
├── covers/
│   ├── original/
│   │   └── {slug}.jpg
│   └── webp/
│       └── {slug}.webp
└── backups/
    └── snapshots/
        └── {YYYY-MM-DD-HHmm}.tar.gz.enc
```

- **Content-Addressable Storage (CAS):** Books are stored under their SHA-256 hash. If 5 duplicate copies of a book are imported from different channels, only 1 physical file is stored in B2, cutting storage overhead dramatically.
- **Metadata Mapping:** The database maps the human-readable slug/ID to the SHA-256 storage key and canonical filename.

---

## 4. Local Storage Fallback Mode

For local development or zero-cloud testing, AnonTrove includes a built-in `LocalStorageAdapter`:
- Set `STORAGE_PROVIDER=local` in `.env.local`.
- Files are saved to and read from `./private_storage/` in the project root.
- The pre-signed URL generator produces local verification tokens that stream securely via an authenticated internal endpoint.
