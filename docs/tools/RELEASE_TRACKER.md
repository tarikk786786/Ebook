# Ebook Tools & Resources — Automatic Release Tracker Architecture

**API Interface**: `/api/tools/releases`  
**Background Engine**: `scripts/sync_github_releases.py`  
**Rate Limit Strategy**: GitHub Personal Access Token (5,000 requests/hr) with static caching in `data/tools_registry.json`  
**Zero-Downtime Guarantee**: Next.js Static Site Generation (SSG) with on-demand API query fallback  

---

## 1. System Architecture

```
+-------------------------------------------------------------+
|                     GitHub REST API v3                      |
| (repos/{owner}/{repo}/releases/latest & tags)               |
+-------------------------------------------------------------+
                              |
                              | Authenticated Sync (GITHUB_TOKEN)
                              v
+-------------------------------------------------------------+
|             scripts/sync_github_releases.py                 |
| - Asset classification (Win, Mac, Linux, Android)           |
| - Checksum detection (SHA256 in release body/manifest)      |
| - Package manager command mapping                           |
| - Verification & integrity checks                           |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                data/tools_registry.json                     |
| (Atomic, version-controlled JSON record of 33 tools)        |
+-------------------------------------------------------------+
           |                                       |
           v                                       v
+----------------------+               +----------------------+
| Next.js App Router   |               |   /api/tools/releases|
| /tools               |               |   JSON API Endpoint  |
| /tools/[slug]        |               |   (Rate-limit safe)  |
+----------------------+               +----------------------+
```

---

## 2. API Specifications

### `GET /api/tools/releases`
Returns all registered tools or filtered subsets without consuming GitHub API quota on page visits.

**Parameters**:
- `slug` (optional): Retrieve a single tool's verified release details (e.g. `?slug=calibre`).
- `category` (optional): Filter by one of the 14 core categories.
- `os` (optional): Filter by operating system (`Windows`, `macOS`, `Linux`, `Android`).
- `format` (optional): Filter by supported ebook format (`EPUB`, `PDF`, `MOBI`).

**Sample Response**:
```json
{
  "success": true,
  "metadata": {
    "generatedAt": "2026-11-08 04:50:21 UTC",
    "totalTools": 33,
    "categoriesCount": 14,
    "sources": "Official GitHub Releases & REST API",
    "verifiedAuthenticCount": 33
  },
  "count": 33,
  "tools": [
    {
      "id": "calibre",
      "slug": "calibre",
      "name": "Calibre",
      "category": "Library Management",
      "stars": 21450,
      "latestRelease": {
        "version": "v9.18.0",
        "publishedAt": "2026-11-06T02:37:50Z"
      },
      "downloadsCount": 6,
      "verifiedAuthentic": true
    }
  ]
}
```

---

## 3. Scheduled & Administrative Sync Triggers

1. **CLI / Cron Job**:
   ```bash
   python scripts/sync_github_releases.py
   ```
2. **Admin Panel Trigger**:
   Accessible via `/admin/tools` for authorized administrators with `x-admin-token`.
3. **Cache Invalidation**:
   Static regeneration occurs during deployment or when the admin triggers a release approval.
