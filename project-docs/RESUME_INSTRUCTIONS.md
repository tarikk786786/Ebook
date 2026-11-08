# AnonTrove — Operator & AI Session Resume Instructions

## 1. Quick Context for Incoming Agents / Operators

- **Project:** AnonTrove Ebook Commerce & Secure Library Platform
- **Website:** [https://ebook-sandy-chi.vercel.app/](https://ebook-sandy-chi.vercel.app/)
- **Repository Location:** `c:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks`
- **Git Remote:** `https://github.com/tarikk786786/Ebook.git` (`main` branch)
- **Primary Payment Rail:** **FamPay API ONLY** (`wowtarik@yesfam` via FamGateway). Never reintroduce Razorpay, Cashfree, PayGic, or other providers.
- **Primary Storage Strategy:** 5 TB Backblaze B2 S3-compatible private vault with modular storage adapter interface (`lib/storage`).

---

## 2. Credentials Reference

- Centralized secret record: `appinfo11.txt` (located at workspace root and project root).
- Contains FamGateway keys, Supabase credentials, and Telegram MTProto credentials.
- **NEVER** expose, commit, or print these secrets in plain text in chat or GitHub.

---

## 3. How to Verify System State

```bash
# 1. Check git status
cd "c:\Users\tarik\Downloads\EBOOKS SELLING\projects\anon-trove-ebooks"
git status

# 2. Run local development server
npm run dev

# 3. Test production endpoints
curl -I https://ebook-sandy-chi.vercel.app/
curl -I https://ebook-sandy-chi.vercel.app/book/basics-of-equity-research-by-zebra-learn
curl -I https://ebook-sandy-chi.vercel.app/covers/100m-money-models-how-to-make-money.jpg

# 4. Run test order generation (FamPay UPI)
node scripts/test_fampay_live.js
```

---

## 4. Immediate Next Steps / Roadmap

1. **Storage Adapter Modules:** Review `lib/storage/types.ts` and `lib/storage/adapters/b2.ts`.
2. **Pre-Signed Delivery:** Verify `/api/download/[token]/route.ts` issues HTTP 307 redirects to B2 pre-signed URLs.
3. **Database Migration:** Apply `supabase/migrations/20261108_storage_and_archive_schema.sql` on Supabase to support storage objects and download event tracking.
4. **Telegram Importer Worker:** Run `python workers/telegram_importer.py` to ingest and deduplicate library items from authorized archive channels.
