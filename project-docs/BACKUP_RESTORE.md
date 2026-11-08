# AnonTrove — Disaster Recovery, Backup & Restore Strategy

## 1. Resilience Philosophy

AnonTrove protects the catalog, orders, digital assets, and customer library entitlements through a multi-tiered backup architecture:

1. **Immutable Storage Snapshots:** Backblaze B2 lifecycle policies prevent accidental deletion.
2. **Catalog & Order Database Backups:** Automated daily SQLite/PostgreSQL dumps encrypted with AES-256 and replicated to an off-site cold storage bucket.
3. **Open-Source Tooling:** Full compatibility with `rclone` and `restic` for standard cloud-to-cloud synchronization.

---

## 2. Backup Tiers & Schedules

| Asset | Frequency | Tool / Strategy | Destination | Retention |
| :--- | :---: | :---: | :---: | :---: |
| **Orders & Customer Accounts** | Real-time / Daily | Supabase WAL / pg_dump | Encrypted Offsite S3 | 90 Days |
| **Catalog Metadata (`books_registry.json`)** | On every import / Daily | Git VCS + SQLite Snapshot | GitHub Repo + B2 Backups | Indefinite |
| **Ebook Vault (5 TB Objects)** | Continuous | B2 Versioning & Lifecycle | Secondary Bucket (Cloudflare R2) | 30 Days versions |
| **System Configuration (`.env`, docs)** | On change | Encrypted Git Crypt / 1Password | Secure Offline Vault | Indefinite |

---

## 3. Rclone Sync Configuration

`rclone` allows simple, automated mirror backups between Backblaze B2 and local storage or another cloud provider.

### `rclone.conf` Template:

```ini
[b2-anontrove]
type = b2
account = <your-keyID>
key = <your-applicationKey>
hard_delete = false

[backup-cold]
type = s3
provider = Cloudflare
access_key_id = <cf-r2-key>
secret_access_key = <cf-r2-secret>
endpoint = https://<account_id>.r2.cloudflarestorage.com
```

### Sync Command:

```bash
# Mirror private vault to cold storage backup bucket
rclone sync b2-anontrove:anontrove-private-vault backup-cold:anontrove-cold-mirror \
  --fast-list \
  --transfers 16 \
  --checkers 32 \
  --log-file /var/log/rclone_anontrove.log
```

---

## 4. Disaster Recovery & Restoration Procedure

### Scenario A: Accidental File Deletion in Primary B2 Bucket
Because object versioning is enabled on the `anontrove-private-vault` bucket:
1. Log into Backblaze B2 Web Console or use `b2` CLI.
2. Filter by "Show Hidden / Deleted Files".
3. Unhide / restore the deleted object version.

### Scenario B: Full Disaster Recovery (Database & Vault Re-sync)
If the database or storage server experiences catastrophic data loss:
1. **Restore Schema & Orders:**
   ```bash
   psql -h <db_host> -U postgres -d anontrove < backups/latest_orders_dump.sql
   ```
2. **Re-index Storage Objects:**
   Run the storage verification script to ensure all database records match the physical files in B2:
   ```bash
   node scripts/verify_storage_health.js
   ```
3. **Verify Pre-Signed Download Links:**
   Run the automated test suite to ensure token generation and 307 redirects resolve successfully.
