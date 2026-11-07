# Free-Tier Boundaries, Licenses & Rate Limit Safeguards

**Project Reference ID:** `39cff687-937b-45ce-ae7e-7faf92fe844f`

---

## 1. API Quotas & Rate Limits

| Service / Provider | Free-Tier Quota | Enforced Throttle / Policy | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Telegram MTProto** | Dynamic / account-based | `FloodWaitError` on rapid fetches | Exponential backoff sleep (`wait_time + 2s`) |
| **Open Library API** | ~100 requests / minute | Soft rate limit | In-memory ISBN cache, 0.5s inter-request delay |
| **Google Books API** | 1,000 queries / day | HTTP 429 quota block | Fallback to Open Library & Crossref |
| **Internet Archive API** | Generous public pool | Polite user-agent required | Header identification: `User-Agent: TBooks-Research-Bot/1.0` |
| **Crossref API** | Polite pool | 50 requests / second | Mailto header declaration in requests |
| **Vercel Serverless** | 10s execution timeout (Hobby) | Build timeout on large SSG | Decoupled background Python worker + `dynamicParams = true` |

---

## 2. Storage Free Tier Guidelines

1. **Local Disk Vault (`private_storage/`)**:
   * Storage is bounded only by host drive space (~12.8 GB currently indexed).
   * Files served securely via one-time signed HMAC tokens.
2. **Cloudflare R2 Compatibility**:
   * Free Tier: 10 GB storage / month, 10M Class B operations (reads), 1M Class A operations (writes).
   * 0% egress fees. Adapter implemented in `lib/storage.ts`.
3. **Telegram Cloud Storage**:
   * Persistent message storage on Telegram cloud servers using channel message IDs.
   * DRM-free digital backup with zero cloud storage costs.
